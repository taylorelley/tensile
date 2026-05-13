import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ensembleE1RM, DEFAULT_RPE_TABLE } from './engine';

export type BlockPhase = 'ACCUMULATION' | 'INTENSIFICATION' | 'REALISATION' | 'DELOAD' | 'PIVOT';
export type BlockType = 'DEVELOPMENT' | 'DELOAD' | 'PIVOT' | 'PEAK';

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
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE' | 'SKIPPED';
  overrides: any[];
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

interface AppState {
  // Onboarding
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;

  // Profile
  profile: UserProfile;
  setProfile: (p: Partial<UserProfile>) => void;
  updateE1rm: (lift: string, set: any) => void;

  // Blocks
  blocks: Block[];
  currentBlock: Block | null;
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  addSession: (blockId: string, session: Session) => void;
  updateSession: (blockId: string, sessionId: string, updates: Partial<Session>) => void;
  addSet: (blockId: string, sessionId: string, set: SetLog) => void;

  // Session flow
  currentSession: Session | null;
  setCurrentSession: (s: Session | null) => void;

  // Navigation
  currentTab: string;
  setCurrentTab: (t: string) => void;
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
  excludedExercises: ['Conventional DL'],
  squatStance: 'moderate',
  deadliftStance: 'conventional',
  belt: true,
  kneeSleeves: 'sleeves',
  weakPoints: { squat: 'out_of_hole', bench: 'off_chest', deadlift: 'off_floor' },
  e1rm: { squat: 212, bench: 143, deadlift: 233 },
  rollingE1rm: { squat: 210, bench: 142, deadlift: 230 },
  ttpEstimate: 6,
  ttpHistory: [5, 6, 5],
  completedBlocks: 3,
  rpeCalibration: { sessions: 45, mae: 0.4 },
  rpeTable: DEFAULT_RPE_TABLE,
  mevEstimates: { quads: 10, hamstrings: 8, glutes: 8, pecs: 10, delts: 8, triceps: 8, lats: 10, biceps: 6, core: 8 },
  mrvEstimates: { quads: 22, hamstrings: 20, glutes: 20, pecs: 22, delts: 18, triceps: 20, lats: 22, biceps: 18, core: 20 },
  accessoryResponsiveness: { 'paused_squat': 0.68, 'romanian_dl': 0.42, 'front_squat': 0.18, 'leg_extension': -0.21, 'hip_thrust': 0.55 },
};

const demoBlock: Block = {
  id: 'block-04',
  type: 'DEVELOPMENT',
  phase: 'ACCUMULATION',
  startDate: '2026-04-02',
  week: 3,
  status: 'ACTIVE',
  sessions: [
    {
      id: 'sess-01',
      blockId: 'block-04',
      scheduledDate: '2026-05-14',
      wellness: { sleepQuality: 7, overallFatigue: 6, muscleSoreness: 5, motivation: 8, stress: 6 },
      rcs: 72,
      sfi: 84.2,
      volumeLoad: 9400,
      status: 'SCHEDULED',
      sets: [],
      overrides: [],
    }
  ],
};

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

      blocks: [demoBlock],
      currentBlock: demoBlock,
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
      }),
      updateSession: (blockId, sessionId, updates) => set({
        blocks: get().blocks.map(b =>
          b.id === blockId
            ? { ...b, sessions: b.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s) }
            : b
        ),
      }),
      addSet: (blockId, sessionId, setLog) => set({
        blocks: get().blocks.map(b =>
          b.id === blockId
            ? { ...b, sessions: b.sessions.map(s => s.id === sessionId ? { ...s, sets: [...s.sets, setLog] } : s) }
            : b
        ),
      }),

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
