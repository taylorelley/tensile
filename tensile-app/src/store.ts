import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ensembleE1RM, DEFAULT_RPE_TABLE, calculateSessionSFI, calculateDeloadScore, deloadRecommendation, detectPeak, detectStall, personalizeRpeTable, estimateSessionDuration, isRpeOutlier, getAccessoryTemplate, pearsonCorrelation } from './engine';
import { idbStorage } from './idbStorage';
import type { SetInput } from './engine';
import type { CatalogEntry } from './exerciseCatalog';
import { getBuiltinExercise, BUILTIN_EXERCISES } from './exerciseCatalog';

export type BlockPhase = 'ACCUMULATION' | 'INTENSIFICATION' | 'REALISATION' | 'DELOAD' | 'PIVOT';
export type BlockType = 'DEVELOPMENT' | 'DELOAD' | 'PIVOT' | 'PEAK';

export interface SessionExercise {
  id: string;
  name: string;
  tag: 'PRIMARY' | 'ASSIST' | 'SUPP' | 'CORE';
  sets: number;
  reps: number;
  rpeTarget: number;
  dropPct?: number;
  prescribedLoad?: number;
  backOffLoad?: number;
  /** Muscle groups targeted by this exercise (for volume budget / MEV-MRV tracking) */
  primaryMuscles: string[];
}

export interface SetLog {
  id: string;
  exerciseId: string;
  setType: 'TOP_SET' | 'BENCHMARK' | 'BACK_OFF' | 'WARMUP';
  prescribedLoad: number;
  actualLoad: number;
  prescribedReps: number;
  actualReps: number;
  prescribedRpeTarget: number;
  actualRpe: number;
  velocity?: number;
  e1rm: number;
  sfi: number;
}

export interface Session {
  id: string;
  blockId: string;
  scheduledDate: string;
  completedDate?: string;
  wellness: {
    sleepQuality: number;
    overallFatigue: number;
    muscleSoreness: number;
    motivation: number;
    stress: number;
  };
  wellnessCompleted: boolean;
  rcs: number;
  srpe?: number;
  srpeLoad?: number;
  sfi: number;
  volumeLoad: number;
  sets: SetLog[];
  exercises: SessionExercise[];
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE' | 'SKIPPED';
  currentExerciseIndex?: number;
  overrides: string[];
  /** Sets completed per muscle group in this session (updated on set log / completion) */
  muscleGroupVolume: Record<string, number>;
  /** True if session was trimmed to fit profile.sessionDuration cap */
  durationTrimmed?: boolean;
}

export interface Block {
  id: string;
  type: BlockType;
  phase: BlockPhase;
  startDate: string;
  endDate?: string;
  week: number;
  status: 'ACTIVE' | 'COMPLETE' | 'ABORTED';
  sessions: Session[];
  /** Weekly accumulated sets per muscle group (week index → muscle → sets) */
  weeklyMuscleVolume: Record<number, Record<string, number>>;
  /** Immutable audit log of engine decisions */
  auditLog: { timestamp: string; ruleId: string; trigger: string; action: string; evidenceTier?: string }[];
}

export interface UserProfile {
  bodyWeight: number;
  dob: string;
  sex: 'Male' | 'Female';
  height?: number;
  trainingAge: string;
  trainingAgeYears: number;
  primaryGoal: string;
  trainingFrequency: number;
  sessionDuration: number;
  availableDays: boolean[];
  excludedExercises: string[];
  squatStance: string;
  deadliftStance: string;
  belt: boolean;
  kneeSleeves: string;
  weakPoints: Record<string, string>;
  e1rm: Record<string, number>;
  rollingE1rm: Record<string, number>;
  ttpEstimate: number;
  ttpHistory: number[];
  meetDate?: string;
  federation: string;
  equipment: string;
  weightClass: string;
  completedBlocks: number;
  rpeCalibration: { sessions: number; mae: number };
  rpeTable: Record<string, number>;
  rpeTablePersonalised: boolean;
  mevEstimates: Record<string, number>;
  mrvEstimates: Record<string, number>;
  accessoryResponsiveness: Record<string, number>;
  recentProgramme: string;
  /** HRV 28-day rolling baseline (rMSSD in ms) */
  hrv28DayBaseline?: number;
  /** Recent HRV readings for baseline computation */
  hrvHistory?: number[];
  /** True when a peaking plan is active — locks development block generation */
  peakingActive?: boolean;
  /** Load-velocity profile for VBT e1RM estimation { slope, intercept, n } */
  lvProfile?: { slope: number; intercept: number; n: number };
}

function trainingAgeToTtp(age: string): number {
  if (age.includes('1–2')) return 5;
  if (age.includes('2–5')) return 6;
  if (age.includes('5–10')) return 8;
  if (age.includes('10')) return 10;
  return 6;
}

function createDayPlan(dayIndex: number, phase: BlockPhase = 'ACCUMULATION', profile?: UserProfile): { focus: string; exercises: SessionExercise[]; durationTrimmed: boolean } {
  const map: Record<number, string> = {
    0: 'Squat',
    2: 'Bench',
    4: 'Deadlift',
    5: 'Bench (variation)',
  };
  const focus = map[dayIndex] || 'GPP';

  // Phase modifiers for PRIMARY lifts relative to ACCUMULATION defaults
  const rpeAdd = phase === 'REALISATION' ? 1.0 : phase === 'INTENSIFICATION' ? 0.5 : 0;
  const repsDrop = phase === 'ACCUMULATION' ? 0 : 1;
  const setsDrop = phase === 'REALISATION' ? 1 : 0;

  const primary = (ex: SessionExercise): SessionExercise => ({
    ...ex,
    rpeTarget: Math.min(10, ex.rpeTarget + rpeAdd),
    reps: Math.max(1, ex.reps - repsDrop),
    sets: Math.max(1, ex.sets - setsDrop),
  });

  // Helper to compute prescribed load from e1RM and RPE table
  const computeLoad = (ex: SessionExercise, liftKey: string): number => {
    if (!profile) return 0;
    const e1rm = profile.e1rm[liftKey] || 200;
    const pct = profile.rpeTable[`${ex.reps}@${ex.rpeTarget}`] || 0.80;
    return Math.round(e1rm * pct / 2.5) * 2.5;
  };

  // Helper to pull primaryMuscles from catalog, with fallback
  const muscles = (id: string): string[] => getBuiltinExercise(id)?.primaryMuscles ?? [];

  const ex: SessionExercise[] = [];
  if (focus === 'Squat') {
    ex.push({ ...primary({ id: 'barbell_back_squat', name: 'Back squat', tag: 'PRIMARY', sets: 4, reps: 3, rpeTarget: 8.5, dropPct: 12, primaryMuscles: muscles('barbell_back_squat') }), prescribedLoad: profile ? computeLoad({ id: 'barbell_back_squat', name: 'Back squat', tag: 'PRIMARY', sets: 4, reps: 3, rpeTarget: 8.5, primaryMuscles: muscles('barbell_back_squat') }, 'squat') : 0 });
    ex.push({ id: 'paused_squat', name: 'Paused squat', tag: 'ASSIST', sets: 3, reps: 4, rpeTarget: 8.0, primaryMuscles: muscles('paused_squat'), prescribedLoad: profile ? computeLoad({ id: 'paused_squat', name: 'Paused squat', tag: 'ASSIST', sets: 3, reps: 4, rpeTarget: 8.0, primaryMuscles: muscles('paused_squat') }, 'squat') * 0.75 : 0 });
    ex.push({ id: 'romanian_deadlift', name: 'Romanian DL', tag: 'SUPP', sets: 3, reps: 8, rpeTarget: 7.5, primaryMuscles: muscles('romanian_deadlift'), prescribedLoad: profile ? computeLoad({ id: 'romanian_deadlift', name: 'Romanian DL', tag: 'SUPP', sets: 3, reps: 8, rpeTarget: 7.5, primaryMuscles: muscles('romanian_deadlift') }, 'deadlift') * 0.70 : 0 });
    ex.push({ id: 'leg_curl', name: 'Leg curl', tag: 'SUPP', sets: 3, reps: 12, rpeTarget: 8.0, primaryMuscles: muscles('leg_curl') });
    ex.push({ id: 'plank', name: 'Plank', tag: 'CORE', sets: 3, reps: 1, rpeTarget: 7.0, primaryMuscles: muscles('plank') });
  } else if (focus === 'Bench') {
    ex.push({ ...primary({ id: 'bench_press', name: 'Bench press', tag: 'PRIMARY', sets: 4, reps: 4, rpeTarget: 8.0, dropPct: 12, primaryMuscles: muscles('bench_press') }), prescribedLoad: profile ? computeLoad({ id: 'bench_press', name: 'Bench press', tag: 'PRIMARY', sets: 4, reps: 4, rpeTarget: 8.0, primaryMuscles: muscles('bench_press') }, 'bench') : 0 });
    ex.push({ id: 'overhead_press', name: 'Overhead press', tag: 'ASSIST', sets: 3, reps: 6, rpeTarget: 8.0, primaryMuscles: muscles('overhead_press'), prescribedLoad: profile ? computeLoad({ id: 'overhead_press', name: 'Overhead press', tag: 'ASSIST', sets: 3, reps: 6, rpeTarget: 8.0, primaryMuscles: muscles('overhead_press') }, 'bench') * 0.55 : 0 });
    ex.push({ id: 'cable_row', name: 'Cable row', tag: 'SUPP', sets: 3, reps: 10, rpeTarget: 8.0, primaryMuscles: muscles('cable_row') });
    ex.push({ id: 'dumbbell_curl', name: 'Dumbbell curl', tag: 'SUPP', sets: 3, reps: 12, rpeTarget: 8.5, primaryMuscles: muscles('dumbbell_curl') });
    ex.push({ id: 'plank', name: 'Plank', tag: 'CORE', sets: 3, reps: 1, rpeTarget: 7.0, primaryMuscles: muscles('plank') });
  } else if (focus === 'Deadlift') {
    ex.push({ ...primary({ id: 'conventional_deadlift', name: 'Conventional DL', tag: 'PRIMARY', sets: 3, reps: 2, rpeTarget: 8.5, dropPct: 10, primaryMuscles: muscles('conventional_deadlift') }), prescribedLoad: profile ? computeLoad({ id: 'conventional_deadlift', name: 'Conventional DL', tag: 'PRIMARY', sets: 3, reps: 2, rpeTarget: 8.5, primaryMuscles: muscles('conventional_deadlift') }, 'deadlift') : 0 });
    ex.push({ id: 'front_squat', name: 'Front squat', tag: 'ASSIST', sets: 3, reps: 5, rpeTarget: 8.0, primaryMuscles: muscles('front_squat'), prescribedLoad: profile ? computeLoad({ id: 'front_squat', name: 'Front squat', tag: 'ASSIST', sets: 3, reps: 5, rpeTarget: 8.0, primaryMuscles: muscles('front_squat') }, 'squat') * 0.65 : 0 });
    ex.push({ id: 'barbell_row', name: 'Barbell row', tag: 'SUPP', sets: 3, reps: 8, rpeTarget: 8.0, primaryMuscles: muscles('barbell_row') });
    ex.push({ id: 'leg_extension', name: 'Leg extension', tag: 'SUPP', sets: 3, reps: 12, rpeTarget: 8.0, primaryMuscles: muscles('leg_extension') });
    ex.push({ id: 'plank', name: 'Plank', tag: 'CORE', sets: 3, reps: 1, rpeTarget: 7.0, primaryMuscles: muscles('plank') });
  } else if (focus === 'Bench (variation)') {
    ex.push({ ...primary({ id: 'close_grip_bench', name: 'Close-grip bench', tag: 'PRIMARY', sets: 4, reps: 5, rpeTarget: 7.5, dropPct: 10, primaryMuscles: muscles('close_grip_bench') }), prescribedLoad: profile ? computeLoad({ id: 'close_grip_bench', name: 'Close-grip bench', tag: 'PRIMARY', sets: 4, reps: 5, rpeTarget: 7.5, primaryMuscles: muscles('close_grip_bench') }, 'bench') : 0 });
    ex.push({ id: 'incline_press', name: 'Incline press', tag: 'ASSIST', sets: 3, reps: 6, rpeTarget: 8.0, primaryMuscles: muscles('incline_press'), prescribedLoad: profile ? computeLoad({ id: 'incline_press', name: 'Incline press', tag: 'ASSIST', sets: 3, reps: 6, rpeTarget: 8.0, primaryMuscles: muscles('incline_press') }, 'bench') * 0.75 : 0 });
    ex.push({ id: 'lat_pulldown', name: 'Lat pulldown', tag: 'SUPP', sets: 3, reps: 10, rpeTarget: 8.0, primaryMuscles: muscles('lat_pulldown') });
    ex.push({ id: 'lateral_raise', name: 'Lateral raise', tag: 'SUPP', sets: 3, reps: 15, rpeTarget: 8.5, primaryMuscles: muscles('lateral_raise') });
    ex.push({ id: 'plank', name: 'Plank', tag: 'CORE', sets: 3, reps: 1, rpeTarget: 7.0, primaryMuscles: muscles('plank') });
  }

  // Weak-point engine: swap accessories toward weak-point-targeting exercises
  if (profile && profile.weakPoints) {
    const liftKeyMap: Record<string, string> = {
      'Squat': 'squat',
      'Bench': 'bench',
      'Deadlift': 'deadlift',
      'Bench (variation)': 'bench',
    };
    const primaryLift = liftKeyMap[focus];
    if (primaryLift) {
      const candidates = getAccessoryTemplate(primaryLift, phase, profile.weakPoints, BUILTIN_EXERCISES);
      // Replace ASSIST and SUPP exercises with highest-priority candidates
      const assistIdx = ex.findIndex(e => e.tag === 'ASSIST');
      const suppIdx = ex.findIndex(e => e.tag === 'SUPP');
      if (assistIdx >= 0 && candidates.length > 0) {
        const best = candidates.find(c => c.tag === 'ASSIST') || candidates[0];
        ex[assistIdx] = {
          ...ex[assistIdx],
          id: best.id,
          name: best.name,
          sets: best.sets,
          reps: best.reps,
          rpeTarget: best.rpeTarget,
          primaryMuscles: best.primaryMuscles,
          prescribedLoad: profile ? computeLoad({ id: best.id, name: best.name, tag: best.tag as SessionExercise['tag'], sets: best.sets, reps: best.reps, rpeTarget: best.rpeTarget, primaryMuscles: best.primaryMuscles }, primaryLift) * (best.tag === 'ASSIST' ? 0.75 : 0.60) : 0,
        };
      }
      if (suppIdx >= 0 && candidates.length > 1) {
        const best = candidates.find(c => c.tag === 'SUPP' && c.id !== ex[assistIdx]?.id) || candidates[1] || candidates[0];
        ex[suppIdx] = {
          ...ex[suppIdx],
          id: best.id,
          name: best.name,
          sets: best.sets,
          reps: best.reps,
          rpeTarget: best.rpeTarget,
          primaryMuscles: best.primaryMuscles,
          prescribedLoad: profile ? computeLoad({ id: best.id, name: best.name, tag: best.tag as SessionExercise['tag'], sets: best.sets, reps: best.reps, rpeTarget: best.rpeTarget, primaryMuscles: best.primaryMuscles }, primaryLift) * (best.tag === 'ASSIST' ? 0.75 : 0.60) : 0,
        };
      }
    }
  }

  // Enforce session duration cap by reducing sets for lowest-priority exercises
  let durationTrimmed = false;
  if (profile) {
    const estimated = estimateSessionDuration(ex);
    const cap = profile.sessionDuration || 75;
    if (estimated > cap) {
      const priorityOrder: SessionExercise['tag'][] = ['SUPP', 'CORE', 'ASSIST'];
      for (const tag of priorityOrder) {
        if (estimated <= cap) break;
        for (let i = ex.length - 1; i >= 0; i--) {
          if (ex[i].tag === tag && ex[i].sets > 1) {
            ex[i] = { ...ex[i], sets: ex[i].sets - 1 };
            durationTrimmed = true;
            if (estimateSessionDuration(ex) <= cap) break;
          }
        }
      }
    }
  }

  return { focus, exercises: ex, durationTrimmed };
}

/** Internal helper used by `generateFirstBlock` store action. Exported for testing. */
export function generateBlock(profile: UserProfile, phase: BlockPhase = 'ACCUMULATION'): Block {
  const blockId = `block-${Date.now()}`;

  // Align to Monday of the current week so sessions land on the correct weekdays.
  // availableDays uses 0=Mon ... 6=Sun; JS Date.getDay() uses 0=Sun ... 6=Sat.
  const today = new Date();
  const daysSinceMonday = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);

  const sessions: Session[] = [];
  const weeks = profile.ttpEstimate || trainingAgeToTtp(profile.trainingAge);

  for (let week = 0; week < weeks; week++) {
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      if (!profile.availableDays[dayIdx]) continue;
      const d = new Date(monday);
      d.setDate(monday.getDate() + week * 7 + dayIdx);
      const plan = createDayPlan(dayIdx, phase, profile);
      const session: Session = {
        id: `sess-${blockId}-w${week}-${dayIdx}`,
        blockId,
        scheduledDate: d.toISOString().split('T')[0],
        status: 'SCHEDULED',
        exercises: plan.exercises,
        currentExerciseIndex: 0,
        wellness: { sleepQuality: 7, overallFatigue: 6, muscleSoreness: 5, motivation: 8, stress: 6 },
        wellnessCompleted: false,
        rcs: 0,
        sfi: 0,
        volumeLoad: 0,
        sets: [],
        overrides: [],
        muscleGroupVolume: {},
        durationTrimmed: plan.durationTrimmed,
      };
      sessions.push(session);
    }
  }

  const endDate = new Date(monday);
  endDate.setDate(monday.getDate() + weeks * 7 - 1);

  return {
    id: blockId,
    type: 'DEVELOPMENT',
    phase,
    startDate: monday.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    week: 1,
    status: 'ACTIVE',
    sessions,
    weeklyMuscleVolume: {},
    auditLog: [],
  };
}

const defaultProfile: UserProfile = {
  bodyWeight: 84.5,
  dob: '1991-06-12',
  sex: 'Male',
  height: 178,
  trainingAge: '2–5 years',
  trainingAgeYears: 3,
  primaryGoal: 'Powerlifting',
  trainingFrequency: 4,
  sessionDuration: 75,
  availableDays: [true, false, true, false, true, true, false],
  excludedExercises: [],
  squatStance: 'moderate',
  deadliftStance: 'conventional',
  belt: true,
  kneeSleeves: 'sleeves',
  weakPoints: { squat: 'out_of_hole', bench: 'off_chest', deadlift: 'off_floor' },
  e1rm: { squat: 212, bench: 143, deadlift: 233 },
  rollingE1rm: { squat: 210, bench: 142, deadlift: 230 },
  ttpEstimate: 6,
  ttpHistory: [],
  meetDate: '2026-09-14',
  federation: 'IPF',
  equipment: 'Raw',
  weightClass: '83',
  completedBlocks: 0,
  rpeCalibration: { sessions: 0, mae: 1.0 },
  rpeTable: DEFAULT_RPE_TABLE,
  rpeTablePersonalised: false,
  mevEstimates: { quads: 10, hamstrings: 8, glutes: 8, pecs: 10, delts: 8, triceps: 8, lats: 10, biceps: 6, core: 8 },
  mrvEstimates: { quads: 22, hamstrings: 20, glutes: 20, pecs: 22, delts: 18, triceps: 20, lats: 22, biceps: 18, core: 20 },
  accessoryResponsiveness: {},
  recentProgramme: 'Custom RPE',
  peakingActive: false,
};

interface AppState {
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;

  profile: UserProfile;
  setProfile: (p: Partial<UserProfile>) => void;
  /** Available for manual e1RM correction (e.g., user edits post-set RPE in an override flow) */
  updateE1rm: (lift: string, set: SetInput) => void;

  blocks: Block[];
  currentBlock: Block | null;
  /** Superseded by `generateFirstBlock` – kept for manual block insertion if needed */
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  /** Superseded by `generateFirstBlock` – kept for manual session insertion if needed */
  addSession: (blockId: string, session: Session) => void;
  updateSession: (blockId: string, sessionId: string, updates: Partial<Session>) => void;
  startSession: (blockId: string, sessionId: string) => void;
  logSet: (blockId: string, sessionId: string, set: SetLog) => void;
  completeSession: (blockId: string, sessionId: string, srpe: number) => void;
  generateFirstBlock: () => void;
  generateNextDevelopmentBlock: () => void;
  generateDeloadBlock: () => void;
  generatePivotBlock: () => void;
  generateRestBlock: () => void;

  currentSession: Session | null;
  /** Set by `startSession` internally; exposed for external override if needed */
  setCurrentSession: (s: Session | null) => void;

  customExercises: CatalogEntry[];
  addCustomExercise: (entry: Omit<CatalogEntry, 'builtin'>) => void;
  updateCustomExercise: (id: string, updates: Partial<Omit<CatalogEntry, 'id' | 'builtin'>>) => void;
  removeCustomExercise: (id: string) => void;

  /** Transient deload recommendation surfaced by completeSession (not persisted) */
  deloadRecommendation: { level: string; message: string } | null;
  clearDeloadRecommendation: () => void;

  /** Export all user data as JSON blob */
  exportData: () => string;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboardingComplete: false,
      setOnboardingComplete: (v) => set({ onboardingComplete: v }),

      profile: defaultProfile,
      setProfile: (p) => set({ profile: { ...get().profile, ...p } }),

      updateE1rm: (lift, s) => {
        const profile = get().profile;
        const result = ensembleE1RM(
          s,
          profile.rpeTable,
          profile.rpeCalibration,
          profile.rollingE1rm[lift] || 200,
          0.3
        );
        set({
          profile: {
            ...profile,
            e1rm: { ...profile.e1rm, [lift]: Math.round(result.session * 10) / 10 },
            rollingE1rm: { ...profile.rollingE1rm, [lift]: Math.round(result.rolling * 10) / 10 },
          },
        });
      },

      blocks: [],
      currentBlock: null,
      addBlock: (block) => set({ blocks: [...get().blocks, block], currentBlock: block }),
      updateBlock: (id, updates) => {
        const current = get().currentBlock;
        set({
          blocks: get().blocks.map(b => b.id === id ? { ...b, ...updates } : b),
          currentBlock: current?.id === id ? { ...current, ...updates } as Block : current,
        });
      },
      addSession: (blockId, session) => set({
        blocks: get().blocks.map(b => b.id === blockId ? { ...b, sessions: [...b.sessions, session] } : b),
        currentBlock: get().currentBlock?.id === blockId
          ? { ...get().currentBlock!, sessions: [...get().currentBlock!.sessions, session] }
          : get().currentBlock,
      }),
      updateSession: (blockId, sessionId, updates) => set({
        blocks: get().blocks.map(b =>
          b.id === blockId
            ? { ...b, sessions: b.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s) }
            : b
        ),
        currentBlock: get().currentBlock?.id === blockId
          ? { ...get().currentBlock!, sessions: get().currentBlock!.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s) }
          : get().currentBlock,
        currentSession: get().currentSession?.id === sessionId ? { ...get().currentSession!, ...updates } : get().currentSession,
      }),
      startSession: (blockId, sessionId) => {
        const block = get().blocks.find(b => b.id === blockId);
        const session = block?.sessions.find(s => s.id === sessionId);
        if (!session || session.status === 'COMPLETE' || session.status === 'SKIPPED') return;
        const updated = { ...session, status: 'IN_PROGRESS' as const, currentExerciseIndex: session.currentExerciseIndex ?? 0 };
        set({
          currentSession: updated,
          blocks: get().blocks.map(b => b.id === blockId ? { ...b, sessions: b.sessions.map(s => s.id === sessionId ? updated : s) } : b),
          currentBlock: get().currentBlock?.id === blockId
            ? { ...get().currentBlock!, sessions: get().currentBlock!.sessions.map(s => s.id === sessionId ? updated : s) }
            : get().currentBlock,
        });
      },

      logSet: (blockId, sessionId, setLog) => {
        const state = get();
        const block = state.blocks.find(b => b.id === blockId);
        const session = block?.sessions.find(s => s.id === sessionId);
        if (!session) return;
        const newSets = [...session.sets, setLog];
        const volumeLoad = Math.round(newSets.reduce((sum, s) => sum + s.actualLoad * s.actualReps, 0));
        const sfi = Math.round(calculateSessionSFI(newSets.map(s => ({ rpe: s.actualRpe, reps: s.actualReps, exerciseId: s.exerciseId, isTopSet: s.setType === 'TOP_SET' }))) * 10) / 10;

        // Accumulate muscle-group volume for this session
        const exDef = session.exercises.find(e => e.id === setLog.exerciseId);
        const newMuscleVolume: Record<string, number> = { ...session.muscleGroupVolume };
        if (exDef && exDef.primaryMuscles.length > 0) {
          for (const mg of exDef.primaryMuscles) {
            newMuscleVolume[mg] = (newMuscleVolume[mg] || 0) + 1;
          }
        }

        const updates: Partial<Session> = { sets: newSets, volumeLoad, sfi, status: 'IN_PROGRESS', muscleGroupVolume: newMuscleVolume };

        // Update e1RM for primary and assistance lifts (map to their primary lift category)
        const profile = state.profile;
        const liftMap: Record<string, string> = {
          barbell_back_squat: 'squat',
          front_squat: 'squat',
          paused_squat: 'squat',
          low_bar_squat: 'squat',
          tempo_squat: 'squat',
          bench_press: 'bench',
          close_grip_bench: 'bench',
          paused_bench: 'bench',
          spoto_press: 'bench',
          incline_press: 'bench',
          overhead_press: 'bench',
          conventional_deadlift: 'deadlift',
          sumo_deadlift: 'deadlift',
          deficit_deadlift: 'deadlift',
          snatch_grip_deadlift: 'deadlift',
          block_pull: 'deadlift',
          romanian_deadlift: 'deadlift',
        };
        const lift = liftMap[setLog.exerciseId];
        let newProfile = profile;
        if (lift) {
          const result = ensembleE1RM(
            { load: setLog.actualLoad, reps: setLog.actualReps, rpe: setLog.actualRpe },
            profile.rpeTable,
            profile.rpeCalibration,
            profile.rollingE1rm[lift] || 200,
            0.3
          );
          // Personalise RPE table from observed performance (skip outliers)
          const outlier = isRpeOutlier(setLog.actualLoad, setLog.actualReps, setLog.actualRpe, result.session, profile.rpeTable);
          let updatedRpeTable = profile.rpeTable;
          let isPersonalised = profile.rpeTablePersonalised;
          if (!outlier) {
            const personalization = personalizeRpeTable(
              profile.rpeTable,
              setLog.actualLoad,
              setLog.actualReps,
              setLog.actualRpe,
              result.session
            );
            updatedRpeTable = personalization.table;
            isPersonalised = profile.rpeTablePersonalised || personalization.isPersonalised;
          }
          newProfile = {
            ...profile,
            e1rm: { ...profile.e1rm, [lift]: Math.round(result.session * 10) / 10 },
            rollingE1rm: { ...profile.rollingE1rm, [lift]: Math.round(result.rolling * 10) / 10 },
            rpeTable: updatedRpeTable,
            rpeTablePersonalised: isPersonalised,
            rpeCalibration: {
              ...profile.rpeCalibration,
              sessions: profile.rpeCalibration.sessions + 1,
            },
          };
          if (outlier) {
            updates.overrides = [...(session.overrides || []), 'RPE outlier — table not updated'];
          }
        }

        set({
          profile: newProfile,
          blocks: state.blocks.map(b => b.id === blockId ? { ...b, sessions: b.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s) } : b),
          currentBlock: state.currentBlock?.id === blockId
            ? { ...state.currentBlock, sessions: state.currentBlock.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s) }
            : state.currentBlock,
          currentSession: state.currentSession?.id === sessionId ? { ...state.currentSession, ...updates } : state.currentSession,
        });
      },

      completeSession: (blockId, sessionId, srpe) => {
        const state = get();
        const block = state.blocks.find(b => b.id === blockId);
        const session = block?.sessions.find(s => s.id === sessionId);
        if (!session) return;

        // Compute sRPE load (sRPE × estimated session duration in minutes)
        const estimatedDuration = Math.round(session.exercises.reduce((sum, ex) => sum + ex.sets * 3.5, 0));
        const srpeLoad = srpe * estimatedDuration;
        const sessionUpdates: Partial<Session> = { status: 'COMPLETE', completedDate: new Date().toISOString().split('T')[0], srpe, srpeLoad };

        // Check if all sessions in current week are done (COMPLETE or SKIPPED)
        let blockUpdates: Partial<Block> = {};
        let deloadRecommendationResult: { level: string; message: string } | null = null;
        if (block) {
          const updatedSessions = block.sessions.map(s =>
            s.id === sessionId ? { ...s, ...sessionUpdates } : s
          );
          const start = new Date(block.startDate).getTime();
          const currentWeek = block.week;
          const weekSessions = updatedSessions.filter(s => {
            const daysSince = Math.floor((new Date(s.scheduledDate).getTime() - start) / (1000 * 60 * 60 * 24));
            const sWeek = Math.floor(daysSince / 7) + 1;
            return sWeek === currentWeek;
          });
          const allDone = weekSessions.every(s => s.status === 'COMPLETE' || s.status === 'SKIPPED');
          if (allDone && weekSessions.length > 0) {
            const nextWeek = currentWeek + 1;
            blockUpdates = { week: nextWeek };

            // Evaluate deload triggers at week end
            const primaryIds = ['barbell_back_squat', 'bench_press', 'conventional_deadlift'];
            const e1rmTrends: Record<string, number[]> = {};
            for (const pid of primaryIds) {
              const trend: number[] = [];
              for (let w = 0; w < nextWeek; w++) {
                const weekSess = updatedSessions.filter(s => {
                  const daysSince = Math.floor((new Date(s.scheduledDate).getTime() - start) / (1000 * 60 * 60 * 24));
                  const sWeek = Math.floor(daysSince / 7);
                  return sWeek === w && s.status === 'COMPLETE';
                });
                const bestE1rm = weekSess
                  .flatMap(s => s.sets.filter(set => set.exerciseId === pid))
                  .map(set => set.e1rm);
                trend.push(bestE1rm.length > 0 ? Math.max(...bestE1rm) : 0);
              }
              e1rmTrends[pid] = trend.filter(v => v > 0);
            }

            const squatTrend = e1rmTrends['barbell_back_squat'];
            const peakDetected = squatTrend.length >= 3 && detectPeak(squatTrend, state.profile.ttpEstimate, nextWeek);
            const stallDetected = squatTrend.length >= 3 && detectStall(squatTrend, nextWeek);

            const recentSessions = updatedSessions
              .filter(s => s.status === 'COMPLETE' && s.rcs > 0)
              .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
              .slice(0, 3);
            const wellnessSustainedLow = recentSessions.length === 3 && recentSessions.reduce((sum, s) => sum + s.rcs, 0) / 3 < 60;

            const signals = {
              peakDetected,
              stallDetected,
              wellnessSustainedLow,
              rpeDrift: false,
              hrvTrendLow: false,
              aclrFlag: false,
              jointPainFlag: false,
              ttpExceeded: nextWeek > state.profile.ttpEstimate * 1.3,
            };
            const deloadScore = calculateDeloadScore(signals);
            deloadRecommendationResult = deloadRecommendation(deloadScore, signals);
          }

          // Aggregate session muscle-group volume into block's weekly tracking
          const weekIndex = currentWeek - 1; // 0-based
          const existingWeekly = block.weeklyMuscleVolume[weekIndex] || {};
          const mergedWeekly: Record<string, number> = { ...existingWeekly };
          for (const [mg, sets] of Object.entries(session.muscleGroupVolume)) {
            mergedWeekly[mg] = (mergedWeekly[mg] || 0) + sets;
          }
          // Append audit entry for week completion
          const auditEntry = {
            timestamp: new Date().toISOString(),
            ruleId: 'WEEK_COMPLETE',
            trigger: `Week ${currentWeek} completed with ${weekSessions.filter(s => s.status === 'COMPLETE').length} sessions`,
            action: `Advanced to week ${currentWeek + 1}`,
            evidenceTier: 'SYSTEM',
          };
          blockUpdates = {
            ...blockUpdates,
            weeklyMuscleVolume: {
              ...block.weeklyMuscleVolume,
              [weekIndex]: mergedWeekly,
            },
            auditLog: [...block.auditLog, auditEntry],
          };
        }

        set({
          blocks: state.blocks.map(b => b.id === blockId ? { ...b, ...blockUpdates, sessions: b.sessions.map(s => s.id === sessionId ? { ...s, ...sessionUpdates } : s) } : b),
          currentBlock: state.currentBlock?.id === blockId
            ? { ...state.currentBlock, ...blockUpdates, sessions: state.currentBlock.sessions.map(s => s.id === sessionId ? { ...s, ...sessionUpdates } : s) }
            : state.currentBlock,
          currentSession: state.currentSession?.id === sessionId ? { ...state.currentSession, ...sessionUpdates } : state.currentSession,
          deloadRecommendation: deloadRecommendationResult,
        });
      },

      generateFirstBlock: () => {
        const profile = get().profile;
        const block = generateBlock(profile);
        set({ blocks: [block], currentBlock: block, currentSession: null });
      },

      generateNextDevelopmentBlock: () => {
        const state = get();
        const profile = state.profile;
        if (profile.peakingActive) {
          // Peaking plan is active — development blocks are locked
          return;
        }
        const prevBlock = state.currentBlock;

        // Detect peak from previous block to update TTP
        let updatedTtpHistory = [...profile.ttpHistory];
        let updatedTtpEstimate = profile.ttpEstimate;
        if (prevBlock && prevBlock.type === 'DEVELOPMENT') {
          const start = new Date(prevBlock.startDate).getTime();
          const primaryIds = ['barbell_back_squat', 'bench_press', 'conventional_deadlift'];
          for (const pid of primaryIds) {
            const trend: number[] = [];
            for (let w = 0; w < prevBlock.week; w++) {
              const weekSess = prevBlock.sessions.filter(s => {
                const daysSince = Math.floor((new Date(s.scheduledDate).getTime() - start) / (1000 * 60 * 60 * 24));
                const sWeek = Math.floor(daysSince / 7);
                return sWeek === w && s.status === 'COMPLETE';
              });
              const bestE1rm = weekSess
                .flatMap(s => s.sets.filter(set => set.exerciseId === pid))
                .map(set => set.e1rm);
              trend.push(bestE1rm.length > 0 ? Math.max(...bestE1rm) : 0);
            }
            const filtered = trend.filter(v => v > 0);
            if (filtered.length >= 3 && detectPeak(filtered, profile.ttpEstimate, prevBlock.week)) {
              const peakWeek = filtered.indexOf(Math.max(...filtered)) + 1;
              updatedTtpHistory.push(peakWeek);
              // EWMA update with alpha=0.4
              if (updatedTtpHistory.length === 1) {
                updatedTtpEstimate = peakWeek;
              } else {
                updatedTtpEstimate = Math.round((0.4 * peakWeek + 0.6 * updatedTtpEstimate) * 10) / 10;
              }
              break; // Use first primary lift that peaks
            }
          }
        }

        // Compute accessory correlations at block end
        let updatedAccessoryResponsiveness = { ...profile.accessoryResponsiveness };
        if (prevBlock && prevBlock.type === 'DEVELOPMENT') {
          const start = new Date(prevBlock.startDate).getTime();
          const primaryIds = ['barbell_back_squat', 'bench_press', 'conventional_deadlift'];
          const primaryMap: Record<string, string> = {
            barbell_back_squat: 'squat',
            bench_press: 'bench',
            conventional_deadlift: 'deadlift',
          };
          for (const pid of primaryIds) {
            const lift = primaryMap[pid];
            const weeklyAccessoryVol: Record<string, number[]> = {};
            const weeklyPrimaryE1rm: number[] = [];
            for (let w = 0; w < prevBlock.week; w++) {
              const weekSess = prevBlock.sessions.filter(s => {
                const daysSince = Math.floor((new Date(s.scheduledDate).getTime() - start) / (1000 * 60 * 60 * 24));
                const sWeek = Math.floor(daysSince / 7);
                return sWeek === w && s.status === 'COMPLETE';
              });
              const bestE1rm = weekSess
                .flatMap(s => s.sets.filter(set => set.exerciseId === pid))
                .map(set => set.e1rm);
              weeklyPrimaryE1rm.push(bestE1rm.length > 0 ? Math.max(...bestE1rm) : 0);
              for (const sess of weekSess) {
                for (const set of sess.sets) {
                  if (primaryMap[set.exerciseId]) continue;
                  if (!weeklyAccessoryVol[set.exerciseId]) weeklyAccessoryVol[set.exerciseId] = [];
                  weeklyAccessoryVol[set.exerciseId][w] = (weeklyAccessoryVol[set.exerciseId][w] || 0) + set.actualLoad * set.actualReps;
                }
              }
            }
            for (const exId of Object.keys(weeklyAccessoryVol)) {
              const vols = weeklyAccessoryVol[exId];
              const n = vols.filter(v => v > 0).length;
              if (n < 6) continue;
              // Only include weeks where both accessory volume and primary e1RM exist
              const pairedV: number[] = [];
              const pairedE: number[] = [];
              for (let i = 0; i < vols.length; i++) {
                if (vols[i] > 0 && weeklyPrimaryE1rm[i] > 0) {
                  pairedV.push(vols[i]);
                  pairedE.push(weeklyPrimaryE1rm[i]);
                }
              }
              if (pairedV.length < 6) continue;
              const r = pearsonCorrelation(pairedV, pairedE);
              if (Math.abs(r) > 0.4) {
                updatedAccessoryResponsiveness[exId] = Math.round(r * 100) / 100;
              }
            }
          }
        }

        const completedCount = (profile.completedBlocks || 0) + (prevBlock ? 1 : 0);
        const phaseOrder: BlockPhase[] = ['ACCUMULATION', 'INTENSIFICATION', 'REALISATION'];
        const nextPhase = phaseOrder[completedCount % 3];
        const block = generateBlock({ ...profile, ttpEstimate: updatedTtpEstimate, ttpHistory: updatedTtpHistory }, nextPhase);
        const updatedBlocks = prevBlock
          ? state.blocks.map(b =>
              b.id === prevBlock.id
                ? { ...b, status: 'COMPLETE' as const, endDate: new Date().toISOString().split('T')[0] }
                : b
            )
          : state.blocks;
        set({
          profile: {
            ...profile,
            completedBlocks: (profile.completedBlocks || 0) + (prevBlock ? 1 : 0),
            ttpEstimate: updatedTtpEstimate,
            ttpHistory: updatedTtpHistory,
            accessoryResponsiveness: updatedAccessoryResponsiveness,
          },
          blocks: [...updatedBlocks, block],
          currentBlock: block,
          currentSession: null,
        });
      },

      generateDeloadBlock: () => {
        const state = get();
        const profile = state.profile;
        const base = generateBlock(profile);
        const blockStart = new Date(base.startDate);
        const cutoff = new Date(blockStart);
        cutoff.setDate(blockStart.getDate() + 7);
        const cutoffStr = cutoff.toISOString().split('T')[0];
        // Active deload: ~50% volume reduction at maintained intensity (RPE 6–7, technique-focused)
        const sessions = base.sessions.filter(s => s.scheduledDate < cutoffStr).map(s => ({
          ...s,
          exercises: s.exercises.map(ex => ({
            ...ex,
            sets: Math.max(1, Math.round(ex.sets * 0.5)),
            rpeTarget: Math.min(7.0, ex.rpeTarget),
            reps: ex.tag === 'PRIMARY' ? Math.min(ex.reps + 1, 5) : ex.reps, // slightly higher reps for technique focus
          })),
        }));
        const deloadEnd = new Date(blockStart);
        deloadEnd.setDate(blockStart.getDate() + 6);
        const deloadBlock: Block = { ...base, type: 'DELOAD', phase: 'DELOAD', sessions, endDate: deloadEnd.toISOString().split('T')[0], weeklyMuscleVolume: {}, auditLog: [] };
        const prevBlock = state.currentBlock;
        const updatedBlocks = prevBlock
          ? state.blocks.map(b =>
              b.id === prevBlock.id
                ? { ...b, status: 'COMPLETE' as const, endDate: new Date().toISOString().split('T')[0] }
                : b
            )
          : state.blocks;
        set({
          profile: { ...profile, completedBlocks: (profile.completedBlocks || 0) + (prevBlock ? 1 : 0) },
          blocks: [...updatedBlocks, deloadBlock],
          currentBlock: deloadBlock,
          currentSession: null,
        });
      },

      generatePivotBlock: () => {
        const state = get();
        const profile = state.profile;
        const base = generateBlock(profile);
        // Pivot duration = max 1/3 of preceding Development Block's duration (PRD §4.10.3)
        const prevBlockWeeks = state.currentBlock?.week ?? profile.ttpEstimate;
        const pivotWeeks = Math.max(1, Math.min(3, Math.round(prevBlockWeeks * 0.33)));
        const startDate = new Date(base.startDate);
        const cutoff = new Date(startDate);
        cutoff.setDate(startDate.getDate() + 7);
        const cutoffStr = cutoff.toISOString().split('T')[0];
        const firstWeekSessions = base.sessions.filter(s => s.scheduledDate < cutoffStr);

        // Replace competition lifts with variation movements (paused, tempo, unilateral)
        const pivotExerciseMap: Record<string, { id: string; name: string; tag: SessionExercise['tag'] }> = {
          barbell_back_squat: { id: 'paused_squat', name: 'Paused squat', tag: 'ASSIST' },
          bench_press: { id: 'paused_bench', name: 'Paused bench', tag: 'ASSIST' },
          conventional_deadlift: { id: 'deficit_deadlift', name: 'Deficit DL', tag: 'ASSIST' },
          close_grip_bench: { id: 'incline_press', name: 'Incline press', tag: 'ASSIST' },
        };

        const applyPivotRules = (ex: SessionExercise): SessionExercise => {
          const replacement = pivotExerciseMap[ex.id];
          if (replacement) {
            return { ...ex, ...replacement, rpeTarget: Math.min(ex.rpeTarget, 8.0), reps: Math.max(ex.reps, 6) };
          }
          return { ...ex, rpeTarget: Math.min(ex.rpeTarget, 8.0), reps: Math.max(ex.reps, 6) };
        };

        const week1 = firstWeekSessions.map(s => ({
          ...s,
          exercises: s.exercises.map(applyPivotRules),
        }));

        const pivotSessions = [...week1];
        for (let w = 1; w < pivotWeeks; w++) {
          const weekN = week1.map(s => {
            const d = new Date(s.scheduledDate);
            d.setDate(d.getDate() + w * 7);
            return {
              ...s,
              id: `${s.id}-w${w + 1}`,
              scheduledDate: d.toISOString().split('T')[0],
            };
          });
          pivotSessions.push(...weekN);
        }

        const pivotEndDate = new Date(startDate);
        pivotEndDate.setDate(pivotEndDate.getDate() + pivotWeeks * 7 - 1);
        const pivotBlock: Block = {
          ...base,
          type: 'PIVOT',
          phase: 'PIVOT',
          sessions: pivotSessions,
          endDate: pivotEndDate.toISOString().split('T')[0],
          weeklyMuscleVolume: {},
          auditLog: [],
        };
        const prevBlock = state.currentBlock;
        const updatedBlocks = prevBlock
          ? state.blocks.map(b =>
              b.id === prevBlock.id
                ? { ...b, status: 'COMPLETE' as const, endDate: new Date().toISOString().split('T')[0] }
                : b
            )
          : state.blocks;
        set({
          profile: { ...profile, completedBlocks: (profile.completedBlocks || 0) + (prevBlock ? 1 : 0) },
          blocks: [...updatedBlocks, pivotBlock],
          currentBlock: pivotBlock,
          currentSession: null,
        });
      },

      generateRestBlock: () => {
        const state = get();
        const blockId = `block-${Date.now()}`;
        const start = new Date();
        const endDate = new Date(start);
        endDate.setDate(endDate.getDate() + 6);
        const restBlock: Block = {
          id: blockId,
          type: 'DELOAD',
          phase: 'DELOAD',
          startDate: start.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          weeklyMuscleVolume: {},
          auditLog: [],
          week: 1,
          status: 'ACTIVE',
          sessions: [],
        };
        const prevBlock = state.currentBlock;
        const updatedBlocks = prevBlock
          ? state.blocks.map(b =>
              b.id === prevBlock.id
                ? { ...b, status: 'COMPLETE' as const, endDate: new Date().toISOString().split('T')[0] }
                : b
            )
          : state.blocks;
        set({
          profile: { ...state.profile, completedBlocks: (state.profile.completedBlocks || 0) + (prevBlock ? 1 : 0) },
          blocks: [...updatedBlocks, restBlock],
          currentBlock: restBlock,
          currentSession: null,
        });
      },

      currentSession: null,
      setCurrentSession: (s) => set({ currentSession: s }),

      customExercises: [],
      addCustomExercise: (entry) => set({
        customExercises: [...get().customExercises, { ...entry, builtin: false }],
      }),
      updateCustomExercise: (id, updates) => set({
        customExercises: get().customExercises.map(e =>
          e.id === id && !e.builtin ? { ...e, ...updates } : e
        ),
      }),
      removeCustomExercise: (id) => set({
        customExercises: get().customExercises.filter(e => e.id !== id || e.builtin),
      }),

      deloadRecommendation: null,
      clearDeloadRecommendation: () => set({ deloadRecommendation: null }),

      exportData: () => {
        const state = get();
        return JSON.stringify({
          exportedAt: new Date().toISOString(),
          profile: state.profile,
          blocks: state.blocks,
          customExercises: state.customExercises,
        }, null, 2);
      },
    }),
    {
      name: 'tensile-storage',
      storage: idbStorage as any,
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        profile: state.profile,
        blocks: state.blocks,
        currentBlock: state.currentBlock,
        customExercises: state.customExercises,
      }) as any,
    }
  )
);
