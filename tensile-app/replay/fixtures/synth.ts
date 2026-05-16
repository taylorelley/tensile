// Seeded synthetic-fixture generators. Versioned via the seed parameter so a
// regression is reproducible across machines. Use these to populate
// `fixtures/synth/*.json` via the CLI `--write` flag.
import { DEFAULT_RPE_TABLE } from '../../src/engine';
import type { ReplayFixture, ReplayBlock, ReplaySession, ReplaySet } from '../types';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function basePrimary(id: string, week: number, e1rm: number, rng: () => number): ReplaySet {
  const reps = 3;
  const rpe = 8.5;
  const key = `${reps}@${rpe}`;
  const pct = DEFAULT_RPE_TABLE[key] ?? 0.85;
  const load = Math.round((e1rm * pct + (rng() - 0.5) * 5) / 2.5) * 2.5;
  return {
    exerciseId: id,
    actualLoad: load,
    actualReps: reps,
    actualRpe: rpe,
    e1rm,
    velocity: 0.45 + (rng() - 0.5) * 0.05,
  };
}

function makeSession(blockId: string, weekIdx: number, dayIdx: number, primary: ReplaySet): ReplaySession {
  return {
    id: `${blockId}-w${weekIdx}-d${dayIdx}`,
    blockId,
    scheduledDate: new Date(2026, 0, 1 + weekIdx * 7 + dayIdx).toISOString().split('T')[0],
    status: 'COMPLETE',
    wellness: { sleepQuality: 7, overallFatigue: 6, muscleSoreness: 5, motivation: 8, stress: 6 },
    rcs: 75,
    srpe: 7,
    sets: [primary],
  };
}

/** Linear-gain block: e1RM rises ~1.5% per week, mild noise. */
export function linearGain(seed = 1): ReplayFixture {
  const rng = mulberry32(seed);
  const block: ReplayBlock = {
    id: 'block-linear',
    type: 'DEVELOPMENT',
    phase: 'ACCUMULATION',
    startDate: '2026-01-01',
    endDate: '2026-02-12',
    week: 6,
    status: 'COMPLETE',
    sessions: [],
    auditLog: [],
  };
  let e1rm = 200;
  for (let w = 0; w < 6; w++) {
    block.sessions.push(makeSession(block.id, w, 0, basePrimary('barbell_back_squat', w, e1rm, rng)));
    block.sessions.push(makeSession(block.id, w, 2, basePrimary('bench_press', w, e1rm * 0.7, rng)));
    block.sessions.push(makeSession(block.id, w, 4, basePrimary('conventional_deadlift', w, e1rm * 1.1, rng)));
    e1rm = Math.round(e1rm * 1.015);
  }
  return baseFixture([block]);
}

/** Stall block: e1RM trend flat for 6 weeks. */
export function stall(seed = 2): ReplayFixture {
  const rng = mulberry32(seed);
  const block: ReplayBlock = {
    id: 'block-stall',
    type: 'DEVELOPMENT',
    phase: 'INTENSIFICATION',
    startDate: '2026-01-01',
    endDate: '2026-02-12',
    week: 6,
    status: 'COMPLETE',
    sessions: [],
  };
  const e1rm = 210;
  for (let w = 0; w < 6; w++) {
    const noisy = e1rm + (rng() - 0.5) * 2;
    block.sessions.push(makeSession(block.id, w, 0, basePrimary('barbell_back_squat', w, noisy, rng)));
  }
  return baseFixture([block]);
}

/** False-peak block: peaks at week 3, then recovers by week 6. */
export function falsePeak(seed = 3): ReplayFixture {
  const rng = mulberry32(seed);
  const trend = [200, 205, 210, 208, 207, 212];
  const block: ReplayBlock = {
    id: 'block-fp',
    type: 'DEVELOPMENT',
    phase: 'ACCUMULATION',
    startDate: '2026-01-01',
    endDate: '2026-02-12',
    week: 6,
    status: 'COMPLETE',
    sessions: trend.map((v, w) => makeSession('block-fp', w, 0, basePrimary('barbell_back_squat', w, v, rng))),
  };
  return baseFixture([block]);
}

/** Noisy block: heavy week-to-week variance, no real signal. */
export function noisy(seed = 4): ReplayFixture {
  const rng = mulberry32(seed);
  const block: ReplayBlock = {
    id: 'block-noisy',
    type: 'DEVELOPMENT',
    phase: 'ACCUMULATION',
    startDate: '2026-01-01',
    endDate: '2026-02-12',
    week: 8,
    status: 'COMPLETE',
    sessions: [],
  };
  const mean = 220;
  for (let w = 0; w < 8; w++) {
    const e1rm = mean + (rng() - 0.5) * 18;
    block.sessions.push(makeSession(block.id, w, 0, basePrimary('barbell_back_squat', w, e1rm, rng)));
  }
  return baseFixture([block]);
}

function baseFixture(blocks: ReplayBlock[]): ReplayFixture {
  return {
    schemaVersion: 1,
    profile: {
      bodyWeight: 85,
      trainingAge: '2–5 years',
      trainingAgeYears: 3,
      primaryGoal: 'Powerlifting',
      programmingMode: 'PHASE',
      e1rm: { squat: 220, bench: 150, deadlift: 250 },
      rollingE1rm: { squat: 218, bench: 148, deadlift: 247 },
      rpeTable: { ...DEFAULT_RPE_TABLE },
      rpeCalibration: { sessions: 0, mae: 1.0 },
      ttpEstimate: 6,
      ttpHistory: [],
    },
    blocks,
  };
}

export const GATE_FIXTURE: ReplayFixture = linearGain(42);
