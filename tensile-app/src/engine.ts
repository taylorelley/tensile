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
  userCalibration: { sessions: number; mae: number; trainingAgeYears?: number },
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
  else if ((userCalibration.trainingAgeYears ?? 0) >= 2) rpeConfidence = 0.5;

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

  // Weighted CI estimate based on method variance
  const estimates = [repE1RM, rpeE1RM, ...(vbtE1RM !== undefined ? [vbtE1RM] : [])];
  const weights = [repConfidence, rpeConfidence, ...(vbtE1RM !== undefined && vbtConfidence !== undefined ? [vbtConfidence] : [])];
  const weightedMean = estimates.reduce((a, b, i) => a + b * weights[i], 0) / weights.reduce((a, b) => a + b, 0);
  const weightedVariance = estimates.reduce((a, b, i) => a + weights[i] * Math.pow(b - weightedMean, 2), 0) / weights.reduce((a, b) => a + b, 0);
  const stdDev = Math.sqrt(weightedVariance);
  const ci95 = (stdDev / session) * 1.96 * 100;

  return { session, rolling, confidenceIntervalPct: Math.min(ci95, 15), methodsUsed };
}

// §6.2 Session Fatigue Index
const DEFAULT_EFC: Record<string, number> = {
  // ── Primary / Squat ──────────────────────────────────────────────────────
  'barbell_back_squat': 1.40,
  'front_squat': 1.40,
  'zercher_squat': 1.40,
  'paused_squat': 1.40,
  'box_squat': 1.35,
  'high_bar_squat': 1.40,
  'heel_elevated_squat': 1.30,
  'safety_bar_squat': 1.40,
  // ── Primary / Bench ───────────────────────────────────────────────────────
  'bench_press': 0.95,
  'close_grip_bench': 0.95,
  'incline_press': 0.95,
  'paused_bench': 0.95,
  'spoto_press': 0.95,
  'board_press': 0.90,
  'floor_press': 0.90,
  'dumbbell_bench_press': 0.95,
  'dips': 0.85,
  // ── Primary / Overhead ───────────────────────────────────────────────────
  'overhead_press': 1.00,
  'dumbbell_shoulder_press': 0.95,
  // ── Primary / Deadlift ───────────────────────────────────────────────────
  'conventional_deadlift': 1.35,
  'sumo_deadlift': 1.35,
  'trap_bar_deadlift': 1.35,
  'romanian_deadlift': 1.25,
  'good_morning': 1.25,
  'snatch_grip_deadlift': 1.25,
  'deficit_deadlift': 1.35,
  'block_pull': 1.30,
  'rack_pull': 1.30,
  // ── Back ─────────────────────────────────────────────────────────────────
  'barbell_row': 0.85,
  'dumbbell_row': 0.85,
  'cable_row': 0.85,
  'lat_pulldown': 0.85,
  'pull_up': 0.85,
  'chin_up': 0.85,
  'chest_supported_row': 0.80,
  't_bar_row': 0.85,
  'inverted_row': 0.70,
  'single_arm_row': 0.85,
  // ── Chest (Machine / Cable) ─────────────────────────────────────────────
  'pec_deck': 0.55,
  'cable_fly': 0.55,
  'machine_press': 0.75,
  // ── Shoulders ────────────────────────────────────────────────────────────
  'face_pull': 0.55,
  'rear_delt_fly': 0.55,
  'lateral_raise': 0.55,
  'upright_row': 0.70,
  'shrug': 0.55,
  // ── Legs ─────────────────────────────────────────────────────────────────
  'leg_press': 0.75,
  'hack_squat': 0.75,
  'leg_curl': 0.50,
  'leg_extension': 0.50,
  'calf_raise': 0.50,
  'seated_calf_raise': 0.50,
  'bulgarian_split_squat': 0.85,
  'walking_lunge': 0.85,
  'glute_bridge': 0.55,
  'hip_thrust': 0.75,
  'glute_ham_raise': 0.75,
  'reverse_hyper': 0.55,
  'nordic_curl': 0.55,
  'hip_adductor': 0.40,
  'hip_abductor': 0.40,
  // ── Unilateral Legs ──────────────────────────────────────────────────────
  'single_leg_rdl': 0.80,
  'step_up': 0.80,
  'split_squat': 0.85,
  // ── Arms ─────────────────────────────────────────────────────────────────
  'dumbbell_curl': 0.55,
  'tricep_pushdown': 0.55,
  'tricep_extension': 0.55,
  'skullcrusher': 0.55,
  'preacher_curl': 0.55,
  'hammer_curl': 0.55,
  'reverse_curl': 0.50,
  'concentration_curl': 0.50,
  'bayesian_curl': 0.50,
  'single_arm_press': 0.90,
  // ── Core ─────────────────────────────────────────────────────────────────
  'plank': 0.30,
  'hanging_leg_raise': 0.40,
  'ab_wheel': 0.40,
  'pallof_press': 0.30,
  'dragon_flag': 0.40,
  'russian_twist': 0.30,
  'dead_bug': 0.20,
  'farmers_walk': 0.40,
  'suitcase_carry': 0.35,
  'turkish_get_up': 0.70,
  'kettlebell_swing': 0.85,
  // ── Fallback ─────────────────────────────────────────────────────────────
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
  hrvRmssd?: number; // optional manual HRV entry (ms)
}

export function calculateRCS(
  wellness: WellnessInputs,
  hrv7DayRolling?: number,
  hrv28DayBaseline?: number,
  rpeDrift3Sessions = 0
): number {
  // Use real HRV if provided in wellness, otherwise fall back to synthetic estimate
  const effectiveHrv7Day = wellness.hrvRmssd !== undefined ? wellness.hrvRmssd : hrv7DayRolling;
  const wqRaw = (
    wellness.sleepQuality * 1.20 +
    wellness.overallFatigue * 1.15 +
    wellness.muscleSoreness * 1.00 +
    wellness.motivation * 0.85 +
    wellness.stress * 0.80
  ) / (1.20 + 1.15 + 1.00 + 0.85 + 0.80);

  const wqNormalised = ((wqRaw - 1) / 9) * 100;

  let hrvModifier = 0;
  if (effectiveHrv7Day !== undefined && hrv28DayBaseline !== undefined && hrv28DayBaseline > 0) {
    const hrvDeviation = (effectiveHrv7Day - hrv28DayBaseline) / hrv28DayBaseline;
    hrvModifier = Math.max(-15, Math.min(10, hrvDeviation * 20));
  }

  const driftPenalty = Math.max(0, Math.min(15, rpeDrift3Sessions * 5));

  return Math.max(0, Math.min(100, Math.round(wqNormalised + hrvModifier - driftPenalty)));
}

export function rcsBand(rcs: number): { band: string; modifier: string } {
  if (rcs >= 85) return { band: 'Excellent', modifier: 'Top-set load +3%; back-off load +3%; no volume reduction' };
  if (rcs >= 70) return { band: 'Good', modifier: 'Standard prescription; no modification' };
  if (rcs >= 55) return { band: 'Moderate', modifier: 'Back-off load −2%; no RPE cap change' };
  if (rcs >= 40) return { band: 'Poor', modifier: 'Back-off load −5%; RPE cap −1 point; consider deload' };
  return { band: 'Very poor', modifier: 'Back-off load −10%; RPE cap −1 point; defer session if possible' };
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
  const maxVal = Math.max(...e1rmTrend);
  const maxIdx = e1rmTrend.lastIndexOf(maxVal);
  // Detect peak after 2 consecutive declining weeks: max is not in the last position,
  // the last 2 values are declining, and progress was made above the starting value.
  return (
    maxIdx < n - 2 &&
    e1rmTrend[n - 1] < e1rmTrend[n - 2] &&
    e1rmTrend[n - 2] < e1rmTrend[n - 3] &&
    maxVal > e1rmTrend[0]
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
  stallDetected: boolean;
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
  if (signals.stallDetected) score += 4;
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
  // 7-rep row: interpolated (average of 6-rep and 8-rep rows)
  '7@10': 0.805, '7@9.5': 0.785, '7@9': 0.765, '7@8.5': 0.745, '7@8': 0.725, '7@7.5': 0.695, '7@7': 0.665,
  '8@10': 0.78, '8@9.5': 0.76, '8@9': 0.74, '8@8.5': 0.72, '8@8': 0.70, '8@7.5': 0.67, '8@7': 0.64,
  // 9-rep row: interpolated (average of 8-rep and 10-rep rows)
  '9@10': 0.755, '9@9.5': 0.735, '9@9': 0.715, '9@8.5': 0.695, '9@8': 0.675, '9@7.5': 0.645, '9@7': 0.615,
  '10@10': 0.73, '10@9.5': 0.71, '10@9': 0.69, '10@8.5': 0.67, '10@8': 0.65, '10@7.5': 0.62, '10@7': 0.59,
};

export function getRpePct(reps: number, rpe: number, userTable?: Record<string, number>): number {
  const key = `${reps}@${rpe}`;
  if (userTable && userTable[key] !== undefined) return userTable[key];
  return DEFAULT_RPE_TABLE[key] || 0.80;
}

/** Update user's RPE table from observed performance. EWMA with α=0.1 toward observed %1RM.
 *  Returns the updated table and a flag indicating if it's now personalised. */
export function personalizeRpeTable(
  currentTable: Record<string, number>,
  load: number,
  reps: number,
  rpe: number,
  e1rmSession: number
): { table: Record<string, number>; isPersonalised: boolean } {
  if (e1rmSession <= 0 || load <= 0) return { table: currentTable, isPersonalised: false };
  const observedPct = load / e1rmSession;
  const key = `${reps}@${rpe}`;
  const currentPct = currentTable[key] ?? DEFAULT_RPE_TABLE[key] ?? 0.80;
  const alpha = 0.1;
  const updatedPct = currentPct * (1 - alpha) + observedPct * alpha;
  const updatedTable = { ...currentTable, [key]: Math.round(updatedPct * 1000) / 1000 };
  // Consider personalised after 4+ weeks of data (proxy: ≥20 keys have deviated from default)
  const personalisedKeys = Object.keys(updatedTable).filter(k => {
    const defaultVal = DEFAULT_RPE_TABLE[k];
    return defaultVal !== undefined && Math.abs(updatedTable[k] - defaultVal) > 0.005;
  });
  return { table: updatedTable, isPersonalised: personalisedKeys.length >= 20 };
}

/** Check if a logged set is an RPE outlier (observed %1RM deviates >15% from expected).
 *  Returns true if the set should be flagged/rejected for RPE table updates. */
export function isRpeOutlier(
  load: number,
  reps: number,
  rpe: number,
  e1rmSession: number,
  userTable: Record<string, number>
): boolean {
  if (e1rmSession <= 0 || load <= 0) return false;
  const observedPct = load / e1rmSession;
  const key = `${reps}@${rpe}`;
  const expectedPct = userTable[key] ?? DEFAULT_RPE_TABLE[key] ?? 0.80;
  const deviation = Math.abs(observedPct - expectedPct) / expectedPct;
  return deviation > 0.15;
}

/** Estimate session duration in minutes (PRD §7.2.3) */
export function estimateSessionDuration(exercises: { sets: number; reps: number; rpeTarget: number; tag: string }[]): number {
  const warmupTime = 15;
  const avgSetDuration = 0.75; // minutes
  let workingTime = 0;
  for (const ex of exercises) {
    let restMin: number;
    if (ex.rpeTarget >= 8) restMin = 4;
    else if (ex.rpeTarget >= 7) restMin = 2.5;
    else restMin = 1.75;
    workingTime += ex.sets * (avgSetDuration + restMin);
  }
  return Math.round(warmupTime + workingTime);
}

/** Weak-point accessory template selector (PRD §4.9, §6.7).
 *  Bias selection toward exercises that target the user's weak point for a given primary lift.
 *  Returns a list of candidate exercises with priority scores. */
export function getAccessoryTemplate(
  primaryLift: string,
  blockPhase: string,
  weakPoints: Record<string, string>,
  catalog: { id: string; name: string; tag: string; defaultSets: number; defaultReps: number; defaultRpe: number; weakPointTargets?: { liftId: string; position: string }[]; primaryMuscles: string[] }[]
): { id: string; name: string; tag: string; sets: number; reps: number; rpeTarget: number; primaryMuscles: string[]; priority: number }[] {
  const weakPoint = weakPoints[primaryLift];
  const candidates = catalog
    .filter(ex => ex.tag !== 'PRIMARY' && ex.tag !== 'CORE')
    .map(ex => {
      const targetsWeakPoint = ex.weakPointTargets?.some(
        wpt => wpt.liftId === primaryLift && wpt.position === weakPoint
      );
      const priority = targetsWeakPoint ? 1.5 : 1.0;
      // Phase modifiers
      let reps = ex.defaultReps;
      let rpe = ex.defaultRpe;
      if (blockPhase === 'REALISATION') {
        reps = Math.max(1, reps - 2);
        rpe = Math.min(10, rpe + 1.0);
      } else if (blockPhase === 'INTENSIFICATION') {
        reps = Math.max(1, reps - 1);
        rpe = Math.min(10, rpe + 0.5);
      }
      return {
        id: ex.id,
        name: ex.name,
        tag: ex.tag,
        sets: ex.defaultSets,
        reps,
        rpeTarget: rpe,
        primaryMuscles: ex.primaryMuscles,
        priority,
      };
    });
  // Sort by priority descending, then shuffle within same priority for variety
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates;
}

/** Compute Pearson correlation coefficient between two arrays */
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n < 2) return 0;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

export function getBackOffDrop(phase: string, blockWeek = 1, totalBlockWeeks = 6): number {
  const t = totalBlockWeeks > 1 ? (blockWeek - 1) / (totalBlockWeeks - 1) : 0;
  switch (phase) {
    case 'ACCUMULATION': return 0.10 + (0.15 - 0.10) * t; // interpolate 10% → 15%
    case 'INTENSIFICATION': return 0.05 + (0.08 - 0.05) * t; // interpolate 5% → 8%
    case 'REALISATION': return 0.02; // minimal back-off, preserve CNS freshness
    default: return 0.12;
  }
}
