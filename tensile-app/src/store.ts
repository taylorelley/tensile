import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ensembleE1RM, DEFAULT_RPE_TABLE, calculateSessionSFI } from './engine';
import type { SetInput } from './engine';

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
  rcs: number;
  srpe?: number;
  sfi: number;
  volumeLoad: number;
  sets: SetLog[];
  exercises: SessionExercise[];
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE' | 'SKIPPED';
  overrides: unknown[];
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
}

export interface UserProfile {
  bodyWeight: number;
  dob: string;
  sex: 'Male' | 'Female';
  height?: number;
  trainingAge: string;
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
  completedBlocks: number;
  rpeCalibration: { sessions: number; mae: number };
  rpeTable: Record<string, number>;
  mevEstimates: Record<string, number>;
  mrvEstimates: Record<string, number>;
  accessoryResponsiveness: Record<string, number>;
}

function createDayPlan(dayIndex: number): { focus: string; exercises: SessionExercise[] } {
  const map: Record<number, string> = {
    0: 'Squat',
    2: 'Bench',
    4: 'Deadlift',
    5: 'Bench (variation)',
  };
  const focus = map[dayIndex] || 'GPP';
  const ex: SessionExercise[] = [];
  if (focus === 'Squat') {
    ex.push({ id: 'barbell_back_squat', name: 'Back squat', tag: 'PRIMARY', sets: 4, reps: 3, rpeTarget: 8.5, dropPct: 12 });
    ex.push({ id: 'paused_squat', name: 'Paused squat', tag: 'ASSIST', sets: 3, reps: 4, rpeTarget: 8.0 });
    ex.push({ id: 'romanian_deadlift', name: 'Romanian DL', tag: 'SUPP', sets: 3, reps: 8, rpeTarget: 7.5 });
    ex.push({ id: 'leg_curl', name: 'Leg curl', tag: 'SUPP', sets: 3, reps: 12, rpeTarget: 8.0 });
    ex.push({ id: 'plank', name: 'Plank', tag: 'CORE', sets: 3, reps: 1, rpeTarget: 7.0 });
  } else if (focus === 'Bench') {
    ex.push({ id: 'bench_press', name: 'Bench press', tag: 'PRIMARY', sets: 4, reps: 4, rpeTarget: 8.0, dropPct: 12 });
    ex.push({ id: 'overhead_press', name: 'Overhead press', tag: 'ASSIST', sets: 3, reps: 6, rpeTarget: 8.0 });
    ex.push({ id: 'cable_row', name: 'Cable row', tag: 'SUPP', sets: 3, reps: 10, rpeTarget: 8.0 });
    ex.push({ id: 'dumbbell_curl', name: 'Dumbbell curl', tag: 'SUPP', sets: 3, reps: 12, rpeTarget: 8.5 });
    ex.push({ id: 'plank', name: 'Plank', tag: 'CORE', sets: 3, reps: 1, rpeTarget: 7.0 });
  } else if (focus === 'Deadlift') {
    ex.push({ id: 'conventional_deadlift', name: 'Conventional DL', tag: 'PRIMARY', sets: 3, reps: 2, rpeTarget: 8.5, dropPct: 10 });
    ex.push({ id: 'front_squat', name: 'Front squat', tag: 'ASSIST', sets: 3, reps: 5, rpeTarget: 8.0 });
    ex.push({ id: 'barbell_row', name: 'Barbell row', tag: 'SUPP', sets: 3, reps: 8, rpeTarget: 8.0 });
    ex.push({ id: 'leg_extension', name: 'Leg extension', tag: 'SUPP', sets: 3, reps: 12, rpeTarget: 8.0 });
    ex.push({ id: 'plank', name: 'Plank', tag: 'CORE', sets: 3, reps: 1, rpeTarget: 7.0 });
  } else if (focus === 'Bench (variation)') {
    ex.push({ id: 'close_grip_bench', name: 'Close-grip bench', tag: 'PRIMARY', sets: 4, reps: 5, rpeTarget: 7.5, dropPct: 10 });
    ex.push({ id: 'incline_press', name: 'Incline press', tag: 'ASSIST', sets: 3, reps: 6, rpeTarget: 8.0 });
    ex.push({ id: 'lat_pulldown', name: 'Lat pulldown', tag: 'SUPP', sets: 3, reps: 10, rpeTarget: 8.0 });
    ex.push({ id: 'lateral_raise', name: 'Lateral raise', tag: 'SUPP', sets: 3, reps: 15, rpeTarget: 8.5 });
    ex.push({ id: 'plank', name: 'Plank', tag: 'CORE', sets: 3, reps: 1, rpeTarget: 7.0 });
  }
  return { focus, exercises: ex };
}

export function generateBlock(profile: UserProfile): Block {
  const blockId = `block-${Date.now()}`;
  const start = new Date();
  const sessions: Session[] = [];
  for (let i = 0; i < 7; i++) {
    if (!profile.availableDays[i]) continue;
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const plan = createDayPlan(i);
    const session: Session = {
      id: `sess-${blockId}-${i}`,
      blockId,
      scheduledDate: d.toISOString().split('T')[0],
      status: 'SCHEDULED',
      exercises: plan.exercises,
      wellness: { sleepQuality: 7, overallFatigue: 6, muscleSoreness: 5, motivation: 8, stress: 6 },
      rcs: 0,
      sfi: 0,
      volumeLoad: 0,
      sets: [],
      overrides: [],
    };
    sessions.push(session);
  }
  return {
    id: blockId,
    type: 'DEVELOPMENT',
    phase: 'ACCUMULATION',
    startDate: start.toISOString().split('T')[0],
    week: 1,
    status: 'ACTIVE',
    sessions,
  };
}

const defaultProfile: UserProfile = {
  bodyWeight: 84.5,
  dob: '1991-06-12',
  sex: 'Male',
  height: 178,
  trainingAge: '2–5 years',
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
  completedBlocks: 0,
  rpeCalibration: { sessions: 0, mae: 1.0 },
  rpeTable: DEFAULT_RPE_TABLE,
  mevEstimates: { quads: 10, hamstrings: 8, glutes: 8, pecs: 10, delts: 8, triceps: 8, lats: 10, biceps: 6, core: 8 },
  mrvEstimates: { quads: 22, hamstrings: 20, glutes: 20, pecs: 22, delts: 18, triceps: 20, lats: 22, biceps: 18, core: 20 },
  accessoryResponsiveness: {},
};

interface AppState {
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;

  profile: UserProfile;
  setProfile: (p: Partial<UserProfile>) => void;
  updateE1rm: (lift: string, set: SetInput) => void;

  blocks: Block[];
  currentBlock: Block | null;
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  addSession: (blockId: string, session: Session) => void;
  updateSession: (blockId: string, sessionId: string, updates: Partial<Session>) => void;
  addSet: (blockId: string, sessionId: string, set: SetLog) => void;
  startSession: (blockId: string, sessionId: string) => void;
  logSet: (blockId: string, sessionId: string, set: SetLog) => void;
  completeSession: (blockId: string, sessionId: string, srpe: number) => void;
  generateFirstBlock: () => void;

  currentSession: Session | null;
  setCurrentSession: (s: Session | null) => void;

  currentTab: string;
  setCurrentTab: (t: string) => void;
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
      addSet: (blockId, sessionId, setLog) => set({
        blocks: get().blocks.map(b =>
          b.id === blockId
            ? { ...b, sessions: b.sessions.map(s => s.id === sessionId ? { ...s, sets: [...s.sets, setLog] } : s) }
            : b
        ),
        currentBlock: get().currentBlock?.id === blockId
          ? { ...get().currentBlock!, sessions: get().currentBlock!.sessions.map(s => s.id === sessionId ? { ...s, sets: [...s.sets, setLog] } : s) }
          : get().currentBlock,
        currentSession: get().currentSession?.id === sessionId
          ? { ...get().currentSession!, sets: [...get().currentSession!.sets, setLog] }
          : get().currentSession,
      }),

      startSession: (blockId, sessionId) => {
        const block = get().blocks.find(b => b.id === blockId);
        const session = block?.sessions.find(s => s.id === sessionId);
        if (session) set({ currentSession: session });
      },

      logSet: (blockId, sessionId, setLog) => {
        const state = get();
        const block = state.blocks.find(b => b.id === blockId);
        const session = block?.sessions.find(s => s.id === sessionId);
        if (!session) return;
        const newSets = [...session.sets, setLog];
        const volumeLoad = Math.round(newSets.reduce((sum, s) => sum + s.actualLoad * s.actualReps, 0));
        const sfi = Math.round(calculateSessionSFI(newSets.map(s => ({ rpe: s.actualRpe, reps: s.actualReps, exerciseId: s.exerciseId, isTopSet: s.setType === 'TOP_SET' }))) * 10) / 10;
        const updates: Partial<Session> = { sets: newSets, volumeLoad, sfi, status: 'IN_PROGRESS' };

        // Update e1RM for primary lifts
        const profile = state.profile;
        const liftMap: Record<string, string> = {
          barbell_back_squat: 'squat',
          bench_press: 'bench',
          conventional_deadlift: 'deadlift',
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
          newProfile = {
            ...profile,
            e1rm: { ...profile.e1rm, [lift]: Math.round(result.session * 10) / 10 },
            rollingE1rm: { ...profile.rollingE1rm, [lift]: Math.round(result.rolling * 10) / 10 },
          };
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
        const updates: Partial<Session> = { status: 'COMPLETE', completedDate: new Date().toISOString().split('T')[0], srpe };
        set({
          blocks: state.blocks.map(b => b.id === blockId ? { ...b, sessions: b.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s) } : b),
          currentBlock: state.currentBlock?.id === blockId
            ? { ...state.currentBlock, sessions: state.currentBlock.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s) }
            : state.currentBlock,
          currentSession: state.currentSession?.id === sessionId ? { ...state.currentSession, ...updates } : state.currentSession,
        });
      },

      generateFirstBlock: () => {
        const profile = get().profile;
        const block = generateBlock(profile);
        set({ blocks: [block], currentBlock: block, currentSession: null });
      },

      currentSession: null,
      setCurrentSession: (s) => set({ currentSession: s }),

      currentTab: 'today',
      setCurrentTab: (t) => set({ currentTab: t }),
    }),
    {
      name: 'tensile-storage',
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        profile: state.profile,
        blocks: state.blocks,
        currentBlock: state.currentBlock,
        currentTab: state.currentTab,
      }),
    }
  )
);
