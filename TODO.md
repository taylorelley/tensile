# Tensile — Known Remaining Tasks

> Auto-generated from codebase audit against PRD §4–§7.
> Last updated: 2026-05-16

---

## 1. Volume Budget Algorithm (PRD §6.5) — IMPLEMENTED

**Status:** Muscle-group tracking wired across the data model and `Volume.tsx`.

**Completed:**
- ✅ `CatalogEntry.primaryMuscles: string[]` added to all 84 built-in exercises.
- ✅ `SessionExercise.primaryMuscles` added; populated from catalog in `createDayPlan`.
- ✅ `Session.muscleGroupVolume: Record<string, number>` tracks sets per muscle group per session.
- ✅ `Block.weeklyMuscleVolume: Record<number, Record<string, number>>` aggregates completed-session volume by week.
- ✅ `logSet` increments `muscleGroupVolume` for each exercise's primary muscles.
- ✅ `completeSession` rolls session volume into `block.weeklyMuscleVolume`.
- ✅ `Volume.tsx` renders per-muscle-group bar charts with MEV/MAV/MRV reference lines.
- ✅ `LiftsLibrary.tsx` editor allows selecting primary muscles for custom exercises.
- ✅ Volume budget card in `Today.tsx` shows current week vs MEV/MAV/MRV for session muscle groups.

**Still needed:**
- In `createDayPlan`, call `volumeBudget()` per muscle group and dynamically cap/extend sets (currently static templates with weak-point bias).

---

## 2. Weak Point Engine (PRD §4.9, §6.7) — IMPLEMENTED

**Status:** Data model supports weak-point targeting; selection logic wired.

**Completed:**
- ✅ `CatalogEntry.weakPointTargets: { liftId: string; position: string }[]` added (e.g. `paused_squat` targets `squat:out_of_hole`).
- ✅ `getAccessoryTemplate(primaryLift, blockPhase, weakPoints, catalog)` in `engine.ts` biases selection toward weak-point-targeting exercises (priority score ×1.5).
- ✅ `createDayPlan` uses `getAccessoryTemplate` to swap ASSIST/SUPP exercises toward weak-point targets.
- ✅ At block end, `generateNextDevelopmentBlock` computes Pearson r between each accessory's weekly volume and primary lift e1RM delta.
- ✅ Correlation stored in `profile.accessoryResponsiveness` if |r| > 0.4 and n ≥ 6.
- ✅ `WeakPointReview.tsx` surfaces stored correlation findings with mini bar charts.

**Still needed:**
- Reach 200 exercises at launch (currently 84; additional 116 needed).
- Add exercise images/demos.

---

## 3. RPE-to-Percentage Table Personalisation (PRD §4.2.2, §6.1) — IMPLEMENTED

**Status:** `personalizeRpeTable()` updates the user's table from every logged set.

**Completed:**
- ✅ `personalizeRpeTable()` function in `engine.ts` computes observed %1RM and applies EWMA (α=0.1).
- ✅ `logSet` calls `personalizeRpeTable()` after each set, updating `profile.rpeTable`.
- ✅ `rpeCalibration.sessions` increments on every logged set.
- ✅ Table flagged as personalised after ≥20 keys have deviated from default.
- ✅ `TopSet.tsx` shows a "Table source" indicator (population vs personalised).
- ✅ Outlier rejection for bad RPE calls (`isRpeOutlier()` flags >15% deviation; table not updated).

---

## 4. Peaking Scheduler UI Wiring (PRD §6.9, §7.7) — IMPLEMENTED

**Status:** `Peaking.tsx` renders timeline and feasibility warnings.

**Completed:**
- ✅ `generatePeakingPlan()` called with `profile.meetDate` and `profile.ttpEstimate`.
- ✅ Backwards-scheduled timeline rendered: Development → Pivot → Realisation → Taper → Meet.
- ✅ Feasibility warning shown when `weeksAvailable < requiredWeeks` with three options from PRD §6.9.
- ✅ Lock development block phase once peaking plan is active (`profile.peakingActive`).
- ✅ `generateNextDevelopmentBlock` returns early when `peakingActive` is true.
- ✅ "Activate peaking" button in `Peaking.tsx` sets the flag; visual indicator when active.

**Still needed:**
- Highlight development block start date in calendar view.

---

## 5. Block Review — Full Analytics (PRD §7.4) — IMPLEMENTED

**Status:** Audit log, volume charts, and readiness trends all wired.

**Completed:**
- ✅ `Block.auditLog` added; appended by `completeSession` on week completion.
- ✅ `Audit.tsx` renders engine decisions with evidence-tier badges.
- ✅ `Volume.tsx` shows weekly muscle-group volume vs MEV/MAV/MRV.
- ✅ `Readiness.tsx` shows weekly RCS trend and session modifier counts.
- ✅ `Performance.tsx` shows e1RM trends with peak/stall detection.
- ✅ Weekly sRPE load trend line chart in `Readiness.tsx`.
- ✅ ACLR trend line chart with yellow flag at >1.5 in `Volume.tsx`.
- ✅ Accessory correlation table in `WeakPointReview.tsx` (uses stored `profile.accessoryResponsiveness`).
- ✅ Next block recommendation with rationale in `NextBlock.tsx`.

---

## 6. Deload Trigger UI (PRD §6.8, §7.6) — IMPLEMENTED

**Status:** Deload recommendations surfaced in `Today.tsx` with accept/dismiss actions.

**Completed:**
- ✅ `AppState.deloadRecommendation` transient state added (not persisted).
- ✅ `completeSession` evaluates deload signals at week end and stores recommendation.
- ✅ `Today.tsx` shows banner for strong/urgent/moderate recommendations.
- ✅ "Accept deload" calls `generateDeloadBlock()`; "Dismiss" clears the flag.

**Still needed:**
- Modal interrupt for `level === 'urgent'` (joint pain) instead of banner.
- Push notification integration for urgent deloads.

---

## 7. HRV Integration (PRD §4.8.2) — IMPLEMENTED

**Status:** Manual HRV entry supported; synthetic estimate remains fallback.

**Completed:**
- ✅ `WellnessInputs.hrvRmssd?: number` added.
- ✅ Manual HRV entry field in `Wellness.tsx` (toggle behind "Add HRV").
- ✅ `calculateRCS` uses real HRV if provided; otherwise falls back to synthetic estimate.
- ✅ HRV modifier computed from deviation vs 28-day baseline.
- ✅ Store 28-day HRV rolling baseline in `profile.hrv28DayBaseline`.
- ✅ Compute 28-day rolling rMSSD from `profile.hrvHistory` in `Wellness.tsx`.
- ✅ `Readiness.tsx` shows HRV trend sparkline and deviation from baseline.

**Still needed:**
- Apple Health / Google Health Connect integration (Phase 2).

---

## 8. Exercise Library Expansion (PRD §8.2) — IMPLEMENTED

**Status:** 84 exercises covering all major categories.

**Completed:**
- ✅ Expanded from 18 → 84 exercises (66 new).
- ✅ All weak-point variations from PRD §4.9.3.
- ✅ Machine, cable, and unilateral movements.
- ✅ All entries have `primaryMuscles`, `efc`, and `weakPointTargets` where applicable.

**Still needed:**
- Reach 200 exercises at launch (currently 84; additional 116 needed).
- Add exercise images/demos.

---

## 9. Onboarding — Training Age Gate (PRD §7.1.1) — IMPLEMENTED

**Status:** Eligibility gate enforced in `Biometrics.tsx`.

**Completed:**
- ✅ Training age options include `< 6 months`.
- ✅ Novice gate modal shown for `< 6 months` with redirect to `6–12 months` option.
- ✅ `trainingAgeYears` numeric mapped from string and stored in profile.
- ✅ `6–12 months` users flagged for RPE calibration (`rpeCalibration.sessions = 0`).

---

## 10. Offline-First Data Integrity (PRD §9.2, §9.3) — IMPLEMENTED

**Status:** Data export available; IndexedDB migration done.

**Completed:**
- ✅ `exportData()` function in store returns JSON dump of profile, blocks, customExercises.
- ✅ Export button in `Performance.tsx` triggers browser download.
- ✅ `e1RMHistory` is append-only via `logSet` (corrections create new entries via `updateE1rm`).
- ✅ IndexedDB storage adapter (`idbStorage.ts`) with automatic localStorage migration.
- ✅ Zustand persist middleware uses IndexedDB as primary, localStorage as fallback.

**Still needed:**
- Conflict-resolution logic for multi-device usage.

---

## 11. VBT Manual Entry (PRD §4.11, OQ-05) — IMPLEMENTED

**Status:** Velocity input available in set logger; calibration flow wired.

**Completed:**
- ✅ Optional "Velocity (m/s)" input in `TopSet.tsx` and `DropProtocol.tsx`.
- ✅ Velocity passed to `ensembleE1RM` and `calculateE1RM` (VBT method included when `lvProfile` available).
- ✅ Velocity stored in `SetLog.velocity`.
- ✅ "Calibrate VBT" flow: `VbtCalibration.tsx` with linear regression from 2+ (load, velocity) pairs.
- ✅ `lvProfile` storage in `UserProfile`.
- ✅ VBT-RPE divergence flag in `TopSet.tsx`: warns when VBT-implied e1RM diverges >10% from RPE-based.

---

## 12. Session Duration Management (PRD §7.2.3) — IMPLEMENTED

**Status:** Session duration estimated from exercise parameters and capped.

**Completed:**
- ✅ `estimateSessionDuration()` in `engine.ts` computes warm-up + working sets + rest periods.
- ✅ Rest periods derived from RPE target: ≥8 → 4 min, 7–8 → 2.5 min, ≤7 → 1.75 min.
- ✅ `Today.tsx` uses `estimateSessionDuration()` instead of hardcoded `sets × 3.5`.
- ✅ In `createDayPlan`, enforce `profile.sessionDuration` cap by reducing back-off sets for lowest-priority exercises (SUPP → CORE → ASSIST).
- ✅ Surface advisory when session is trimmed to fit duration (`durationTrimmed` flag in `Today.tsx`).

---

*End of TODO.md*
