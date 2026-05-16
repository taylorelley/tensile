// Minimal shape of a replay fixture. Mirrors the persisted Zustand state but
// trimmed to what the engine + metric functions consume — no UI fields.

export interface ReplayWellness {
  sleepQuality: number;
  overallFatigue: number;
  muscleSoreness: number;
  motivation: number;
  stress: number;
  jointPain?: number;
  hrvRmssd?: number;
}

export interface ReplaySet {
  exerciseId: string;
  actualLoad: number;
  actualReps: number;
  actualRpe: number;
  e1rm: number;
  velocity?: number;
  lastRepVelocity?: number;
}

export interface ReplaySession {
  id: string;
  blockId: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'SCHEDULED' | 'COMPLETE' | 'SKIPPED';
  wellness?: ReplayWellness;
  rcs?: number;
  srpe?: number;
  sets: ReplaySet[];
  durationTrimmed?: boolean;
  overrides?: string[];
}

export interface ReplayBlock {
  id: string;
  type: 'DEVELOPMENT' | 'DELOAD' | 'PIVOT';
  phase: 'ACCUMULATION' | 'INTENSIFICATION' | 'REALISATION' | 'DELOAD' | 'PIVOT';
  startDate: string;
  endDate: string;
  week: number;
  status: 'ACTIVE' | 'COMPLETE' | 'ABORTED';
  sessions: ReplaySession[];
  auditLog?: { ruleId: string; timestamp: string; trigger: string; action: string; evidenceTier?: string }[];
}

export interface ReplayProfile {
  bodyWeight: number;
  trainingAge: string;
  trainingAgeYears: number;
  primaryGoal: string;
  programmingMode: 'PHASE' | 'TTP';
  e1rm: Record<string, number>;
  rollingE1rm: Record<string, number>;
  rpeTable: Record<string, number>;
  rpeCalibration: { sessions: number; mae: number };
  ttpEstimate: number;
  ttpHistory: number[];
  hrvHistory?: number[];
  hrv28DayBaseline?: number;
}

export interface ReplayFixture {
  schemaVersion: 1;
  profile: ReplayProfile;
  blocks: ReplayBlock[];
}
