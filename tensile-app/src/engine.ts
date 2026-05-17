// Core Forge engine algorithms per PRD §6

// ── Tunable constants ──────────────────────────────────────────────────────
// All numeric thresholds that gate engine behaviour are hoisted here so the
// replay/backtesting harness can sweep them without monkey-patching call sites.
// Production code reads `getConstants()`; tests call `setConstants()` before a
// run and `resetConstants()` after.
export interface EngineConstants {
  /** Rolling e1RM EMA weight on the newest session (engine §6.1). */
  e1rmAlpha: number;
  /** RPE-table EWMA weight per logged set (engine §6.1 personalisation). */
  rpeAlpha: number;
  /** Fixed-bound fraction used as fallback when MAD has too few obs. */
  rpeOutlierBand: number;
  /** Modified-Z (Iglewicz–Hoaglin) threshold for per-cell outlier detection. */
  rpeOutlierZ: number;
  /** Minimum observations per (reps,rpe) cell before MAD-based detection kicks in. */
  rpeOutlierMinObs: number;
  /** Rolling window length for per-cell MAD observations. */
  rpeOutlierWindow: number;
  /** Structural minimum declining weeks before a peak is declared. */
  peakDeclineWeeks: number;
  /** Magnitude gate multiplier on per-lifter weekly e1RM residual SD. */
  peakNoiseMultiplier: number;
  /** Deload signal weights (kept in named map for clarity in the harness). */
  deloadWeights: {
    peak: number; stall: number; wellness: number; rpeDrift: number;
    hrv: number; aclr: number; jointPain: number; ttp: number;
  };
  /** Deload tier cutoffs on the (clustered) score. */
  deloadTiers: { strong: number; moderate: number; light: number };
  /** ACLR (acute:chronic) amber threshold. */
  aclrThreshold: number;
  /** Minimum paired-weeks before accessory correlation is stored. */
  accessoryMinN: number;
  /** Spearman ρ magnitude required to record an accessory as responsive. */
  accessoryR: number;
  /** Paired-n needed to drop the exploratory badge in the UI. */
  accessoryConfidentN: number;
  /** Weak-point selection priority multiplier. */
  weakPointMultiplier: number;
  /** Per-exercise VBT e1RM bias correction (kg subtracted). */
  vbtBias: Record<string, number>;
  /** Minimum lvProfile.n + R² required before VBT contributes to the ensemble. */
  vbtMinN: number;
  vbtMinR2: number;
  /** Block boundary minimum for hypertrophy responsiveness signal placeholder. */
  hypertrophyMinSets: number;
  /** When age >= this value the engine applies age-scaling defaults (P3.6.3). */
  ageScalingFrom: number;
  /** Recovery half-life (hours) for high-demand muscle groups (EFC ≥ 1.25). */
  recoveryHalfLifeHigh: number;
  /** Recovery half-life (hours) for moderate-demand muscle groups (0.70 ≤ EFC < 1.25). */
  recoveryHalfLifeMod: number;
  /** Recovery half-life (hours) for low-demand muscle groups (EFC < 0.70). */
  recoveryHalfLifeLow: number;
  /** Target push:pull movement-pattern ratio within each session (1.0 = balanced). */
  pushPullTargetRatio: number;
  /** Maximum aggregate SFI per session before no more exercises are added. */
  sfiBudgetPerSession: number;
  /** Minimum hours required between squat and deadlift in a microcycle. */
  primaryLiftMinGap: number;
}

export const DEFAULT_CONSTANTS: EngineConstants = {
  e1rmAlpha: 0.12,
  rpeAlpha: 0.10,
  rpeOutlierBand: 0.15,
  rpeOutlierZ: 3.5,
  rpeOutlierMinObs: 5,
  rpeOutlierWindow: 20,
  peakDeclineWeeks: 2,
  peakNoiseMultiplier: 1.0,
  deloadWeights: {
    peak: 5, stall: 4, wellness: 4, rpeDrift: 3,
    hrv: 2, aclr: 1, jointPain: 5, ttp: 4,
  },
  deloadTiers: { strong: 8, moderate: 5, light: 3 },
  aclrThreshold: 1.5,
  accessoryMinN: 12,
  accessoryR: 0.4,
  accessoryConfidentN: 20,
  weakPointMultiplier: 1.5,
  vbtBias: {
    conventional_deadlift: 2.5,
    sumo_deadlift: 2.5,
    hip_thrust: 3.0,
  },
  vbtMinN: 5,
  vbtMinR2: 0.9,
  hypertrophyMinSets: 10,
  ageScalingFrom: 40,
  recoveryHalfLifeHigh: 60,
  recoveryHalfLifeMod: 48,
  recoveryHalfLifeLow: 36,
  pushPullTargetRatio: 1.0,
  sfiBudgetPerSession: 14.0,
  primaryLiftMinGap: 48,
};

let CONSTANTS: EngineConstants = { ...DEFAULT_CONSTANTS };

export function getConstants(): EngineConstants { return CONSTANTS; }
export function setConstants(c: Partial<EngineConstants>): void {
  CONSTANTS = { ...DEFAULT_CONSTANTS, ...CONSTANTS, ...c };
}
export function resetConstants(): void { CONSTANTS = { ...DEFAULT_CONSTANTS }; }

export interface SetInput {
  load: number;
  reps: number;
  rpe: number;
  velocity?: number;
  /** Optional last-rep velocity (m/s) for objective RPE calibration */
  lastRepVelocity?: number;
}

export interface LvProfile {
  slope: number;
  intercept: number;
  n: number;
  /** Coefficient of determination from the calibration fit (P1.4.5). */
  rSquared?: number;
  /** Equipment used during calibration; prescription requires a match. */
  equipment?: { straps: boolean; belt: boolean; sleeves: boolean; wraps: boolean };
}

export type LiftKey = 'squat' | 'bench' | 'deadlift';

/** Infer the primary-lift bucket an exerciseId belongs to. Returns undefined for accessories. */
export function inferLiftKey(exerciseId: string): LiftKey | undefined {
  if (exerciseId.includes('squat') || exerciseId === 'front_squat' || exerciseId === 'paused_squat') return 'squat';
  if (exerciseId.includes('deadlift') || exerciseId === 'romanian_deadlift') return 'deadlift';
  if (exerciseId.includes('bench') || exerciseId.includes('press')) return 'bench';
  return undefined;
}

/** Resolve the most-specific load-velocity profile available: per-lift first, then global fallback. */
export function resolveLvProfile(
  profiles: { lvProfile?: LvProfile; lvProfiles?: Partial<Record<LiftKey, LvProfile>> },
  liftKey?: LiftKey
): LvProfile | undefined {
  if (liftKey && profiles.lvProfiles?.[liftKey]) return profiles.lvProfiles[liftKey];
  return profiles.lvProfile;
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
  lvProfile?: { slope: number; intercept: number; n: number; rSquared?: number }
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

  // Method 3: VBT — gated by per-exercise sample-size and R² thresholds (P1.4.5).
  let vbtE1RM: number | undefined;
  let vbtConfidence: number | undefined;
  const { vbtMinN, vbtMinR2 } = getConstants();
  const r2 = lvProfile?.rSquared;
  const vbtGate = lvProfile && lvProfile.n >= vbtMinN && (r2 === undefined || r2 >= vbtMinR2);
  if (set.velocity !== undefined && lvProfile && vbtGate) {
    vbtE1RM = set.load / (lvProfile.slope * set.velocity + lvProfile.intercept);
    vbtConfidence = Math.min(1.2, 0.8 + Math.max(0, lvProfile.n - 10) * 0.02);
  }

  return { repE1RM, repConfidence, rpeE1RM, rpeConfidence, vbtE1RM, vbtConfidence };
}

export function ensembleE1RM(
  set: SetInput,
  userRpeTable: Record<string, number>,
  userCalibration: { sessions: number; mae: number },
  previousRolling: number,
  alpha: number = getConstants().e1rmAlpha,
  lvProfile?: { slope: number; intercept: number; n: number },
  exerciseId?: string
): e1RMResult {
  const { repE1RM, repConfidence, rpeE1RM, rpeConfidence, vbtE1RM: rawVbtE1RM, vbtConfidence: rawVbtConfidence } =
    calculateE1RM(set, userRpeTable, userCalibration, lvProfile);

  // VBT bias correction per exercise (P1.4.5).
  let vbtE1RM = rawVbtE1RM;
  const vbtConfidence = rawVbtConfidence;
  if (vbtE1RM !== undefined && exerciseId) {
    const bias = getConstants().vbtBias[exerciseId];
    if (bias) vbtE1RM = Math.max(0, vbtE1RM - bias);
  }

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
  /** P2.5.2: optional joint-pain slider (1 = none, 10 = severe). When >= 7
   *  the deload trigger escalates to urgent regardless of other signals. */
  jointPain?: number;
}

export function calculateRCS(
  wellness: WellnessInputs,
  hrv7DayRolling?: number,
  hrv28DayBaseline?: number,
  rpeDrift3Sessions = 0
): number {
  // P0.3.1: HRV only contributes when a real reading exists. No synthetic
  // estimate is derived from the wellness composite to avoid double-counting.
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
/** Estimate the per-lifter weekly e1RM residual SD by detrending with a simple
 *  linear fit (least-squares) over the supplied trend and returning the SD of
 *  residuals. Returns 0 if the trend is too short to fit. Exported for the
 *  replay harness and audit-log inspection. */
export function weeklyE1rmResidualSd(e1rmTrend: number[]): number {
  const n = e1rmTrend.length;
  if (n < 4) return 0;
  const xs = e1rmTrend.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = e1rmTrend.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (e1rmTrend[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  const residSq = e1rmTrend.reduce((sum, y, i) => sum + (y - (slope * i + intercept)) ** 2, 0);
  return Math.sqrt(residSq / (n - 1));
}

export function detectPeak(e1rmTrend: number[], minimumTTP: number, blockWeek: number): boolean {
  const { peakDeclineWeeks, peakNoiseMultiplier } = getConstants();
  // Need at least one prior point beyond the declining tail and the structural
  // minimum number of declining weeks.
  if (blockWeek < minimumTTP || e1rmTrend.length < peakDeclineWeeks + 1) return false;
  const n = e1rmTrend.length;
  const maxVal = Math.max(...e1rmTrend);
  const maxIdx = e1rmTrend.lastIndexOf(maxVal);
  if (maxIdx >= n - peakDeclineWeeks) return false;
  // Structural rule: peakDeclineWeeks consecutive decreases at the tail.
  for (let i = n - peakDeclineWeeks; i < n; i++) {
    if (e1rmTrend[i] >= e1rmTrend[i - 1]) return false;
  }
  if (maxVal <= e1rmTrend[0]) return false;
  // P0.3.3 noise gate: decline magnitude must exceed the per-lifter residual SD.
  const sd = weeklyE1rmResidualSd(e1rmTrend);
  if (sd > 0 && maxVal - e1rmTrend[n - 1] < peakNoiseMultiplier * sd) return false;
  return true;
}

export function detectStall(e1rmTrend: number[], blockWeek: number): boolean {
  if (blockWeek <= 3 || e1rmTrend.length < 3) return false;
  const last3 = e1rmTrend.slice(-3);
  const slope = (last3[2] - last3[0]) / 2;
  return Math.abs(slope) < 0.5 && Math.max(...e1rmTrend) <= e1rmTrend[0] * 1.01;
}

// §6.7 Acute:Chronic Workload Ratio (EWMA, Williams et al. 2017)

export interface AclrInput {
  /** YYYY-MM-DD or any Date-parseable string */
  date: string;
  /** Per-session sRPE-load (preferred) or SFI fallback */
  load: number;
}

export interface AclrResult {
  acute: number;
  chronic: number;
  ratio: number;
  /** True while the chronic baseline has < 14 days of data — ratio is unreliable */
  calibrating: boolean;
}

/** Compute EWMA-based acute:chronic workload ratio over daily session loads.
 *  λ_acute  = 2/(7+1)  = 0.25   (7-day half-life)
 *  λ_chronic = 2/(28+1) ≈ 0.069 (28-day half-life)
 *  Days without sessions contribute load = 0 (decay continues). */
export function computeEwmaAclr(
  sessions: AclrInput[],
  referenceDate: Date = new Date()
): AclrResult {
  const lambdaAcute = 2 / (7 + 1);
  const lambdaChronic = 2 / (28 + 1);

  if (sessions.length === 0) {
    return { acute: 0, chronic: 0, ratio: 0, calibrating: true };
  }

  const sorted = [...sessions]
    .filter(s => s.date && s.load >= 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (sorted.length === 0) {
    return { acute: 0, chronic: 0, ratio: 0, calibrating: true };
  }

  const firstDay = new Date(sorted[0].date);
  firstDay.setHours(0, 0, 0, 0);
  const refDay = new Date(referenceDate);
  refDay.setHours(0, 0, 0, 0);
  const totalDays = Math.floor((refDay.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (totalDays <= 0) {
    return { acute: 0, chronic: 0, ratio: 0, calibrating: true };
  }

  // Bucket loads per day (summed if multiple sessions)
  const dailyLoad: number[] = Array(totalDays).fill(0);
  for (const s of sorted) {
    const day = new Date(s.date);
    day.setHours(0, 0, 0, 0);
    const idx = Math.floor((day.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24));
    if (idx >= 0 && idx < totalDays) dailyLoad[idx] += s.load;
  }

  let acute = 0;
  let chronic = 0;
  for (const load of dailyLoad) {
    acute = lambdaAcute * load + (1 - lambdaAcute) * acute;
    chronic = lambdaChronic * load + (1 - lambdaChronic) * chronic;
  }

  const ratio = chronic > 0 ? acute / chronic : 0;
  const calibrating = totalDays < 14;
  return { acute, chronic, ratio, calibrating };
}

/** Build a daily ACLR trajectory (one ratio per day after the first) for charting.
 *  Returns ratios indexed by day relative to the first session date. */
export function ewmaAclrSeries(
  sessions: AclrInput[],
  referenceDate: Date = new Date()
): { ratios: number[]; calibratingDays: number } {
  const lambdaAcute = 2 / (7 + 1);
  const lambdaChronic = 2 / (28 + 1);

  if (sessions.length === 0) return { ratios: [], calibratingDays: 0 };

  const sorted = [...sessions]
    .filter(s => s.date && s.load >= 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (sorted.length === 0) return { ratios: [], calibratingDays: 0 };

  const firstDay = new Date(sorted[0].date);
  firstDay.setHours(0, 0, 0, 0);
  const refDay = new Date(referenceDate);
  refDay.setHours(0, 0, 0, 0);
  const totalDays = Math.floor((refDay.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (totalDays <= 0) return { ratios: [], calibratingDays: 0 };

  const dailyLoad: number[] = Array(totalDays).fill(0);
  for (const s of sorted) {
    const day = new Date(s.date);
    day.setHours(0, 0, 0, 0);
    const idx = Math.floor((day.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24));
    if (idx >= 0 && idx < totalDays) dailyLoad[idx] += s.load;
  }

  const ratios: number[] = [];
  let acute = 0;
  let chronic = 0;
  for (const load of dailyLoad) {
    acute = lambdaAcute * load + (1 - lambdaAcute) * acute;
    chronic = lambdaChronic * load + (1 - lambdaChronic) * chronic;
    ratios.push(chronic > 0 ? acute / chronic : 0);
  }
  return { ratios, calibratingDays: Math.min(14, totalDays) };
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

/** Cluster-max deload score (P1.4.1). Performance, recovery, and load signals
 *  are aggregated as max-within-cluster, then summed across clusters. This
 *  prevents the system from double-counting one underlying overreach state
 *  while still letting a genuinely independent signal trigger action. */
export function calculateDeloadScore(signals: DeloadSignals): number {
  const w = getConstants().deloadWeights;
  const performance = Math.max(
    signals.peakDetected ? w.peak : 0,
    signals.stallDetected ? w.stall : 0,
    signals.rpeDrift ? w.rpeDrift : 0,
    signals.ttpExceeded ? w.ttp : 0,
  );
  const recovery = Math.max(
    signals.wellnessSustainedLow ? w.wellness : 0,
    signals.hrvTrendLow ? w.hrv : 0,
  );
  const load = signals.aclrFlag ? w.aclr : 0;
  return performance + recovery + load;
}

export function deloadRecommendation(score: number, signals: DeloadSignals): { level: string; message: string } {
  const { strong, moderate, light } = getConstants().deloadTiers;
  if (signals.jointPainFlag) return { level: 'urgent', message: 'Immediate deload recommended. Consider consulting a physiotherapist.' };
  if (score >= strong) return { level: 'strong', message: 'Strong deload recommendation based on multiple fatigue signals.' };
  if (score >= moderate) return { level: 'moderate', message: 'Moderate deload suggestion — monitor recovery closely.' };
  if (score >= light) return { level: 'light', message: 'Light advisory — noted in block review.' };
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

// RPE table grid (column order matches DEFAULT_RPE_TABLE rows above).
const RPE_TABLE_REPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const RPE_TABLE_RPES = [7, 7.5, 8, 8.5, 9, 9.5, 10];

/** Weighted Pool-Adjacent-Violators along an axis. Returns the projection that
 *  is the L2-optimal monotone fit. When `nonIncreasing` is true the output is
 *  non-increasing in index; false yields non-decreasing. */
function pavProject(values: number[], weights: number[], nonIncreasing: boolean): number[] {
  const n = values.length;
  if (n === 0) return [];
  const sign = nonIncreasing ? -1 : 1;
  // Transform so we always solve non-decreasing isotonic regression.
  const v = values.map((x) => x * sign);
  type Block = { sum: number; w: number; start: number; end: number };
  const blocks: Block[] = [];
  for (let i = 0; i < n; i++) {
    blocks.push({ sum: v[i] * weights[i], w: weights[i], start: i, end: i });
    while (blocks.length >= 2) {
      const top = blocks[blocks.length - 1];
      const prev = blocks[blocks.length - 2];
      if (prev.sum / prev.w <= top.sum / top.w) break;
      prev.sum += top.sum;
      prev.w += top.w;
      prev.end = top.end;
      blocks.pop();
    }
  }
  const out: number[] = new Array(n);
  for (const blk of blocks) {
    const mean = blk.sum / blk.w;
    for (let i = blk.start; i <= blk.end; i++) out[i] = mean;
  }
  return out.map((x) => x * sign);
}

/** Project a 10×7 RPE table onto the monotone cone:
 *   - non-increasing in reps (more reps → lower %)
 *   - non-decreasing in rpe  (higher rpe → higher %)
 *  Cyclic PAV with weights from per-cell observation counts. Converges in a
 *  handful of passes; capped at 8 iterations to keep cost bounded. */
export function projectMonotoneRpeTable(
  table: Record<string, number>,
  cellCounts: Record<string, number> = {},
): Record<string, number> {
  const R = RPE_TABLE_REPS.length;
  const C = RPE_TABLE_RPES.length;
  const M: number[][] = [];
  const W: number[][] = [];
  for (let r = 0; r < R; r++) {
    const row: number[] = [];
    const wrow: number[] = [];
    for (let c = 0; c < C; c++) {
      const key = `${RPE_TABLE_REPS[r]}@${RPE_TABLE_RPES[c]}`;
      row.push(table[key] ?? DEFAULT_RPE_TABLE[key] ?? 0.8);
      wrow.push(Math.max(1, cellCounts[key] ?? 1));
    }
    M.push(row);
    W.push(wrow);
  }
  for (let iter = 0; iter < 8; iter++) {
    let maxDelta = 0;
    // Pass 1: rows — non-decreasing in rpe (column index).
    for (let r = 0; r < R; r++) {
      const projected = pavProject(M[r], W[r], false);
      for (let c = 0; c < C; c++) {
        maxDelta = Math.max(maxDelta, Math.abs(projected[c] - M[r][c]));
        M[r][c] = projected[c];
      }
    }
    // Pass 2: columns — non-increasing in reps (row index).
    for (let c = 0; c < C; c++) {
      const colVals = M.map((row) => row[c]);
      const colW = W.map((row) => row[c]);
      const projected = pavProject(colVals, colW, true);
      for (let r = 0; r < R; r++) {
        maxDelta = Math.max(maxDelta, Math.abs(projected[r] - M[r][c]));
        M[r][c] = projected[r];
      }
    }
    if (maxDelta < 1e-4) break;
  }
  const out: Record<string, number> = { ...table };
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const key = `${RPE_TABLE_REPS[r]}@${RPE_TABLE_RPES[c]}`;
      out[key] = Math.round(M[r][c] * 1000) / 1000;
    }
  }
  return out;
}

export interface RpeTableMeta {
  updatedAt: string;
  cellCounts: Record<string, number>;
  isMonotone: boolean;
  /** Rolling samples per (reps,rpe) cell, used for robust outlier detection. */
  observations?: Record<string, number[]>;
}

/** Update user's RPE table from observed performance. Combines:
 *   - per-cell EWMA toward observed %1RM (α from constants, optionally
 *     attenuated by an outlier trust weight)
 *   - 2-D isotonic projection so the table remains monotone in (reps, rpe)
 *  Returns the updated table, meta (counts + observations), and a flag
 *  indicating whether the table is now personalised. */
export function personalizeRpeTable(
  currentTable: Record<string, number>,
  load: number,
  reps: number,
  rpe: number,
  e1rmSession: number,
  meta?: RpeTableMeta,
  trustWeight: number = 1,
): { table: Record<string, number>; isPersonalised: boolean; meta: RpeTableMeta } {
  const nextMeta: RpeTableMeta = meta
    ? {
        ...meta,
        cellCounts: { ...meta.cellCounts },
        observations: { ...(meta.observations || {}) },
      }
    : { updatedAt: new Date().toISOString(), cellCounts: {}, isMonotone: true, observations: {} };

  if (e1rmSession <= 0 || load <= 0) {
    return { table: currentTable, isPersonalised: false, meta: nextMeta };
  }
  const observedPct = load / e1rmSession;
  const key = `${reps}@${rpe}`;
  const currentPct = currentTable[key] ?? DEFAULT_RPE_TABLE[key] ?? 0.80;
  const alpha = getConstants().rpeAlpha * Math.max(0, Math.min(1, trustWeight));
  const updatedPct = currentPct * (1 - alpha) + observedPct * alpha;
  const candidateTable: Record<string, number> = {
    ...currentTable,
    [key]: Math.round(updatedPct * 1000) / 1000,
  };
  nextMeta.cellCounts[key] = (nextMeta.cellCounts[key] || 0) + 1;
  const obsForCell = nextMeta.observations![key] || [];
  obsForCell.push(observedPct);
  if (obsForCell.length > getConstants().rpeOutlierWindow) obsForCell.shift();
  nextMeta.observations![key] = obsForCell;

  const projected = projectMonotoneRpeTable(candidateTable, nextMeta.cellCounts);
  nextMeta.updatedAt = new Date().toISOString();
  nextMeta.isMonotone = true;

  const personalisedKeys = Object.keys(projected).filter((k) => {
    const defaultVal = DEFAULT_RPE_TABLE[k];
    return defaultVal !== undefined && Math.abs(projected[k] - defaultVal) > 0.005;
  });
  return { table: projected, isPersonalised: personalisedKeys.length >= 20, meta: nextMeta };
}

/** Expected last-rep velocity (m/s) for a given prescribed RPE/reps combo, derived from
 *  the lifter's load-velocity profile and personalised RPE table. The lvProfile is fitted
 *  such that `%1RM = slope * velocity + intercept`, so inverting yields the velocity
 *  expected at the table's load percentage for this RPE. Returns 0 if the profile is degenerate. */
export function expectedLastRepVelocity(
  reps: number,
  rpe: number,
  userTable: Record<string, number>,
  lvProfile: LvProfile
): number {
  const key = `${reps}@${rpe}`;
  const expectedPct = userTable[key] ?? DEFAULT_RPE_TABLE[key] ?? 0.80;
  if (lvProfile.slope === 0) return 0;
  const v = (expectedPct - lvProfile.intercept) / lvProfile.slope;
  return v > 0 ? v : 0;
}

/** Outlier reason categorisation — useful for UI messaging and audit. */
export type RpeOutlierReason = 'none' | 'load' | 'velocity' | 'both';

/** Per-cell modified Z-score (Iglewicz–Hoaglin) using MAD of recent
 *  observations. Falls back to a fixed-bound deviation when fewer than
 *  `rpeOutlierMinObs` observations exist for the cell. Returns a numeric
 *  z-magnitude (≥0); callers compare against `rpeOutlierZ` for binary outlier
 *  classification, or use it directly as a continuous trust signal. */
export function rpeCellModifiedZ(
  observedPct: number,
  expectedPct: number,
  cellObservations: number[] = [],
): number {
  const { rpeOutlierMinObs, rpeOutlierBand } = getConstants();
  if (cellObservations.length < rpeOutlierMinObs) {
    // Cell is sparse: fall back to fixed-bound deviation normalised to z.
    const dev = Math.abs(observedPct - expectedPct) / Math.max(expectedPct, 1e-6);
    return (dev / rpeOutlierBand) * getConstants().rpeOutlierZ;
  }
  const sorted = [...cellObservations].sort((a, b) => a - b);
  const median = sorted.length % 2 === 1
    ? sorted[(sorted.length - 1) / 2]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  const deviations = sorted.map((x) => Math.abs(x - median));
  deviations.sort((a, b) => a - b);
  const mad = deviations.length % 2 === 1
    ? deviations[(deviations.length - 1) / 2]
    : (deviations[deviations.length / 2 - 1] + deviations[deviations.length / 2]) / 2;
  if (mad === 0) return 0;
  // 0.6745 is the constant that makes MAD a consistent estimator of σ under normality.
  return Math.abs(0.6745 * (observedPct - median) / mad);
}

/** Trust weight in [0,1] derived from the cell's modified-Z. Used by
 *  `personalizeRpeTable` to attenuate updates from surprising observations. */
export function rpeTrustWeight(z: number): number {
  const { rpeOutlierZ } = getConstants();
  return Math.max(0, Math.min(1, 1 - z / rpeOutlierZ));
}

/** Check if a logged set is an RPE outlier. Combines two independent signals:
 *   1) Load deviation — observed %1RM is improbable for this (reps, rpe) given
 *      the lifter's history (modified-Z ≥ threshold), with a fallback band
 *      when the cell has too few observations.
 *   2) LRV deviation — when last-rep velocity and a calibrated lvProfile are
 *      available, the observed velocity disagrees with the expected velocity
 *      for the stated RPE by more than the fixed band.
 *  Returns the failing category (or 'none'). */
export function detectRpeOutlier(
  load: number,
  reps: number,
  rpe: number,
  e1rmSession: number,
  userTable: Record<string, number>,
  lastRepVelocity?: number,
  lvProfile?: LvProfile,
  cellObservations?: number[],
): RpeOutlierReason {
  if (e1rmSession <= 0 || load <= 0) return 'none';
  const observedPct = load / e1rmSession;
  const key = `${reps}@${rpe}`;
  const expectedPct = userTable[key] ?? DEFAULT_RPE_TABLE[key] ?? 0.80;
  const z = rpeCellModifiedZ(observedPct, expectedPct, cellObservations ?? []);
  const loadFail = z >= getConstants().rpeOutlierZ;

  let lrvFail = false;
  const { vbtMinN, vbtMinR2, rpeOutlierBand } = getConstants();
  const r2 = lvProfile?.rSquared;
  const lrvGate = lvProfile && lvProfile.n >= vbtMinN && (r2 === undefined || r2 >= vbtMinR2);
  if (lastRepVelocity !== undefined && lastRepVelocity > 0 && lvProfile && lrvGate) {
    const expectedV = expectedLastRepVelocity(reps, rpe, userTable, lvProfile);
    if (expectedV > 0) {
      lrvFail = Math.abs(lastRepVelocity - expectedV) / expectedV > rpeOutlierBand;
    }
  }

  if (loadFail && lrvFail) return 'both';
  if (loadFail) return 'load';
  if (lrvFail) return 'velocity';
  return 'none';
}

/** Legacy boolean wrapper kept for call sites that only need a pass/fail. */
export function isRpeOutlier(
  load: number,
  reps: number,
  rpe: number,
  e1rmSession: number,
  userTable: Record<string, number>,
  lastRepVelocity?: number,
  lvProfile?: LvProfile,
  cellObservations?: number[],
): boolean {
  return detectRpeOutlier(load, reps, rpe, e1rmSession, userTable, lastRepVelocity, lvProfile, cellObservations) !== 'none';
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

export type ProgrammingMode = 'PHASE' | 'TTP';

/** Weak-point accessory template selector (PRD §4.9, §6.7).
 *  Bias selection toward exercises that target the user's weak point for a given primary lift.
 *  Returns a list of candidate exercises with priority scores.
 *  In `programmingMode === 'TTP'` phase modifiers are zeroed — the microcycle
 *  stays constant across a block and load progression comes entirely from
 *  rising e1RM via the calling generator. */
export function getAccessoryTemplate(
  primaryLift: string,
  blockPhase: string,
  weakPoints: Record<string, string>,
  catalog: { id: string; name: string; tag: string; defaultSets: number; defaultReps: number; defaultRpe: number; weakPointTargets?: { liftId: string; position: string }[]; primaryMuscles: string[] }[],
  programmingMode: ProgrammingMode = 'PHASE',
  weakPointStreak: Record<string, number> = {},
): { id: string; name: string; tag: string; sets: number; reps: number; rpeTarget: number; primaryMuscles: string[]; priority: number }[] {
  const weakPoint = weakPoints[primaryLift];
  const baseMult = getConstants().weakPointMultiplier;
  // P2.5.3: escalate the weak-point multiplier when the same weak point has
  // persisted across consecutive blocks without measurable improvement.
  const streak = weakPointStreak[`${primaryLift}:${weakPoint}`] ?? 0;
  const escalatedMult = streak >= 2 ? Math.min(baseMult + 0.5, 2.5) : baseMult;
  const candidates = catalog
    .filter(ex => ex.tag !== 'PRIMARY' && ex.tag !== 'CORE')
    .map(ex => {
      const targetsWeakPoint = ex.weakPointTargets?.some(
        wpt => wpt.liftId === primaryLift && wpt.position === weakPoint
      );
      const priority = targetsWeakPoint ? escalatedMult : 1.0;
      let reps = ex.defaultReps;
      let rpe = ex.defaultRpe;
      if (programmingMode === 'PHASE') {
        if (blockPhase === 'REALISATION') {
          reps = Math.max(1, reps - 2);
          rpe = Math.min(10, rpe + 1.0);
        } else if (blockPhase === 'INTENSIFICATION') {
          reps = Math.max(1, reps - 1);
          rpe = Math.min(10, rpe + 0.5);
        }
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

/** Fractional ranks with tie-averaging. */
function rankArray(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const ranks = new Array(values.length).fill(0);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[indexed[k].i] = avg;
    i = j + 1;
  }
  return ranks;
}

/** Spearman rank correlation — robust to outliers and monotone (not linear)
 *  relationships. Used by the accessory-responsiveness pipeline (P1.4.2). */
export function spearmanCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  return pearsonCorrelation(rankArray(x), rankArray(y));
}

/** Partial Spearman correlation of x and y controlling for a list of confound
 *  variables. Each variable is rank-transformed, then we regress x and y on
 *  the controls (least squares) and correlate the residuals. */
export function partialSpearman(x: number[], y: number[], controls: number[][]): number {
  const n = x.length;
  if (n < 4 || y.length !== n || controls.some(c => c.length !== n)) return 0;
  const rx = rankArray(x);
  const ry = rankArray(y);
  const rcs = controls.map(rankArray);

  // Build design matrix [1, c1, c2, ...] and solve normal equations for both rx and ry.
  const k = rcs.length + 1; // intercept + controls
  const X: number[][] = rx.map((_, i) => [1, ...rcs.map(c => c[i])]);

  function solveOLS(target: number[]): number[] {
    // beta = (X^T X)^-1 X^T y, solved via Gaussian elimination on (k+1)×(k+2) augmented.
    const A: number[][] = Array.from({ length: k }, () => new Array(k + 1).fill(0));
    for (let i = 0; i < n; i++) {
      for (let a = 0; a < k; a++) {
        for (let b = 0; b < k; b++) A[a][b] += X[i][a] * X[i][b];
        A[a][k] += X[i][a] * target[i];
      }
    }
    for (let p = 0; p < k; p++) {
      // Partial pivoting
      let maxRow = p;
      for (let r = p + 1; r < k; r++) if (Math.abs(A[r][p]) > Math.abs(A[maxRow][p])) maxRow = r;
      [A[p], A[maxRow]] = [A[maxRow], A[p]];
      if (Math.abs(A[p][p]) < 1e-12) return new Array(k).fill(0);
      for (let r = p + 1; r < k; r++) {
        const factor = A[r][p] / A[p][p];
        for (let c = p; c <= k; c++) A[r][c] -= factor * A[p][c];
      }
    }
    const beta = new Array(k).fill(0);
    for (let p = k - 1; p >= 0; p--) {
      let sum = A[p][k];
      for (let c = p + 1; c < k; c++) sum -= A[p][c] * beta[c];
      beta[p] = sum / A[p][p];
    }
    return beta;
  }

  const betaX = solveOLS(rx);
  const betaY = solveOLS(ry);
  const residX: number[] = [];
  const residY: number[] = [];
  for (let i = 0; i < n; i++) {
    const fittedX = betaX.reduce((s, b, j) => s + b * X[i][j], 0);
    const fittedY = betaY.reduce((s, b, j) => s + b * X[i][j], 0);
    residX.push(rx[i] - fittedX);
    residY.push(ry[i] - fittedY);
  }
  return pearsonCorrelation(residX, residY);
}

/** Linearly interpolate within-phase RPE add across the weeks of a phase
 *  (P2.5.7). PHASE mode only — TTP mode keeps modifiers at 0. */
export function withinPhaseRpeAdd(phase: string, blockWeek: number, totalBlockWeeks: number): number {
  const t = totalBlockWeeks > 1 ? Math.min(1, Math.max(0, (blockWeek - 1) / (totalBlockWeeks - 1))) : 0;
  switch (phase) {
    case 'ACCUMULATION': return 0;
    case 'INTENSIFICATION': return 0 + (0.5 - 0) * t;
    case 'REALISATION': return 0.5 + (1.0 - 0.5) * t;
    default: return 0;
  }
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

/** Hypertrophy load helper (P1.4.4). RIR (reps-in-reserve) ≈ 10 − RPE,
 *  so we reuse the RPE table at the implied RPE. Falls back to a Brzycki-like
 *  curve when the cell is missing. Returns a bar load rounded to 2.5 kg. */
export function getRirLoad(rir: number, reps: number, e1rm: number, userTable: Record<string, number>): number {
  if (e1rm <= 0) return 0;
  const rpe = Math.max(7, Math.min(10, 10 - rir));
  const key = `${reps}@${rpe}`;
  const pct = userTable[key] ?? DEFAULT_RPE_TABLE[key] ?? Math.max(0.5, 1 / (1.0278 - 0.0278 * Math.min(reps, 30)));
  return Math.round((e1rm * pct) / 2.5) * 2.5;
}

/** Coefficient of variation of an HRV series (rolling window). P2.5.6. */
export function hrvCoefficientOfVariation(samples: number[]): number {
  if (samples.length < 4) return 0;
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  if (mean === 0) return 0;
  const variance = samples.reduce((s, x) => s + (x - mean) ** 2, 0) / (samples.length - 1);
  return Math.sqrt(variance) / mean;
}

/** Age-scaled adjustments (P3.6.3). Returns multipliers on key thresholds. */
export function ageScaling(age: number): { e1rmAlphaMult: number; aclrThresholdMult: number; intensificationDelta: number } {
  if (age < getConstants().ageScalingFrom) return { e1rmAlphaMult: 1, aclrThresholdMult: 1, intensificationDelta: 0 };
  // Halve EMA α, lower ACLR amber threshold to 1.35/1.5 = 0.9, ease intensification by 0.5 RPE.
  return { e1rmAlphaMult: 0.5, aclrThresholdMult: 0.9, intensificationDelta: -0.5 };
}

// ── Programmatic Scheduler ─────────────────────────────────────────────────
// Replaces the hardcoded createDayPlan() templates in store.ts with a
// fully data-driven session, microcycle, block, and program generator.

export type BlockPhase = 'ACCUMULATION' | 'INTENSIFICATION' | 'REALISATION' | 'DELOAD' | 'PIVOT';

export type MovementPattern =
  | 'squat'            // bilateral knee-dominant compounds
  | 'hip_hinge'        // hip-dominant hinge from floor or hang
  | 'horizontal_push'  // horizontal pressing
  | 'horizontal_pull'  // horizontal rowing
  | 'vertical_push'    // overhead pressing
  | 'vertical_pull'    // lat pull / chin variants
  | 'isolation_push'   // single-joint push (tricep, fly, lateral raise)
  | 'isolation_pull'   // single-joint pull (curl, face pull, rear delt)
  | 'isolation_lower'  // single-joint lower (leg curl, extension, calf)
  | 'carry'            // loaded carry / static hold
  | 'core';            // anti-flexion / rotation bracing

/** Minimal profile subset consumed by scheduler functions (avoids circular import). */
export interface SchedulerProfile {
  programmingMode: ProgrammingMode;
  e1rm: Record<string, number>;
  rpeTable: Record<string, number>;
  mevEstimates: Record<string, number>;
  mrvEstimates: Record<string, number>;
  weakPoints: Record<string, string>;
  weakPointStreak?: Record<string, number>;
  accessoryResponsiveness: Record<string, number>;
  sessionDuration: number;
  excludedExercises: string[];
  trainingAgeYears: number;
  availableDays: boolean[];
}

/** Minimal exercise descriptor consumed by scheduler functions. */
export interface SchedulerExercise {
  id: string;
  name: string;
  tag: 'PRIMARY' | 'ASSIST' | 'SUPP' | 'CORE';
  defaultSets: number;
  defaultReps: number;
  defaultRpe: number;
  primaryMuscles: string[];
  efc?: number;
  weakPointTargets?: { liftId: string; position: string }[];
  movementPattern?: string;
}

/** Session exercise as produced by the scheduler (structurally compatible with SessionExercise). */
export interface SchedulerSessionExercise {
  id: string;
  name: string;
  tag: 'PRIMARY' | 'ASSIST' | 'SUPP' | 'CORE';
  sets: number;
  reps: number;
  rpeTarget: number;
  dropPct?: number;
  prescribedLoad: number;
  primaryMuscles: string[];
}

/** Running week-level context threaded through planMicrocycle. */
export interface WeekContext {
  muscleSetsSoFar: Record<string, number>;
  weeklyTargets: Record<string, number>;
  weekPatternCounts: Record<string, number>;
  muscleFatigueCtx: Record<string, { setsTrained: number; meanEfc: number; hoursSince: number }>;
}

/** A single block's descriptor within a multi-block program plan. */
export interface BlockPlan {
  phase: BlockPhase;
  blockType: 'DEVELOPMENT' | 'DELOAD' | 'PIVOT' | 'PEAK';
  estimatedWeeks: number;
  targetStartDate: string;
}

/** Per-primary-lift canonical exercise definition (used by buildProgrammaticSession). */
const PRIMARY_LIFT_EXERCISES: Record<string, { id: string; name: string; defaultSets: number; defaultReps: number; defaultRpe: number; dropPct: number; primaryMuscles: string[] }> = {
  squat:           { id: 'barbell_back_squat',    name: 'Back squat',       defaultSets: 4, defaultReps: 3, defaultRpe: 8.5, dropPct: 12, primaryMuscles: ['quads', 'glutes', 'hamstrings', 'spinal_erectors'] },
  bench:           { id: 'bench_press',           name: 'Bench press',      defaultSets: 4, defaultReps: 4, defaultRpe: 8.0, dropPct: 12, primaryMuscles: ['pecs', 'anterior_deltoid', 'triceps'] },
  deadlift:        { id: 'conventional_deadlift', name: 'Conventional DL',  defaultSets: 3, defaultReps: 2, defaultRpe: 8.5, dropPct: 10, primaryMuscles: ['hamstrings', 'glutes', 'spinal_erectors', 'lats'] },
  bench_variation: { id: 'close_grip_bench',      name: 'Close-grip bench', defaultSets: 4, defaultReps: 5, defaultRpe: 7.5, dropPct: 10, primaryMuscles: ['triceps', 'pecs', 'anterior_deltoid'] },
};

/**
 * Compute target weekly sets per muscle group for the given block week.
 * Calls volumeBudget() per muscle using profile's MEV/MRV estimates.
 */
export function computeWeeklyMuscleTargets(
  profile: Pick<SchedulerProfile, 'mevEstimates' | 'mrvEstimates'>,
  blockWeek: number,
  totalBlockWeeks: number,
  rcs: number,
): Record<string, number> {
  const targets: Record<string, number> = {};
  for (const [muscle, mev] of Object.entries(profile.mevEstimates)) {
    const mrv = profile.mrvEstimates[muscle] ?? mev * 2;
    targets[muscle] = volumeBudget(mev, mrv, blockWeek, totalBlockWeeks, rcs);
  }
  return targets;
}

/**
 * Estimate muscle readiness (0–1) based on accumulated fatigue and time elapsed.
 * Uses an exponential recovery model gated by EFC-derived half-life.
 * Experienced lifters (trainingAgeYears > 2) recover up to 20% faster.
 */
export function estimateMuscleReadiness(
  _muscleGroup: string,
  setsTrained: number,
  meanEfc: number,
  hoursSince: number,
  trainingAgeYears: number,
): number {
  if (setsTrained === 0 || hoursSince <= 0) return 1.0;
  const c = getConstants();
  let halfLife = meanEfc >= 1.25 ? c.recoveryHalfLifeHigh
    : meanEfc >= 0.70 ? c.recoveryHalfLifeMod
    : c.recoveryHalfLifeLow;
  // Experienced lifters recover marginally faster (capped at 20% reduction).
  halfLife *= Math.max(0.8, 1 - Math.max(0, trainingAgeYears - 2) * 0.02);
  const fatigueLoad = setsTrained * meanEfc;
  const readiness = 1 - Math.exp(-hoursSince / halfLife) * Math.min(1, fatigueLoad / 10);
  return Math.max(0, Math.min(1, readiness));
}

/** Internal: all permutations of an array (used by assignPrimaryLiftsTodays). */
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr.slice()];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.filter((_, j) => j !== i);
    for (const perm of permutations(rest)) result.push([arr[i], ...perm]);
  }
  return result;
}

type LiftSlot = 'squat' | 'bench' | 'deadlift' | 'bench_variation' | null;

/** Internal: score a lift-to-day assignment. Returns -Infinity for invalid assignments. */
function scoreAssignment(
  assignment: Record<number, LiftSlot>,
  dayIndices: number[],
  minGapHours: number,
): number {
  let score = 0;
  const dayHours = (d: number) => d * 24;
  let squatDay = -1, deadliftDay = -1;
  const benchDays: number[] = [];
  for (const [dayStr, lift] of Object.entries(assignment)) {
    const day = Number(dayStr);
    if (lift === 'squat') squatDay = day;
    else if (lift === 'deadlift') deadliftDay = day;
    else if (lift === 'bench' || lift === 'bench_variation') benchDays.push(day);
  }
  // Hard constraint: squat and deadlift must be at least primaryLiftMinGap apart.
  if (squatDay >= 0 && deadliftDay >= 0) {
    const gap = Math.abs(dayHours(squatDay) - dayHours(deadliftDay));
    if (gap < minGapHours) return -Infinity;
    // Sweet spot: 48–96 h gap.
    score += gap >= 48 && gap <= 96 ? 3 : 1;
  }
  // Bench pair spacing.
  if (benchDays.length === 2) {
    const benchGap = Math.abs(dayHours(benchDays[0]) - dayHours(benchDays[1]));
    score += benchGap >= 48 ? 2 : 0;
  }
  // Prefer upper-lower alternation.
  for (let i = 1; i < dayIndices.length; i++) {
    const prev = assignment[dayIndices[i - 1]];
    const curr = assignment[dayIndices[i]];
    const isLower = (l: LiftSlot) => l === 'squat' || l === 'deadlift';
    const isUpper = (l: LiftSlot) => l === 'bench' || l === 'bench_variation';
    if ((isLower(prev) && isUpper(curr)) || (isUpper(prev) && isLower(curr))) score += 1;
  }
  return score;
}

/**
 * Determine the optimal assignment of primary lifts to available training days.
 * Exhaustive search over valid permutations; respects primaryLiftMinGap between
 * squat and deadlift. Extra days beyond 3 receive bench_variation then null (GPP).
 */
export function assignPrimaryLiftsTodays(
  availableDayIndices: number[],
  primaryLiftMinGapHours: number,
): Record<number, LiftSlot> {
  const n = availableDayIndices.length;
  const slots: LiftSlot[] = ['squat', 'bench', 'deadlift'];
  // Extra days: bench_variation first, then GPP.
  for (let i = slots.length; i < n; i++) slots.push(i === 3 ? 'bench_variation' : null);
  const slotSubset = slots.slice(0, n);

  let bestScore = -Infinity;
  let bestPerm = slotSubset.slice();
  for (const perm of permutations(slotSubset)) {
    const assignment: Record<number, LiftSlot> = {};
    for (let i = 0; i < n; i++) assignment[availableDayIndices[i]] = perm[i];
    const s = scoreAssignment(assignment, availableDayIndices, primaryLiftMinGapHours);
    if (s > bestScore) { bestScore = s; bestPerm = perm; }
  }
  // If no valid assignment satisfies the gap, relax to 24 h and retry.
  if (bestScore === -Infinity) {
    for (const perm of permutations(slotSubset)) {
      const assignment: Record<number, LiftSlot> = {};
      for (let i = 0; i < n; i++) assignment[availableDayIndices[i]] = perm[i];
      const s = scoreAssignment(assignment, availableDayIndices, 24);
      if (s > bestScore) { bestScore = s; bestPerm = perm; }
    }
  }
  const result: Record<number, LiftSlot> = {};
  for (let i = 0; i < n; i++) result[availableDayIndices[i]] = bestPerm[i];
  return result;
}

/** Internal: score a candidate exercise for inclusion in the current session. */
function scoreExerciseForSession(
  exercise: SchedulerExercise,
  ctx: {
    muscleDeficits: Record<string, number>;
    sessionPatternCounts: Record<string, number>;
    muscleReadiness: Record<string, number>;
    weakPointPriority: number;
    accessoryResponsiveness: Record<string, number>;
    sfiBudget: number;
    sessionSfiSoFar: number;
    pushPullTargetRatio: number;
  },
): number {
  // Hard exclude: unrecovered muscles.
  for (const mg of exercise.primaryMuscles) {
    if ((ctx.muscleReadiness[mg] ?? 1.0) < 0.4) return 0;
  }
  // Check SFI budget.
  const exSfi = calculateSetSFI(exercise.defaultRpe, exercise.defaultReps, exercise.id) * exercise.defaultSets;
  if (ctx.sessionSfiSoFar + exSfi > ctx.sfiBudget) return 0;

  // Base: sum of positive muscle deficits this exercise addresses.
  let score = 0;
  for (const mg of exercise.primaryMuscles) {
    const deficit = ctx.muscleDeficits[mg] ?? 0;
    score += Math.max(0, deficit);
  }
  if (score <= 0) score = 0.1; // small non-zero base so non-deficit work can still be scored

  // Readiness multiplier.
  const minReadiness = Math.min(...exercise.primaryMuscles.map(mg => ctx.muscleReadiness[mg] ?? 1.0));
  score *= minReadiness;

  // Weak-point bonus.
  score *= ctx.weakPointPriority;

  // Accessory responsiveness bonus.
  const rho = ctx.accessoryResponsiveness[exercise.id] ?? 0;
  if (rho > 0.4) score *= (1 + rho);

  // Movement-pattern balance.
  const pat = exercise.movementPattern ?? '';
  const isPush = pat.includes('push');
  const isPull = pat.includes('pull');
  const sessionPush = Object.entries(ctx.sessionPatternCounts)
    .filter(([p]) => p.includes('push')).reduce((s, [, n]) => s + n, 0);
  const sessionPull = Object.entries(ctx.sessionPatternCounts)
    .filter(([p]) => p.includes('pull')).reduce((s, [, n]) => s + n, 0);
  const ratio = sessionPull > 0 ? sessionPush / sessionPull : (sessionPush > 0 ? 2.0 : 1.0);
  const target = ctx.pushPullTargetRatio;
  if (isPush && ratio > target * 1.5) score *= 0.5;   // too many pushes: penalise
  if (isPull && ratio > target * 1.5) score *= 1.3;   // push-heavy: reward pulls
  if (isPull && ratio < target * 0.67) score *= 0.5;  // too many pulls: penalise
  if (isPush && ratio < target * 0.67) score *= 1.3;  // pull-heavy: reward pushes

  return score;
}

/**
 * Build a single training session programmatically.
 * Replaces the hardcoded createDayPlan() in store.ts.
 *
 * Algorithm:
 *  1. Add the canonical PRIMARY exercise for assignedLift.
 *  2. Score all non-PRIMARY, non-excluded catalog entries against muscle-volume
 *     deficits, movement-pattern balance, readiness, and weak-point priority.
 *  3. Greedily add highest-scoring exercises until SFI or duration cap is hit.
 *  4. Always include one CORE exercise.
 */
export function buildProgrammaticSession(
  assignedLift: LiftSlot,
  phase: BlockPhase,
  profile: SchedulerProfile,
  blockWeek: number,
  totalBlockWeeks: number,
  weekCtx: WeekContext,
  catalog: SchedulerExercise[],
): { focus: string; exercises: SchedulerSessionExercise[]; durationTrimmed: boolean } {
  const focusLabels: Record<string, string> = {
    squat: 'Squat', bench: 'Bench', deadlift: 'Deadlift',
    bench_variation: 'Bench (variation)',
  };
  const focus = assignedLift ? (focusLabels[assignedLift] ?? 'GPP') : 'GPP';

  const ttp = profile.programmingMode === 'TTP';
  const rpeAdd = ttp ? 0 : withinPhaseRpeAdd(phase, blockWeek, totalBlockWeeks);
  const repsDrop = ttp ? 0 : (phase === 'ACCUMULATION' ? 0 : 1);
  const setsDrop = ttp ? 0 : (phase === 'REALISATION' ? 1 : 0);

  const primaryLiftKey = assignedLift === 'bench' || assignedLift === 'bench_variation' ? 'bench'
    : assignedLift === 'deadlift' ? 'deadlift'
    : 'squat';

  const computeLoad = (reps: number, rpe: number, liftKey: string): number => {
    const e1rm = profile.e1rm[liftKey] ?? 200;
    const pct = profile.rpeTable[`${reps}@${rpe}`] ?? 0.80;
    return Math.round(e1rm * pct / 2.5) * 2.5;
  };

  const exercises: SchedulerSessionExercise[] = [];
  const sessionPatternCounts: Record<string, number> = {};
  let sessionSfiSoFar = 0;

  // Step 1: PRIMARY exercise.
  if (assignedLift && PRIMARY_LIFT_EXERCISES[assignedLift]) {
    const def = PRIMARY_LIFT_EXERCISES[assignedLift];
    const rpe = Math.min(10, def.defaultRpe + rpeAdd);
    const reps = Math.max(1, def.defaultReps - repsDrop);
    const sets = Math.max(1, def.defaultSets - setsDrop);
    exercises.push({
      id: def.id, name: def.name, tag: 'PRIMARY',
      sets, reps, rpeTarget: rpe, dropPct: def.dropPct,
      prescribedLoad: computeLoad(reps, rpe, primaryLiftKey),
      primaryMuscles: def.primaryMuscles,
    });
    const primaryDef = catalog.find(c => c.id === def.id);
    if (primaryDef?.movementPattern) {
      sessionPatternCounts[primaryDef.movementPattern] = (sessionPatternCounts[primaryDef.movementPattern] ?? 0) + sets;
    }
    sessionSfiSoFar += calculateSetSFI(rpe, reps, def.id) * sets;
  }

  // Build muscle deficits (weekly target minus what prior sessions this week accumulated).
  const muscleDeficits: Record<string, number> = {};
  for (const [muscle, target] of Object.entries(weekCtx.weeklyTargets)) {
    muscleDeficits[muscle] = Math.max(0, target - (weekCtx.muscleSetsSoFar[muscle] ?? 0));
  }

  // Muscle readiness from cross-session fatigue context.
  const muscleReadiness: Record<string, number> = {};
  for (const [muscle, ctx] of Object.entries(weekCtx.muscleFatigueCtx)) {
    muscleReadiness[muscle] = estimateMuscleReadiness(
      muscle, ctx.setsTrained, ctx.meanEfc, ctx.hoursSince, profile.trainingAgeYears,
    );
  }

  // Weak-point priority map for this session's primary lift.
  const liftKey = assignedLift === 'bench_variation' ? 'bench' : (assignedLift ?? 'squat');
  const wpCandidates = getAccessoryTemplate(
    liftKey, phase, profile.weakPoints,
    catalog.filter(e => e.tag !== 'PRIMARY' && e.tag !== 'CORE'),
    profile.programmingMode, profile.weakPointStreak ?? {},
  );
  const wpPriority: Record<string, number> = {};
  for (const c of wpCandidates) wpPriority[c.id] = c.priority;

  const { sfiBudgetPerSession, pushPullTargetRatio } = getConstants();

  // Candidates: non-PRIMARY, non-excluded, not already in session.
  const pool = catalog.filter(e =>
    e.tag !== 'PRIMARY' &&
    !profile.excludedExercises.includes(e.id),
  );

  // Step 2: CORE exercise (always add one if duration allows).
  const corePool = pool.filter(e => e.tag === 'CORE');
  if (corePool.length > 0) {
    const core = corePool[0];
    const projected = estimateSessionDuration([
      ...exercises.map(e => ({ sets: e.sets, reps: e.reps, rpeTarget: e.rpeTarget, tag: e.tag })),
      { sets: core.defaultSets, reps: core.defaultReps, rpeTarget: core.defaultRpe, tag: core.tag },
    ]);
    if (projected <= profile.sessionDuration) {
      exercises.push({
        id: core.id, name: core.name, tag: 'CORE',
        sets: core.defaultSets, reps: core.defaultReps, rpeTarget: core.defaultRpe,
        prescribedLoad: 0, primaryMuscles: core.primaryMuscles,
      });
      sessionSfiSoFar += calculateSetSFI(core.defaultRpe, core.defaultReps, core.id) * core.defaultSets;
    }
  }

  // Step 3: Greedy accessory selection (max 4 accessories).
  let durationTrimmed = false;
  const MAX_ACCESSORIES = 4;
  let accessoriesAdded = 0;

  while (accessoriesAdded < MAX_ACCESSORIES) {
    let bestScore = 0;
    let bestEx: SchedulerExercise | null = null;
    let bestRpe = 0, bestReps = 0, bestSets = 0;

    for (const ex of pool) {
      if (ex.tag === 'CORE') continue;
      if (exercises.some(e => e.id === ex.id)) continue;

      const rpe = Math.min(10, ex.defaultRpe + rpeAdd);
      const reps = Math.max(1, ex.defaultReps - repsDrop);
      const sets = Math.max(1, ex.defaultSets - setsDrop);

      const projected = estimateSessionDuration([
        ...exercises.map(e => ({ sets: e.sets, reps: e.reps, rpeTarget: e.rpeTarget, tag: e.tag })),
        { sets, reps, rpeTarget: rpe, tag: ex.tag },
      ]);
      if (projected > profile.sessionDuration) { durationTrimmed = true; continue; }

      const score = scoreExerciseForSession(ex, {
        muscleDeficits, sessionPatternCounts, muscleReadiness,
        weakPointPriority: wpPriority[ex.id] ?? 1.0,
        accessoryResponsiveness: profile.accessoryResponsiveness,
        sfiBudget: sfiBudgetPerSession,
        sessionSfiSoFar,
        pushPullTargetRatio,
      });
      if (score > bestScore) { bestScore = score; bestEx = ex; bestRpe = rpe; bestReps = reps; bestSets = sets; }
    }

    if (!bestEx || bestScore <= 0) break;

    // Compute prescribed load for accessories that have a natural reference lift.
    const refLift = inferLiftKey(bestEx.id) ?? primaryLiftKey;
    const pct = profile.rpeTable[`${bestReps}@${bestRpe}`] ?? 0.80;
    const prescribedLoad = profile.e1rm[refLift]
      ? Math.round(profile.e1rm[refLift] * pct / 2.5) * 2.5
      : 0;

    exercises.push({
      id: bestEx.id, name: bestEx.name, tag: bestEx.tag,
      sets: bestSets, reps: bestReps, rpeTarget: bestRpe,
      prescribedLoad, primaryMuscles: bestEx.primaryMuscles,
    });
    // Update session tracking.
    if (bestEx.movementPattern) {
      sessionPatternCounts[bestEx.movementPattern] = (sessionPatternCounts[bestEx.movementPattern] ?? 0) + bestSets;
    }
    for (const mg of bestEx.primaryMuscles) {
      muscleDeficits[mg] = Math.max(0, (muscleDeficits[mg] ?? 0) - bestSets);
    }
    sessionSfiSoFar += calculateSetSFI(bestRpe, bestReps, bestEx.id) * bestSets;
    accessoriesAdded++;
  }

  return { focus, exercises, durationTrimmed };
}

/**
 * Plan one week of sessions (microcycle) for the given block week.
 * Assigns primary lifts to days, then calls buildProgrammaticSession for each,
 * threading the week context (accumulated muscle sets, pattern counts, fatigue)
 * across sessions so each day's selection reacts to what came before it.
 */
export function planMicrocycle(
  profile: SchedulerProfile,
  phase: BlockPhase,
  blockWeek: number,
  totalBlockWeeks: number,
  rcs: number,
  weekStartMonday: Date,
  catalog: SchedulerExercise[],
): { dayIndex: number; date: string; focus: string; exercises: SchedulerSessionExercise[]; durationTrimmed: boolean }[] {
  const weeklyTargets = computeWeeklyMuscleTargets(profile, blockWeek, totalBlockWeeks, rcs);
  const availableDayIndices = profile.availableDays
    .map((on, i) => (on ? i : -1)).filter(i => i >= 0);

  const liftAssignment = assignPrimaryLiftsTodays(availableDayIndices, getConstants().primaryLiftMinGap);

  const weekCtx: WeekContext = {
    muscleSetsSoFar: {},
    weeklyTargets,
    weekPatternCounts: {},
    muscleFatigueCtx: {},
  };

  const results: { dayIndex: number; date: string; focus: string; exercises: SchedulerSessionExercise[]; durationTrimmed: boolean }[] = [];

  for (const dayIdx of availableDayIndices) {
    const date = new Date(weekStartMonday);
    date.setDate(weekStartMonday.getDate() + dayIdx);

    // Derive inter-session fatigue context from planned prior sessions this week.
    const muscleFatigueCtx: Record<string, { setsTrained: number; meanEfc: number; hoursSince: number }> = {};
    const lastDayIdx = results.length > 0 ? results[results.length - 1].dayIndex : -1;
    for (const [muscle, setsDone] of Object.entries(weekCtx.muscleSetsSoFar)) {
      const hoursSince = lastDayIdx >= 0 ? (dayIdx - lastDayIdx) * 24 : 72;
      const muscleExs = catalog.filter(e => e.primaryMuscles.includes(muscle));
      const avgEfc = muscleExs.length > 0
        ? muscleExs.reduce((s, e) => s + (e.efc ?? 0.85), 0) / muscleExs.length
        : 0.85;
      muscleFatigueCtx[muscle] = { setsTrained: setsDone, meanEfc: avgEfc, hoursSince };
    }
    weekCtx.muscleFatigueCtx = muscleFatigueCtx;

    const dayPlan = buildProgrammaticSession(
      liftAssignment[dayIdx], phase, profile, blockWeek, totalBlockWeeks, weekCtx, catalog,
    );
    results.push({ dayIndex: dayIdx, date: date.toISOString().split('T')[0], ...dayPlan });

    // Thread week context forward.
    for (const ex of dayPlan.exercises) {
      for (const mg of ex.primaryMuscles) {
        weekCtx.muscleSetsSoFar[mg] = (weekCtx.muscleSetsSoFar[mg] ?? 0) + ex.sets;
      }
      const exDef = catalog.find(c => c.id === ex.id);
      if (exDef?.movementPattern) {
        weekCtx.weekPatternCounts[exDef.movementPattern] =
          (weekCtx.weekPatternCounts[exDef.movementPattern] ?? 0) + ex.sets;
      }
    }
  }

  return results;
}

/**
 * Plan a full development block: calls planMicrocycle() for each week.
 * Returns a flat array of day-plan descriptors for generateBlock() to wrap in Session objects.
 */
export function planBlock(
  profile: SchedulerProfile,
  phase: BlockPhase,
  startMonday: Date,
  weeks: number,
  catalog: SchedulerExercise[],
): { dayIndex: number; weekIndex: number; date: string; focus: string; exercises: SchedulerSessionExercise[]; durationTrimmed: boolean }[] {
  const results = [];
  for (let week = 0; week < weeks; week++) {
    const weekMonday = new Date(startMonday);
    weekMonday.setDate(startMonday.getDate() + week * 7);
    // Use neutral RCS (75) for planned future sessions — actual wellness unknown.
    const microcycle = planMicrocycle(profile, phase, week + 1, weeks, 75, weekMonday, catalog);
    for (const dayPlan of microcycle) results.push({ ...dayPlan, weekIndex: week });
  }
  return results;
}

/**
 * Generate a multi-block periodisation plan from today toward a competition meet date.
 * Plans phases backward from the meet: accumulation → intensification → realisation → peak.
 * Returns an ordered array of BlockPlan descriptors for generateNextDevelopmentBlock() to consume.
 */
export function planProgram(
  profile: { meetDate?: string; ttpEstimate: number },
): BlockPlan[] {
  if (!profile.meetDate) return [];
  const today = new Date();
  const meet = new Date(profile.meetDate);
  const weeksToMeet = Math.ceil((meet.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));
  if (weeksToMeet <= 0) return [];

  const ttp = profile.ttpEstimate || 6;
  let remaining = weeksToMeet;

  // Reserve 2 weeks for peak (REALISATION/PEAK block before meet).
  const peakWeeks = Math.min(2, remaining);
  remaining -= peakWeeks;

  // Realisation block (3–ttp weeks).
  const realisationWeeks = remaining > 0 ? Math.min(Math.max(3, Math.round(ttp * 0.6)), remaining) : 0;
  remaining -= realisationWeeks;

  // Intensification blocks (up to 2 × ttp weeks total).
  const intensificationWeeks = remaining > 0 ? Math.min(ttp * 2, remaining) : 0;
  remaining -= intensificationWeeks;

  // Accumulation: all remaining weeks.
  const accumulationWeeks = remaining;

  const plans: BlockPlan[] = [];
  let weekOffset = 0;

  const addBlocks = (weeksTotal: number, phase: BlockPhase, blockType: BlockPlan['blockType']) => {
    if (weeksTotal <= 0) return;
    const blockCount = Math.ceil(weeksTotal / ttp);
    for (let i = 0; i < blockCount; i++) {
      const blockWeeks = i < blockCount - 1 ? ttp : weeksTotal - (blockCount - 1) * ttp;
      const start = new Date(today);
      start.setDate(today.getDate() + weekOffset * 7);
      plans.push({ phase, blockType, estimatedWeeks: Math.max(1, blockWeeks), targetStartDate: start.toISOString().split('T')[0] });
      weekOffset += blockWeeks;
    }
  };

  addBlocks(accumulationWeeks, 'ACCUMULATION', 'DEVELOPMENT');
  addBlocks(intensificationWeeks, 'INTENSIFICATION', 'DEVELOPMENT');
  addBlocks(realisationWeeks, 'REALISATION', 'DEVELOPMENT');
  // Final peak block.
  const peakStart = new Date(today);
  peakStart.setDate(today.getDate() + weekOffset * 7);
  plans.push({ phase: 'REALISATION', blockType: 'PEAK', estimatedWeeks: peakWeeks, targetStartDate: peakStart.toISOString().split('T')[0] });

  return plans;
}
