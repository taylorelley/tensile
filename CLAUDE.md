# Tensile — Codebase Guide for AI Assistants

## Project Overview

**Tensile** (product name "Forge") is an offline-first Progressive Web Application (PWA) for powerlifters. It generates and adapts strength training programs using a deterministic, rules-based expert system — no machine learning, no backend, no API calls. All computation and data storage happen client-side.

- **Stack**: React 19 + TypeScript 6 + Zustand 5 + Vite 8 + React Router DOM 7
- **Storage**: IndexedDB (primary) with localStorage fallback, via Zustand persist middleware
- **PWA**: vite-plugin-pwa + Workbox; auto-updates; manifest at `tensile-app/vite.config.ts`
- **No server**: Zero backend. The app is entirely self-contained on the user's device.

The authoritative product spec is `PRD.md` (~100KB). Every algorithm, data structure, and feature decision traces back to a section in that document.

---

## Repository Layout

```
tensile/                         ← git root; CLAUDE.md lives here
├── PRD.md                       ← authoritative product spec (~100KB)
├── TODO.md                      ← development roadmap / task checklist
├── docs/
│   └── program-generation.md   ← 7-step block generator walkthrough
└── tensile-app/                 ← npm project; run ALL commands from here
    ├── src/
    │   ├── main.tsx             ← React entry: BrowserRouter + root mount
    │   ├── App.tsx              ← route tree (42 routes, onboarding gate)
    │   ├── engine.ts            ← ALL algorithm logic (~1460 LOC)
    │   ├── store.ts             ← Zustand store + block generator (~1500 LOC)
    │   ├── exerciseCatalog.ts   ← 130+ exercises with metadata and EFC values
    │   ├── shared.tsx           ← design tokens (T object) + shared components
    │   ├── idbStorage.ts        ← IndexedDB adapter with localStorage fallback
    │   └── screens/             ← 32 route-based screen components (~7100 LOC)
    │       ├── onboarding/      ← Welcome, Biometrics, Baselines, WeakPoint,
    │       │                       History, Schedule, FirstBlock
    │       ├── session/         ← Today, Wellness, Readiness, Warmup, TopSet,
    │       │                       DropProtocol, Summary, Override, VbtCalibration, …
    │       ├── block/           ← Performance, Volume, Readiness, WeakPointReview,
    │       │                       Audit, NextBlock
    │       ├── deload/          ← DeloadRec, DeloadStructure, Pivot
    │       ├── meet/            ← MeetSetup, Peaking, Attempts
    │       ├── plan/            ← PlanEditor
    │       ├── lifts/           ← LiftsLibrary
    │       └── Settings.tsx
    ├── replay/                  ← algorithm validation harness (not Jest/Vitest)
    │   ├── cli.ts               ← replay runner CLI
    │   ├── golden.json          ← committed baseline metrics (5% regression gate)
    │   └── fixtures/            ← synthetic + recorded test cases
    ├── public/                  ← PWA icons (192×192, 512×512 PNG)
    ├── vite.config.ts           ← PWA manifest, Workbox, build config
    ├── tsconfig.app.json        ← ES2023 target, bundler module resolution
    ├── tsconfig.json            ← references app + node configs
    ├── eslint.config.js         ← ESLint 10 flat config
    └── package.json             ← scripts: dev, build, lint, preview, replay*
```

---

## Development Commands

All commands run from `tensile-app/`:

```bash
npm run dev              # Vite dev server with HMR
npm run build            # tsc -b then vite build (type-check + bundle)
npm run lint             # ESLint across all .ts/.tsx
npm run preview          # Preview production build locally

# Algorithm validation (replay harness)
npm run replay                          # Run linearGain synthetic fixture
npm run replay -- --fixture stall       # Run stall detection fixture
npm run replay -- --fixture falsePeak   # Run false-peak fixture
npm run replay:grid                     # Sweep algorithm constants (grid search)
npm run replay:gate                     # Gate against golden.json — exit 1 if >5% regression
```

Run `npm run replay:gate` before opening a PR that touches `engine.ts` or algorithm constants.

---

## Architecture

Three clear layers with unidirectional data flow:

```
engine.ts          Pure functions; no state; all algorithms
    ↓ called by
store.ts           Zustand store; owns all state; calls engine; generates blocks
    ↓ subscribed by
screens/           React components; read store via selectors; dispatch actions
```

**State management pattern**: Components never hold domain state — they subscribe to the single Zustand store with selector hooks:

```typescript
const profile = useStore(s => s.profile);
const logSet = useStore(s => s.logSet);
```

Zustand persist middleware serialises the entire store to IndexedDB on every write, providing offline durability.

---

## Core Modules

### `engine.ts` — Algorithm Engine

Pure-function expert system. No side effects, no state. Nine algorithm subsystems:

| Subsystem | Key Function(s) | PRD §  |
|-----------|----------------|--------|
| e1RM ensemble (3-method) | `ensembleE1RM()` | 6.1 |
| RPE table personalisation (EWMA) | `personalizeRpeTable()`, `projectMonotoneRpeTable()` | 6.1 |
| Session Fatigue Index | `calculateSessionSFI()` | 6.3 |
| Readiness Composite Score | `calculateRCS()` | 6.4 |
| Peak / stall detection | `detectPeak()`, `detectStall()` | 6.5 |
| Deload score & trigger (8 signals) | `calculateDeloadScore()` | 6.8 |
| Weak-point engine | `getAccessoryTemplate()` | 6.7 |
| Volume budget (MEV/MRV) | `volumeBudget()` | 6.6 |
| Programmatic scheduler | `assignPrimaryLiftsTodays()`, `estimateMuscleReadiness()`, `computeWeeklyMuscleTargets()`, `buildProgrammaticSession()`, `planMicrocycle()`, `planBlock()`, `planProgram()` | — |

All tunable constants live in `EngineConstants` (accessed via `getConstants()` / `setConstants()`), enabling the replay harness to sweep parameters without touching source.

**Outlier detection**: Modified-Z (Iglewicz–Hoaglin) + per-cell MAD rolling windows guard the RPE personalisation pipeline against noise.

### `store.ts` — State + Block Generator

The Zustand store owns all application state and contains the block generation pipeline. Key store slices:

- `profile` — `UserProfile`: biometrics, per-lift e1RMs, RPE table, rolling windows, weak-point streaks, HRV history, TTP estimate, programming mode
- `currentBlock` — active `Block` with sessions, weekly volume rollups, audit log
- `currentSession` — in-progress session (not persisted; restored on mount from `currentBlock`)
- `completedBlocks` — historical blocks used by block-review screens

**Block generation (7 steps)**:
1. Pick phase (Accumulation → Intensification → Realisation cycle; meet-date aware via `planProgram()`)
2. Lay out weeks snapped to Monday, span = TTP estimate
3. Assign primary lifts to days via exhaustive permutation search (≥48 h squat–deadlift gap enforced)
4. Apply phase RPE/rep/set modifiers to PRIMARY
5. Greedy accessory selection scored by muscle deficit vs MEV/MRV target, muscle readiness (exponential fatigue decay), push/pull movement-pattern balance, weak-point priority, and accessory responsiveness
6. Compute prescribed loads from e1RM × RPE table lookup
7. SFI budget + duration cap enforced during greedy selection (not post-hoc trim)

See `docs/program-generation.md` for the full annotated walkthrough.

### `exerciseCatalog.ts` — Exercise Database

84+ exercises each with:
- `tag`: `'PRIMARY' | 'ASSIST' | 'SUPP' | 'CORE'` — determines role; PRIMARY is the only tag that receives phase modifiers
- `efc`: Exercise Fatigue Coefficient (e.g. squat = 1.40, cable flyes = 0.55) — used in SFI and muscle readiness half-life selection
- `primaryMuscles`: array for volume-budget tracking (MEV/MRV) and weekly deficit scoring
- `weakPointTargets`: failure positions this exercise addresses (used as a scoring multiplier in the greedy selector)
- `movementPattern`: `MovementPattern` type — used by the scheduler for push/pull session balance
- `defaultSets / defaultReps / defaultRpe`: block-generation starting values

### `shared.tsx` — Design System

Exports a `T` design token object consumed everywhere via inline styles:

```typescript
T.bg        // #0d0c0a  — page background
T.surface   // #15130f  — card/panel background
T.accent    // #ff6e3a  — orange CTA/highlight
T.good      // #7fb37a  — positive signal
T.bad       // #d56a55  — negative signal
T.text      // #f5f0e8  — primary text
T.muted     // #7a7368  — secondary text
T.font      // 'Geist', sans-serif
T.serif     // 'Instrument Serif', serif
T.mono      // 'JetBrains Mono', monospace
```

Shared UI components: `Phone`, `TabBar`, `AppHeader`, `PrimaryBtn`, `SecondaryBtn`, `Spark`, `Stat`.

### `idbStorage.ts` — Storage Adapter

Custom Zustand persist storage adapter. Writes to IndexedDB (`tensile-db`, store `tensile-store`), falls back to localStorage if IndexedDB is unavailable. Performs a one-time migration from old localStorage builds on first load.

---

## Data Model

Key TypeScript types (defined in `store.ts` and `engine.ts`):

```typescript
type LiftKey = 'squat' | 'bench' | 'deadlift';

type BlockPhase = 'ACCUMULATION' | 'INTENSIFICATION' | 'REALISATION'
                | 'DELOAD' | 'PIVOT';

type BlockType = 'DEVELOPMENT' | 'DELOAD' | 'PIVOT' | 'PEAK';

type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE' | 'SKIPPED';

type ProgrammingMode = 'TRADITIONAL' | 'TTP';  // TTP = bottom-up time-to-peak

// Exercise tag — also determines session trim order (SUPP first, PRIMARY last)
type ExerciseTag = 'PRIMARY' | 'ASSIST' | 'SUPP' | 'CORE';
```

**Core entities**:

| Entity | Key Fields |
|--------|-----------|
| `UserProfile` | biometrics, `e1rms: Record<LiftKey, number>`, `rpeTable`, `ttpEstimate`, `weakPoints`, `hrvBaseline`, `programmingMode` |
| `Block` | `type`, `phase`, `sessions: Session[]`, `weeklyVolume`, `auditLog: AuditEntry[]` |
| `Session` | `exercises: SessionExercise[]`, `wellness`, `rcs`, `sfi`, `status` |
| `SessionExercise` | `exerciseId`, `tag`, `sets`, `reps`, `rpeTarget`, `prescribedLoad`, `setLogs: SetLog[]` |
| `SetLog` | `actualLoad`, `actualReps`, `actualRpe`, `velocity?`, `e1rm`, `sfi` |
| `AuditEntry` | `timestamp`, `ruleId`, `trigger`, `action`, `evidenceTier` |
| `EngineConstants` | All 20+ tunable algorithm parameters (EMA weights, gate thresholds, deload weights, …) |

---

## Conventions

### Naming

| Pattern | Example |
|---------|---------|
| Screen components | `PascalCase.tsx` — `ReadinessBrief.tsx`, `DeloadRec.tsx` |
| Store actions | `camelCase` — `logSet`, `startSession`, `generateNextDevelopmentBlock` |
| TypeScript types/interfaces | `PascalCase` — `UserProfile`, `SetLog`, `EngineConstants` |
| Constants | `SCREAMING_SNAKE_CASE` — `DEFAULT_CONSTANTS`, `DB_NAME` |
| Engine functions | verb-prefix — `calculate*`, `detect*`, `personalize*`, `estimate*`, `resolve*`, `infer*` |

### Styling

- **Always use `T` tokens** — never hardcode hex colours or font strings
- **Inline styles only** — no CSS modules, no CSS-in-JS libraries, no Tailwind
- **Mobile-first flexbox** — no breakpoints; the app is a mobile PWA
- Do not add `className` unless integrating with a third-party component that requires it

### State Access

```typescript
// Good — fine-grained selector
const profile = useStore(s => s.profile);

// Avoid — subscribes to entire store, causes unnecessary re-renders
const store = useStore();
```

### Audit Trail

Every system decision that modifies a block must append an `AuditEntry` with:
- `ruleId`: short machine-readable identifier (e.g. `'DELOAD_SCORE_STRONG'`)
- `evidenceTier`: `'VALIDATED'` | `'HEURISTIC'` | `'PROPRIETARY'`
- `trigger`: human-readable description of why the rule fired
- `action`: what was done

### Evidence Tiers

All PRD claims and corresponding code behaviour are annotated with one of:
- `VALIDATED` — supported by peer-reviewed literature
- `HEURISTIC` — established coaching practice without RCT evidence
- `PROPRIETARY` — app-specific algorithm design choice

Use these annotations in comments when adding new algorithmic logic.

---

## Testing / Replay Harness

**There is no Jest or Vitest.** Algorithm correctness is validated by a custom replay harness in `tensile-app/replay/`.

### How It Works

The harness drives `engine.ts` functions through synthetic training histories (fixtures) and measures emergent metrics:

| Metric | Meaning |
|--------|---------|
| `rpePredictionMAE` | Mean absolute error of RPE→%1RM prediction |
| `e1rmSmoothness` | Sum of squared second differences of rolling e1RM (lower = smoother) |
| `overrideFrequency` | Fraction of sessions with OVERRIDE audit entries |
| `falsePeakRate` | Fraction of detected peaks followed by continued progress |
| `durationTrimIncidence` | Fraction of sessions trimmed to fit duration cap |

### Fixtures

| Name | Scenario |
|------|---------|
| `linearGain` | Steady weekly e1RM progress — tests normal operation |
| `stall` | Plateaued progress — tests stall/deload triggering |
| `falsePeak` | Temporary dip then recovery — tests false-peak suppression |
| `noisy` | High RPE variance — tests outlier detection robustness |

### Gate (required before merging engine changes)

```bash
cd tensile-app
npm run replay:gate
# Exit 0 = all metrics within 5% of golden.json
# Exit 1 = regression detected; update algorithm or run --write-golden if intentional change
```

To accept an intentional change: `npm run replay -- --write-golden` then commit the updated `golden.json`.

---

## Important Constraints

1. **Client-side only** — No server, no API calls, no authentication. Do not add network dependencies.
2. **Single-device** — Multi-device sync is explicitly out of scope. Do not add sync logic.
3. **Peaking mode locks development** — While a meet/peak block is active, `generateNextDevelopmentBlock` must be blocked. Check `currentBlock.type === 'PEAK'` before generating.
4. **Programming mode switching** (`TRADITIONAL` ↔ `TTP`) is deferred to the next block boundary — never mid-block.
5. **No CI/CD pipeline** — All validation is local via `npm run replay:gate`.
6. **Algorithm constants are in `EngineConstants`** — Do not hardcode magic numbers in logic; add them to the constants object so the replay harness can sweep them.
7. **Onboarding gate** — The app rejects trainees with <6 months of training history; this is a safety/efficacy constraint, not a bug.

---

## Key Reference Documents

| Document | Purpose |
|----------|---------|
| `PRD.md` | Authoritative product spec; every feature and algorithm is defined here |
| `docs/program-generation.md` | Step-by-step block generation pipeline with annotated examples |
| `TODO.md` | Current development roadmap; check before starting a feature to avoid duplication |
| `tensile-app/replay/golden.json` | Committed algorithm performance baselines |
