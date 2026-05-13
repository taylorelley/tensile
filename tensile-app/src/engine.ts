// Core Forge engine algorithms per PRD §6

export interface SetInput {
  load: number;
  reps: number;
  rpe: number;
  velocity?: number;
}

export interface e1RMResult {
  session: number;
  rolling: number;
  confidenceIntervalPct: number;
  methodsUsed: string[];
}

// §6.1 e1RM Ensemble
export function calculateE1RM(
  set: SetInput,
  userRpeTable: Record<string, number>,
  userCalibration: { sessions: number; mae: number },
  lvProfile?: { slope: number; intercept: number; n: number }
): { repE1RM: number; repConfidence: number; rpeE1RM: number; rpeConfidence: number; vbtE1RM?: number; vbtConfidence?: number } {
  // Method 1: Rep-based (Epley/Brzycki)
  const epley = set.load * (1 + set.reps / 30);
  const brzycki = set.reps < 37 ? set.load / (1.0278 - 0.0278 * set.reps) : epley;
  const repE1RM = (epley + brzycki) / 2;

  let repConfidence = 0.2;
  if (set.reps <= 3 && set.rpe >= 8.0) repConfidence = 1.0;
  else if (set.reps <= 5 && set.rpe >= 7.5) repConfidence = 0.9;
  else if (set.reps <= 8 && set.rpe >= 7.0) repConfidence = 0.7;
  else if (set.reps <= 10) repConfidence = 0.5;

  // Method 2: RPE-adjusted
  const key = `${set.reps}@${set.rpe}`;
  const rpePct = userRpeTable[key] || 0.85;
  const rpeE1RM = set.load / rpePct;

  let rpeConfidence = 0.3;
  if (userCalibration.sessions >= 20 && userCalibration.mae <= 0.5) rpeConfidence = 1.0;
  else if (userCalibration.sessions >= 10) rpeConfidence = 0.7;
  else if (userCalibration.sessions >= 2) rpeConfidence = 0.5;

  // Method 3: VBT
  let vbtE1RM: number | undefined;
  let vbtConfidence: number | undefined;
  if (set.velocity !== undefined && lvProfile && lvProfile.n >= 10) {
    vbtE1RM = set.load / (lvProfile.slope * set.velocity + lvProfile.intercept);
    vbtConfidence = Math.min(1.2, 0.8 + (lvProfile.n - 10) * 0.02);
  }

  return { repE1RM, repConfidence, rpeE1RM, rpeConfidence, vbtE1RM, vbtConfidence };
}

export function ensembleE1RM(
  set: SetInput,
  userRpeTable: Record<string, number>,
  userCalibration: { sessions: number; mae: number },
  previousRolling: number,
  alpha = 0.3,
  lvProfile?: { slope: number; intercept: number; n: number }
): e1RMResult {
  const { repE1RM, repConfidence, rpeE1RM, rpeConfidence, vbtE1RM, vbtConfidence } =
    calculateE1RM(set, userRpeTable, userCalibration, lvProfile);

  let totalWeight = repConfidence + rpeConfidence;
  let weightedSum = repE1RM * repConfidence + rpeE1RM * rpeConfidence;
  const methodsUsed = ['rep-based', 'rpe-adjusted'];

  if (vbtE1RM !== undefined && vbtConfidence !== undefined) {
    totalWeight += vbtConfidence;
    weightedSum += vbtE1RM * vbtConfidence;
    methodsUsed.push('vbt');
  }

  const session = weightedSum / totalWeight;
  const rolling = alpha * session + (1 - alpha) * previousRolling;

  // Simple CI estimate based on method variance
  const estimates = [repE1RM, rpeE1RM, ...(vbtE1RM !== undefined ? [vbtE1RM] : [])];
  const mean = estimates.reduce((a, b) => a + b, 0) / estimates.length;
  const variance = estimates.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / estimates.length;
  const stdDev = Math.sqrt(variance);
  const ci95 = (stdDev / session) * 1.96 * 100;

  return { session, rolling, confidenceIntervalPct: Math.min(ci95, 15), methodsUsed };
}

// §6.2 Session Fatigue Index
const DEFAULT_EFC: Record<string, number> = {
  'barbell_back_squat': 1.40,
  'front_squat': 1.40,
  'conventional_deadlift': 1.35,
  'bench_press': 0.95,
  'overhead_press': 1.00,
  'romanian_deadlift': 1.25,
  'barbell_row': 0.85,
  'leg_press': 0.75,
  'dumbbell_curl': 0.55,
  'leg_extension': 0.50,
  'default': 0.85,
};

export function calculateSetSFI(rpe: number, reps: number, exerciseId: string, isTopSet = false): number {
  const efc = DEFAULT_EFC[exerciseId] || DEFAULT_EFC['default'];
  const proximityFactor = isTopSet ? 1.2 : 1.0;
  return Math.pow(rpe / 9, 2) * Math.pow(reps, 0.65) * efc * proximityFactor;
}

export function calculateSessionSFI(sets: { rpe: number; reps: number; exerciseId: string; isTopSet: boolean }[]): number {
  return sets.reduce((sum, s) => sum + calculateSetSFI(s.rpe, s.reps, s.exerciseId, s.isTopSet), 0);
}

// §6.3 Readiness Composite Score
export interface WellnessInputs {
  sleepQuality: number; // 1-10
  overallFatigue: number; // 1-10 (inverted: 10 = energised)
  muscleSoreness: number; // 1-10 (inverted: 10 = none)
  motivation: number; // 1-10
  stress: number; // 1-10 (inverted: 10 = none)
}

export function calculateRCS(
  wellness: WellnessInputs,
  hrv7DayRolling?: number,
  hrv28DayBaseline?: number,
  rpeDrift3Sessions = 0
): number {
  const wqRaw = (
    wellness.sleepQuality * 1.20 +
    wellness.overallFatigue * 1.15 +
    wellness.muscleSoreness * 1.00 +
    wellness.motivation * 0.85 +
    wellness.stress * 0.80
  ) / (1.20 + 1.15 + 1.00 + 0.85 + 0.80);

  const wqNormalised = ((wqRaw - 1) / 9) * 100;

  let hrvModifier = 0;
  if (hrv7DayRolling !== undefined && hrv28DayBaseline !== undefined && hrv28DayBaseline > 0) {
    const hrvDeviation = (hrv7DayRolling - hrv28DayBaseline) / hrv28DayBaseline;
    hrvModifier = Math.max(-15, Math.min(10, hrvDeviation * 20));
  }

  const driftPenalty = Math.max(0, Math.min(15, rpeDrift3Sessions * 5));

  return Math.max(0, Math.min(100, Math.round(wqNormalised + hrvModifier - driftPenalty)));
}

export function rcsBand(rcs: number): { band: string; modifier: string } {
  if (rcs >= 85) return { band: 'Excellent', modifier: 'Benchmark may allow +3% load bump; no volume reduction' };
  if (rcs >= 70) return { band: 'Good', modifier: 'Standard prescription; no modification' };
  if (rcs >= 55) return { band: 'Moderate', modifier: 'Drop target reduced by 1–2%; RPE cap reduced by 0.5 points' };
  if (rcs >= 40) return { band: 'Poor', modifier: 'Volume reduced 15–20%; RPE cap −1 point; consider deload' };
  return { band: 'Very poor', modifier: 'Recommend deferring session; minimum recovery if user insists' };
}

// §6.5 Weekly Volume Budget
export function volumeBudget(
  mev: number,
  mrv: number,
  blockWeek: number,
  totalBlockWeeks: number,
  recoverySignal: number
): number {
  let target = mev + (mrv - mev) * (blockWeek / totalBlockWeeks);
  if (recoverySignal < 60) target *= 0.90;
  else if (recoverySignal > 80) target = Math.min(target * 1.05, mrv * 0.95);
  return Math.round(target);
}

// §6.6 Development Block & TTP Detection
export function detectPeak(e1rmTrend: number[], minimumTTP: number, blockWeek: number): boolean {
  if (blockWeek < minimumTTP || e1rmTrend.length < 3) return false;
  const n = e1rmTrend.length;
  return (
    e1rmTrend[n - 1] < e1rmTrend[n - 2] &&
    e1rmTrend[n - 2] < e1rmTrend[n - 3] &&
    Math.max(...e1rmTrend) > e1rmTrend[0] &&
    blockWeek >= minimumTTP
  );
}

export function detectStall(e1rmTrend: number[], blockWeek: number): boolean {
  if (blockWeek <= 3 || e1rmTrend.length < 3) return false;
  const last3 = e1rmTrend.slice(-3);
  const slope = (last3[2] - last3[0]) / 2;
  return Math.abs(slope) < 0.5 && Math.max(...e1rmTrend) <= e1rmTrend[0] * 1.01;
}

// §6.8 Deload Trigger
export interface DeloadSignals {
  peakDetected: boolean;
  wellnessSustainedLow: boolean;
  rpeDrift: boolean;
  hrvTrendLow: boolean;
  aclrFlag: boolean;
  jointPainFlag: boolean;
  ttpExceeded: boolean;
}

export function calculateDeloadScore(signals: DeloadSignals): number {
  let score = 0;
  if (signals.peakDetected) score += 5;
  if (signals.wellnessSustainedLow) score += 4;
  if (signals.rpeDrift) score += 3;
  if (signals.hrvTrendLow) score += 2;
  if (signals.aclrFlag) score += 1;
  if (signals.jointPainFlag) score += 5;
  if (signals.ttpExceeded) score += 4;
  return score;
}

export function deloadRecommendation(score: number, signals: DeloadSignals): { level: string; message: string } {
  if (signals.jointPainFlag) return { level: 'urgent', message: 'Immediate deload recommended. Consider consulting a physiotherapist.' };
  if (score >= 8) return { level: 'strong', message: 'Strong deload recommendation based on multiple fatigue signals.' };
  if (score >= 5) return { level: 'moderate', message: 'Moderate deload suggestion — monitor recovery closely.' };
  if (score >= 3) return { level: 'light', message: 'Light advisory — noted in block review.' };
  return { level: 'none', message: 'No deload action required.' };
}

// §6.9 Competition Peaking Scheduler
export interface PeakingPlan {
  developmentStart: Date;
  pivotStart: Date;
  realisationStart: Date;
  taperStart: Date;
  meetDate: Date;
  weeksAvailable: number;
  feasible: boolean;
}

export function generatePeakingPlan(
  competitionDate: Date,
  ttpEstimate: number,
  pivotWeeks = Math.max(1, Math.min(3, Math.round(ttpEstimate * 0.33)))
): PeakingPlan {
  const taperStart = new Date(competitionDate);
  taperStart.setDate(taperStart.getDate() - 3);

  const realisationStart = new Date(competitionDate);
  realisationStart.setDate(realisationStart.getDate() - 7 - 14); // 2 weeks realisation + 1 week final taper

  const pivotStart = new Date(realisationStart);
  pivotStart.setDate(pivotStart.getDate() - pivotWeeks * 7);

  const developmentStart = new Date(pivotStart);
  developmentStart.setDate(developmentStart.getDate() - ttpEstimate * 7);

  const today = new Date();
  const weeksAvailable = Math.floor((competitionDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const requiredWeeks = Math.ceil((competitionDate.getTime() - developmentStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

  return {
    developmentStart,
    pivotStart,
    realisationStart,
    taperStart,
    meetDate: competitionDate,
    weeksAvailable,
    feasible: weeksAvailable >= requiredWeeks,
  };
}

// RPE-to-percentage table (Tuchscherer/Helms population average)
export const DEFAULT_RPE_TABLE: Record<string, number> = {
  '1@10': 0.96, '1@9.5': 0.95, '1@9': 0.93, '1@8.5': 0.91, '1@8': 0.89, '1@7.5': 0.87, '1@7': 0.85,
  '2@10': 0.93, '2@9.5': 0.92, '2@9': 0.90, '2@8.5': 0.88, '2@8': 0.86, '2@7.5': 0.84, '2@7': 0.81,
  '3@10': 0.91, '3@9.5': 0.89, '3@9': 0.87, '3@8.5': 0.85, '3@8': 0.83, '3@7.5': 0.80, '3@7': 0.77,
  '4@10': 0.88, '4@9.5': 0.86, '4@9': 0.84, '4@8.5': 0.82, '4@8': 0.80, '4@7.5': 0.77, '4@7': 0.74,
  '5@10': 0.86, '5@9.5': 0.84, '5@9': 0.82, '5@8.5': 0.80, '5@8': 0.78, '5@7.5': 0.75, '5@7': 0.72,
  '6@10': 0.83, '6@9.5': 0.81, '6@9': 0.79, '6@8.5': 0.77, '6@8': 0.75, '6@7.5': 0.72, '6@7': 0.69,
  '8@10': 0.78, '8@9.5': 0.76, '8@9': 0.74, '8@8.5': 0.72, '8@8': 0.70, '8@7.5': 0.67, '8@7': 0.64,
  '10@10': 0.73, '10@9.5': 0.71, '10@9': 0.69, '10@8.5': 0.67, '10@8': 0.65, '10@7.5': 0.62, '10@7': 0.59,
};

export function getRpePct(reps: number, rpe: number): number {
  const key = `${reps}@${rpe}`;
  return DEFAULT_RPE_TABLE[key] || 0.80;
}

export function getBackOffDrop(phase: string): number {
  switch (phase) {
    case 'ACCUMULATION': return 0.12;
    case 'INTENSIFICATION': return 0.07;
    case 'REALISATION': return 0.03;
    default: return 0.12;
  }
}
