// Pure metric functions consumed by the harness. Each returns a numeric value
// and the supporting sample count so the caller can apply tolerances.
import { detectPeak, DEFAULT_RPE_TABLE, getConstants } from '../src/engine';
import type { ReplayFixture, ReplaySession } from './types';

export interface Metric { name: string; value: number; n: number }

/** Mean absolute error between predicted (RPE-table) and observed %1RM
 *  across every logged set. Lower is better. */
export function rpePredictionMAE(fixture: ReplayFixture): Metric {
  let sumErr = 0;
  let n = 0;
  for (const block of fixture.blocks) {
    for (const session of block.sessions) {
      for (const set of session.sets) {
        if (set.e1rm <= 0) continue;
        const key = `${set.actualReps}@${set.actualRpe}`;
        const expected = fixture.profile.rpeTable[key] ?? DEFAULT_RPE_TABLE[key] ?? 0.8;
        const observed = set.actualLoad / set.e1rm;
        sumErr += Math.abs(expected - observed);
        n++;
      }
    }
  }
  return { name: 'rpePredictionMAE', value: n > 0 ? sumErr / n : 0, n };
}

/** Sum of squared second differences of the rolling-EMA e1RM series, normalised
 *  by the mean e1RM. Lower is smoother. */
export function e1rmSmoothness(fixture: ReplayFixture): Metric {
  const seriesByLift: Record<string, number[]> = {};
  for (const block of fixture.blocks) {
    for (const session of block.sessions) {
      for (const set of session.sets) {
        if (!seriesByLift[set.exerciseId]) seriesByLift[set.exerciseId] = [];
        seriesByLift[set.exerciseId].push(set.e1rm);
      }
    }
  }
  let totalRoughness = 0;
  let totalSamples = 0;
  for (const lift of Object.keys(seriesByLift)) {
    const series = seriesByLift[lift];
    if (series.length < 3) continue;
    const mean = series.reduce((a, b) => a + b, 0) / series.length;
    if (mean === 0) continue;
    let roughness = 0;
    for (let i = 1; i < series.length - 1; i++) {
      const d2 = series[i + 1] - 2 * series[i] + series[i - 1];
      roughness += d2 * d2;
    }
    totalRoughness += roughness / (mean * mean);
    totalSamples += series.length;
  }
  return { name: 'e1rmSmoothness', value: totalRoughness, n: totalSamples };
}

/** Fraction of completed sessions that include an OVERRIDE_ audit entry. */
export function overrideFrequency(fixture: ReplayFixture): Metric {
  let overrides = 0;
  let sessions = 0;
  for (const block of fixture.blocks) {
    for (const session of block.sessions) {
      if (session.status !== 'COMPLETE') continue;
      sessions++;
      if ((session.overrides ?? []).length > 0) overrides++;
    }
  }
  return { name: 'overrideFrequency', value: sessions > 0 ? overrides / sessions : 0, n: sessions };
}

/** Fraction of declared peaks that were NOT followed by ≥ 2 weeks of sustained
 *  decline in subsequent sessions. Approximates the false-peak rate. */
export function falsePeakRate(fixture: ReplayFixture): Metric {
  // Build per-primary-lift weekly e1RM series. Replay detectPeak at each week
  // and check whether the trend continued downward for ≥2 weeks after the call.
  const primaryIds = ['barbell_back_squat', 'bench_press', 'conventional_deadlift'];
  let declared = 0;
  let falsePeaks = 0;
  for (const block of fixture.blocks) {
    if (block.type !== 'DEVELOPMENT') continue;
    const start = new Date(block.startDate).getTime();
    for (const pid of primaryIds) {
      const trend: number[] = [];
      for (let w = 0; w < block.week + 4; w++) {
        const weekSess: ReplaySession[] = block.sessions.filter((s) => {
          const days = Math.floor((new Date(s.scheduledDate).getTime() - start) / 86400000);
          return Math.floor(days / 7) === w && s.status === 'COMPLETE';
        });
        const best = weekSess
          .flatMap((s) => s.sets.filter((set) => set.exerciseId === pid))
          .map((set) => set.e1rm);
        trend.push(best.length > 0 ? Math.max(...best) : 0);
      }
      const filtered = trend.filter((v) => v > 0);
      // Walk forward, declaring peaks as the engine would have.
      for (let i = 3; i < filtered.length - 2; i++) {
        const sub = filtered.slice(0, i + 1);
        if (detectPeak(sub, fixture.profile.ttpEstimate, i + 1)) {
          declared++;
          const futureMax = Math.max(...filtered.slice(i + 1));
          if (futureMax > Math.max(...sub) * 1.005) falsePeaks++;
          break;
        }
      }
    }
  }
  return { name: 'falsePeakRate', value: declared > 0 ? falsePeaks / declared : 0, n: declared };
}

/** Fraction of sessions where the duration trim ran. */
export function durationTrimIncidence(fixture: ReplayFixture): Metric {
  let trimmed = 0;
  let sessions = 0;
  for (const block of fixture.blocks) {
    for (const session of block.sessions) {
      if (session.status !== 'COMPLETE') continue;
      sessions++;
      if (session.durationTrimmed) trimmed++;
    }
  }
  return { name: 'durationTrimIncidence', value: sessions > 0 ? trimmed / sessions : 0, n: sessions };
}

export function runAllMetrics(fixture: ReplayFixture): Metric[] {
  return [
    rpePredictionMAE(fixture),
    e1rmSmoothness(fixture),
    overrideFrequency(fixture),
    falsePeakRate(fixture),
    durationTrimIncidence(fixture),
  ];
}

// Silence unused-import warning for getConstants — kept exported for grid sweeps.
void getConstants;
