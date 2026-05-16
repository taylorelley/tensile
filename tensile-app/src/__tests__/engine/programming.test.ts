import { describe, it, expect } from 'vitest'
import {
  withinPhaseRpeAdd,
  getBackOffDrop,
  ageScaling,
  volumeBudget,
  getRirLoad,
  estimateSessionDuration,
  setConstants,
  DEFAULT_CONSTANTS,
  DEFAULT_RPE_TABLE,
} from '../../engine'

describe('withinPhaseRpeAdd', () => {
  it('ACCUMULATION always returns 0', () => {
    expect(withinPhaseRpeAdd('ACCUMULATION', 1, 6)).toBe(0)
    expect(withinPhaseRpeAdd('ACCUMULATION', 6, 6)).toBe(0)
    expect(withinPhaseRpeAdd('ACCUMULATION', 3, 6)).toBe(0)
  })

  it('INTENSIFICATION: week 1 of 6 → 0', () => {
    expect(withinPhaseRpeAdd('INTENSIFICATION', 1, 6)).toBeCloseTo(0, 5)
  })

  it('INTENSIFICATION: week 6 of 6 → 0.5', () => {
    expect(withinPhaseRpeAdd('INTENSIFICATION', 6, 6)).toBeCloseTo(0.5, 5)
  })

  it('INTENSIFICATION: week 3 of 6 interpolates linearly', () => {
    const r = withinPhaseRpeAdd('INTENSIFICATION', 3, 6)
    expect(r).toBeCloseTo(0.5 * (2 / 5), 5)
  })

  it('REALISATION: week 1 of 6 → 0.5', () => {
    expect(withinPhaseRpeAdd('REALISATION', 1, 6)).toBeCloseTo(0.5, 5)
  })

  it('REALISATION: week 6 of 6 → 1.0', () => {
    expect(withinPhaseRpeAdd('REALISATION', 6, 6)).toBeCloseTo(1.0, 5)
  })

  it('totalBlockWeeks = 1 → t = 0, avoids divide-by-zero', () => {
    expect(withinPhaseRpeAdd('INTENSIFICATION', 1, 1)).toBeCloseTo(0, 5)
    expect(withinPhaseRpeAdd('REALISATION', 1, 1)).toBeCloseTo(0.5, 5)
  })

  it('unknown phase → 0', () => {
    expect(withinPhaseRpeAdd('DELOAD', 3, 6)).toBe(0)
  })

  it('blockWeek clamped to [0,1]: week > total → t = 1', () => {
    const r = withinPhaseRpeAdd('INTENSIFICATION', 10, 6)
    expect(r).toBeCloseTo(0.5, 5)
  })
})

describe('getBackOffDrop', () => {
  it('ACCUMULATION week 1 → 0.10', () => {
    expect(getBackOffDrop('ACCUMULATION', 1, 6)).toBeCloseTo(0.10, 5)
  })

  it('ACCUMULATION week 6 → 0.15', () => {
    expect(getBackOffDrop('ACCUMULATION', 6, 6)).toBeCloseTo(0.15, 5)
  })

  it('INTENSIFICATION week 1 → 0.05', () => {
    expect(getBackOffDrop('INTENSIFICATION', 1, 6)).toBeCloseTo(0.05, 5)
  })

  it('INTENSIFICATION week 6 → 0.08', () => {
    expect(getBackOffDrop('INTENSIFICATION', 6, 6)).toBeCloseTo(0.08, 5)
  })

  it('REALISATION → always 0.02', () => {
    expect(getBackOffDrop('REALISATION', 1, 6)).toBeCloseTo(0.02, 5)
    expect(getBackOffDrop('REALISATION', 6, 6)).toBeCloseTo(0.02, 5)
  })

  it('unknown phase → 0.12', () => {
    expect(getBackOffDrop('DELOAD')).toBeCloseTo(0.12, 5)
  })

  it('ACCUMULATION drop increases monotonically over the block', () => {
    const drops = [1, 2, 3, 4, 5, 6].map(w => getBackOffDrop('ACCUMULATION', w, 6))
    for (let i = 1; i < drops.length; i++) {
      expect(drops[i]).toBeGreaterThanOrEqual(drops[i - 1])
    }
  })
})

describe('ageScaling', () => {
  it('age below threshold → all multipliers at default (no scaling)', () => {
    const r = ageScaling(30)
    expect(r.e1rmAlphaMult).toBe(1)
    expect(r.aclrThresholdMult).toBe(1)
    expect(r.intensificationDelta).toBe(0)
  })

  it('age exactly at threshold → scaling applies', () => {
    // threshold default = 40; age < 40 → no scaling; age >= 40 → scaling
    const atThreshold = ageScaling(DEFAULT_CONSTANTS.ageScalingFrom)
    expect(atThreshold.e1rmAlphaMult).toBe(0.5)
  })

  it('age above threshold → scaling applies', () => {
    const r = ageScaling(50)
    expect(r.e1rmAlphaMult).toBe(0.5)
    expect(r.aclrThresholdMult).toBe(0.9)
    expect(r.intensificationDelta).toBe(-0.5)
  })

  it('custom ageScalingFrom via setConstants', () => {
    setConstants({ ageScalingFrom: 35 })
    expect(ageScaling(37).e1rmAlphaMult).toBe(0.5)
    expect(ageScaling(34).e1rmAlphaMult).toBe(1)
  })
})

describe('volumeBudget', () => {
  it('week 1 of 6, mid recovery → target near MEV', () => {
    const result = volumeBudget(10, 22, 1, 6, 70)
    // target = 10 + 12*(1/6) = 12
    expect(result).toBe(12)
  })

  it('last week, mid recovery → target near MRV', () => {
    const result = volumeBudget(10, 22, 6, 6, 70)
    expect(result).toBe(22)
  })

  it('low recovery (<60) reduces target by 10%', () => {
    const normal = volumeBudget(10, 20, 3, 6, 70)
    const low = volumeBudget(10, 20, 3, 6, 50)
    expect(low).toBeLessThan(normal)
    // Low recovery → normal * 0.9
    expect(low).toBeCloseTo(Math.round(normal * 0.90), 0)
  })

  it('high recovery (>80) increases target up to MRV cap', () => {
    const high = volumeBudget(10, 20, 3, 6, 90)
    const normal = volumeBudget(10, 20, 3, 6, 70)
    expect(high).toBeGreaterThanOrEqual(normal)
    expect(high).toBeLessThanOrEqual(Math.round(20 * 0.95))
  })

  it('returns integer (Math.round applied)', () => {
    const result = volumeBudget(10, 22, 2, 6, 70)
    expect(Number.isInteger(result)).toBe(true)
  })
})

describe('getRirLoad', () => {
  it('RIR 0 maps to RPE 10 (implied max)', () => {
    const load = getRirLoad(0, 5, 200, DEFAULT_RPE_TABLE)
    // RPE 10 → clamped at 10; pct for 5@10 = 0.86; load = round(200*0.86/2.5)*2.5
    const expected = Math.round((200 * 0.86) / 2.5) * 2.5
    expect(load).toBe(expected)
  })

  it('RIR 3 maps to RPE 7 (minimum)', () => {
    const load = getRirLoad(3, 5, 200, DEFAULT_RPE_TABLE)
    const expected = Math.round((200 * DEFAULT_RPE_TABLE['5@7']!) / 2.5) * 2.5
    expect(load).toBeCloseTo(expected, 0)
  })

  it('returns 0 when e1rm is 0', () => {
    expect(getRirLoad(0, 5, 0, DEFAULT_RPE_TABLE)).toBe(0)
  })

  it('load is rounded to nearest 2.5 kg', () => {
    const load = getRirLoad(1, 5, 200, DEFAULT_RPE_TABLE)
    expect(load % 2.5).toBe(0)
  })
})

describe('estimateSessionDuration', () => {
  it('returns 15 warmup minutes for empty exercise list', () => {
    expect(estimateSessionDuration([])).toBe(15)
  })

  it('heavy exercises (rpeTarget >= 8) use 4 min rest', () => {
    const exercises = [{ sets: 4, reps: 3, rpeTarget: 8.5, tag: 'PRIMARY' }]
    const expected = Math.round(15 + 4 * (0.75 + 4))
    expect(estimateSessionDuration(exercises)).toBe(expected)
  })

  it('moderate exercises (rpeTarget >= 7) use 2.5 min rest', () => {
    const exercises = [{ sets: 3, reps: 8, rpeTarget: 7.5, tag: 'SUPP' }]
    const expected = Math.round(15 + 3 * (0.75 + 2.5))
    expect(estimateSessionDuration(exercises)).toBe(expected)
  })

  it('light exercises use 1.75 min rest', () => {
    const exercises = [{ sets: 3, reps: 15, rpeTarget: 6.5, tag: 'SUPP' }]
    const expected = Math.round(15 + 3 * (0.75 + 1.75))
    expect(estimateSessionDuration(exercises)).toBe(expected)
  })

  it('full session is plausibly timed (45-120 min)', () => {
    const exercises = [
      { sets: 4, reps: 3, rpeTarget: 8.5, tag: 'PRIMARY' },
      { sets: 3, reps: 5, rpeTarget: 8.0, tag: 'ASSIST' },
      { sets: 3, reps: 8, rpeTarget: 7.5, tag: 'SUPP' },
      { sets: 3, reps: 12, rpeTarget: 8.0, tag: 'SUPP' },
      { sets: 3, reps: 1, rpeTarget: 7.0, tag: 'CORE' },
    ]
    const duration = estimateSessionDuration(exercises)
    expect(duration).toBeGreaterThanOrEqual(45)
    expect(duration).toBeLessThanOrEqual(120)
  })
})
