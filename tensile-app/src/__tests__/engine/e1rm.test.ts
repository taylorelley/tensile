import { describe, it, expect } from 'vitest'
import {
  calculateE1RM,
  ensembleE1RM,
  DEFAULT_RPE_TABLE,
  setConstants,
  DEFAULT_CONSTANTS,
} from '../../engine'

const noCalibration = { sessions: 0, mae: 1.0 }
const highCalibration = { sessions: 20, mae: 0.3 }
const midCalibration = { sessions: 10, mae: 1.0 }

describe('calculateE1RM', () => {
  describe('repE1RM formula (Epley + Brzycki average)', () => {
    it('1-rep max: Epley = load, Brzycki = load / 0.9722', () => {
      const r = calculateE1RM({ load: 200, reps: 1, rpe: 10 }, DEFAULT_RPE_TABLE, noCalibration)
      const epley = 200 * (1 + 1 / 30)
      const brzycki = 200 / (1.0278 - 0.0278 * 1)
      expect(r.repE1RM).toBeCloseTo((epley + brzycki) / 2, 2)
    })

    it('5-rep set: verifiable formula', () => {
      const r = calculateE1RM({ load: 100, reps: 5, rpe: 8 }, DEFAULT_RPE_TABLE, noCalibration)
      const epley = 100 * (1 + 5 / 30)
      const brzycki = 100 / (1.0278 - 0.0278 * 5)
      expect(r.repE1RM).toBeCloseTo((epley + brzycki) / 2, 2)
    })

    it('reps >= 37 uses Epley only for Brzycki to avoid negative denominator', () => {
      const r = calculateE1RM({ load: 100, reps: 37, rpe: 6 }, DEFAULT_RPE_TABLE, noCalibration)
      const epley = 100 * (1 + 37 / 30)
      expect(r.repE1RM).toBeCloseTo(epley, 2)
    })
  })

  describe('repConfidence tiers', () => {
    it('reps <= 3 and rpe >= 8 → confidence 1.0', () => {
      const r = calculateE1RM({ load: 200, reps: 3, rpe: 8 }, DEFAULT_RPE_TABLE, noCalibration)
      expect(r.repConfidence).toBe(1.0)
    })

    it('reps <= 5 and rpe >= 7.5 → confidence 0.9', () => {
      const r = calculateE1RM({ load: 100, reps: 5, rpe: 7.5 }, DEFAULT_RPE_TABLE, noCalibration)
      expect(r.repConfidence).toBe(0.9)
    })

    it('reps <= 8 and rpe >= 7 → confidence 0.7', () => {
      const r = calculateE1RM({ load: 100, reps: 8, rpe: 7 }, DEFAULT_RPE_TABLE, noCalibration)
      expect(r.repConfidence).toBe(0.7)
    })

    it('reps <= 10 → confidence 0.5', () => {
      const r = calculateE1RM({ load: 100, reps: 10, rpe: 6 }, DEFAULT_RPE_TABLE, noCalibration)
      expect(r.repConfidence).toBe(0.5)
    })

    it('reps > 10 → confidence 0.2', () => {
      const r = calculateE1RM({ load: 100, reps: 15, rpe: 6 }, DEFAULT_RPE_TABLE, noCalibration)
      expect(r.repConfidence).toBe(0.2)
    })
  })

  describe('rpeE1RM and rpeConfidence', () => {
    it('rpeE1RM = load / table[reps@rpe]', () => {
      const r = calculateE1RM({ load: 100, reps: 5, rpe: 8 }, DEFAULT_RPE_TABLE, noCalibration)
      expect(r.rpeE1RM).toBeCloseTo(100 / 0.78, 2)
    })

    it('uses custom table over default', () => {
      const custom = { ...DEFAULT_RPE_TABLE, '5@8': 0.90 }
      const r = calculateE1RM({ load: 100, reps: 5, rpe: 8 }, custom, noCalibration)
      expect(r.rpeE1RM).toBeCloseTo(100 / 0.90, 2)
    })

    it('missing key falls back to 0.85', () => {
      const r = calculateE1RM({ load: 100, reps: 99, rpe: 9 }, DEFAULT_RPE_TABLE, noCalibration)
      expect(r.rpeE1RM).toBeCloseTo(100 / 0.85, 2)
    })

    it('high calibration → rpeConfidence 1.0', () => {
      const r = calculateE1RM({ load: 100, reps: 5, rpe: 8 }, DEFAULT_RPE_TABLE, highCalibration)
      expect(r.rpeConfidence).toBe(1.0)
    })

    it('mid calibration → rpeConfidence 0.7', () => {
      const r = calculateE1RM({ load: 100, reps: 5, rpe: 8 }, DEFAULT_RPE_TABLE, midCalibration)
      expect(r.rpeConfidence).toBe(0.7)
    })

    it('training age >= 2 → rpeConfidence 0.5', () => {
      const r = calculateE1RM({ load: 100, reps: 5, rpe: 8 }, DEFAULT_RPE_TABLE, { sessions: 0, mae: 1.0, trainingAgeYears: 3 })
      expect(r.rpeConfidence).toBe(0.5)
    })

    it('no calibration → rpeConfidence 0.3', () => {
      const r = calculateE1RM({ load: 100, reps: 5, rpe: 8 }, DEFAULT_RPE_TABLE, noCalibration)
      expect(r.rpeConfidence).toBe(0.3)
    })
  })

  describe('VBT method', () => {
    const lvProfile = { slope: 0.3, intercept: 0.2, n: 5, rSquared: 0.95 }

    it('computes vbtE1RM when all gates pass', () => {
      const r = calculateE1RM(
        { load: 100, reps: 5, rpe: 8, velocity: 0.5 },
        DEFAULT_RPE_TABLE, noCalibration, lvProfile
      )
      const expectedVbt = 100 / (0.3 * 0.5 + 0.2)
      expect(r.vbtE1RM).toBeCloseTo(expectedVbt, 2)
    })

    it('no VBT when velocity is undefined', () => {
      const r = calculateE1RM({ load: 100, reps: 5, rpe: 8 }, DEFAULT_RPE_TABLE, noCalibration, lvProfile)
      expect(r.vbtE1RM).toBeUndefined()
    })

    it('no VBT when n < vbtMinN', () => {
      const r = calculateE1RM(
        { load: 100, reps: 5, rpe: 8, velocity: 0.5 },
        DEFAULT_RPE_TABLE, noCalibration,
        { slope: 0.3, intercept: 0.2, n: 2, rSquared: 0.95 }
      )
      expect(r.vbtE1RM).toBeUndefined()
    })

    it('no VBT when rSquared < vbtMinR2', () => {
      const r = calculateE1RM(
        { load: 100, reps: 5, rpe: 8, velocity: 0.5 },
        DEFAULT_RPE_TABLE, noCalibration,
        { slope: 0.3, intercept: 0.2, n: 10, rSquared: 0.7 }
      )
      expect(r.vbtE1RM).toBeUndefined()
    })

    it('VBT passes when rSquared is undefined (legacy profiles)', () => {
      const r = calculateE1RM(
        { load: 100, reps: 5, rpe: 8, velocity: 0.5 },
        DEFAULT_RPE_TABLE, noCalibration,
        { slope: 0.3, intercept: 0.2, n: 5 }
      )
      expect(r.vbtE1RM).toBeDefined()
    })
  })
})

describe('ensembleE1RM', () => {
  it('returns session as weighted average of repE1RM and rpeE1RM', () => {
    const result = ensembleE1RM(
      { load: 100, reps: 5, rpe: 8 },
      DEFAULT_RPE_TABLE,
      noCalibration,
      200
    )
    expect(result.session).toBeGreaterThan(0)
    expect(result.session).toBeLessThan(200)
  })

  it('rolling EMA: alpha=0.12, previous=200', () => {
    const result = ensembleE1RM(
      { load: 100, reps: 5, rpe: 8 },
      DEFAULT_RPE_TABLE,
      noCalibration,
      200,
      0.12
    )
    const expected = 0.12 * result.session + 0.88 * 200
    expect(result.rolling).toBeCloseTo(expected, 2)
  })

  it('methodsUsed always includes rep-based and rpe-adjusted', () => {
    const result = ensembleE1RM(
      { load: 100, reps: 5, rpe: 8 },
      DEFAULT_RPE_TABLE,
      noCalibration,
      200
    )
    expect(result.methodsUsed).toContain('rep-based')
    expect(result.methodsUsed).toContain('rpe-adjusted')
  })

  it('methodsUsed includes vbt when VBT fires', () => {
    const lvProfile = { slope: 0.3, intercept: 0.2, n: 5, rSquared: 0.95 }
    const result = ensembleE1RM(
      { load: 100, reps: 5, rpe: 8, velocity: 0.5 },
      DEFAULT_RPE_TABLE,
      noCalibration,
      200,
      DEFAULT_CONSTANTS.e1rmAlpha,
      lvProfile
    )
    expect(result.methodsUsed).toContain('vbt')
  })

  it('VBT bias correction applied for known exercise', () => {
    const lvProfile = { slope: -0.5, intercept: 1.3, n: 5, rSquared: 0.95 }
    // Without exercise ID
    const noBias = ensembleE1RM(
      { load: 200, reps: 2, rpe: 9, velocity: 0.6 },
      DEFAULT_RPE_TABLE, highCalibration, 230,
      DEFAULT_CONSTANTS.e1rmAlpha, lvProfile
    )
    // With conventional_deadlift → 2.5 kg bias
    const withBias = ensembleE1RM(
      { load: 200, reps: 2, rpe: 9, velocity: 0.6 },
      DEFAULT_RPE_TABLE, highCalibration, 230,
      DEFAULT_CONSTANTS.e1rmAlpha, lvProfile, 'conventional_deadlift'
    )
    // Bias reduces VBT e1rm, lowering the ensemble
    expect(withBias.session).toBeLessThan(noBias.session)
  })

  it('confidenceIntervalPct is capped at 15', () => {
    const result = ensembleE1RM(
      { load: 100, reps: 15, rpe: 6 },
      DEFAULT_RPE_TABLE,
      noCalibration,
      200
    )
    expect(result.confidenceIntervalPct).toBeLessThanOrEqual(15)
  })

  it('confidenceIntervalPct is non-negative', () => {
    const result = ensembleE1RM(
      { load: 200, reps: 1, rpe: 10 },
      DEFAULT_RPE_TABLE,
      highCalibration,
      200
    )
    expect(result.confidenceIntervalPct).toBeGreaterThanOrEqual(0)
  })

  it('custom alpha parameter overrides default', () => {
    const r1 = ensembleE1RM({ load: 100, reps: 5, rpe: 8 }, DEFAULT_RPE_TABLE, noCalibration, 200, 0.5)
    const r2 = ensembleE1RM({ load: 100, reps: 5, rpe: 8 }, DEFAULT_RPE_TABLE, noCalibration, 200, 0.1)
    expect(r1.rolling).not.toBeCloseTo(r2.rolling, 2)
  })

  it('vbtBias can be overridden via setConstants', () => {
    setConstants({ vbtBias: {} })
    const lvProfile = { slope: -0.5, intercept: 1.3, n: 5, rSquared: 0.95 }
    const result = ensembleE1RM(
      { load: 200, reps: 2, rpe: 9, velocity: 0.6 },
      DEFAULT_RPE_TABLE, highCalibration, 230,
      DEFAULT_CONSTANTS.e1rmAlpha, lvProfile, 'conventional_deadlift'
    )
    expect(result.methodsUsed).toContain('vbt')
  })
})
