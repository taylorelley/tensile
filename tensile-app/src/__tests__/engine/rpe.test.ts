import { describe, it, expect } from 'vitest'
import {
  getRpePct,
  personalizeRpeTable,
  projectMonotoneRpeTable,
  detectRpeOutlier,
  isRpeOutlier,
  rpeCellModifiedZ,
  rpeTrustWeight,
  DEFAULT_RPE_TABLE,
  setConstants,
  DEFAULT_CONSTANTS,
} from '../../engine'

describe('getRpePct', () => {
  it('returns correct value from DEFAULT_RPE_TABLE for known key', () => {
    expect(getRpePct(3, 9)).toBe(0.87)
    expect(getRpePct(1, 10)).toBe(0.96)
    expect(getRpePct(10, 7)).toBe(0.59)
  })

  it('falls back to 0.80 for unknown key', () => {
    expect(getRpePct(99, 9)).toBe(0.80)
  })

  it('user table overrides default', () => {
    const custom = { '3@9': 0.91 }
    expect(getRpePct(3, 9, custom)).toBe(0.91)
  })

  it('user table fallback to default if key missing', () => {
    const custom = { '1@10': 0.97 }
    expect(getRpePct(5, 8, custom)).toBe(DEFAULT_RPE_TABLE['5@8'])
  })
})

describe('rpeCellModifiedZ', () => {
  it('with < rpeOutlierMinObs observations uses band fallback', () => {
    // Default band = 0.15, Z threshold = 3.5
    // Deviation = |0.80 - 0.83| / 0.83 = 0.0361; z = (0.0361/0.15)*3.5 = 0.842
    const z = rpeCellModifiedZ(0.80, 0.83, [])
    expect(z).toBeCloseTo((Math.abs(0.80 - 0.83) / 0.83 / 0.15) * 3.5, 2)
  })

  it('with sparse observations (< minObs), large deviation produces high z', () => {
    const z = rpeCellModifiedZ(0.50, 0.83, [])
    expect(z).toBeGreaterThan(3.5)
  })

  it('with sufficient observations uses MAD-based path', () => {
    const obs = [0.82, 0.83, 0.84, 0.83, 0.82]
    const z = rpeCellModifiedZ(0.83, 0.83, obs)
    expect(z).toBeGreaterThanOrEqual(0)
  })

  it('z = 0 when observation equals cell median', () => {
    const obs = [0.80, 0.80, 0.80, 0.80, 0.80]
    const z = rpeCellModifiedZ(0.80, 0.80, obs)
    expect(z).toBe(0)
  })

  it('expectedPct near 0 does not divide by zero', () => {
    expect(() => rpeCellModifiedZ(0.01, 0, [])).not.toThrow()
  })
})

describe('rpeTrustWeight', () => {
  it('z = 0 → trust = 1.0', () => {
    expect(rpeTrustWeight(0)).toBe(1.0)
  })

  it('z = rpeOutlierZ → trust = 0.0', () => {
    const { rpeOutlierZ } = DEFAULT_CONSTANTS
    expect(rpeTrustWeight(rpeOutlierZ)).toBe(0.0)
  })

  it('z = rpeOutlierZ / 2 → trust = 0.5', () => {
    const { rpeOutlierZ } = DEFAULT_CONSTANTS
    expect(rpeTrustWeight(rpeOutlierZ / 2)).toBeCloseTo(0.5, 5)
  })

  it('z > rpeOutlierZ → trust clamped to 0', () => {
    expect(rpeTrustWeight(100)).toBe(0)
  })

  it('respects overridden rpeOutlierZ constant', () => {
    setConstants({ rpeOutlierZ: 2.0 })
    expect(rpeTrustWeight(2.0)).toBe(0.0)
    expect(rpeTrustWeight(1.0)).toBeCloseTo(0.5, 5)
  })
})

describe('detectRpeOutlier', () => {
  it('returns none for clean set (small deviation)', () => {
    // load=150, e1rm=200 → observed=0.75, key 3@8 expected=0.83
    // dev = |0.75-0.83|/0.83 = 0.096; z = (0.096/0.15)*3.5 ≈ 2.24 < 3.5
    const r = detectRpeOutlier(150, 3, 8, 200, DEFAULT_RPE_TABLE)
    expect(r).toBe('none')
  })

  it('returns load when observed pct is far from expected', () => {
    // load=100, e1rm=200 → observed=0.50, expected 3@8=0.83
    // dev = |0.50-0.83|/0.83 ≈ 0.398; z ≈ 9.28 > 3.5
    const r = detectRpeOutlier(100, 3, 8, 200, DEFAULT_RPE_TABLE)
    expect(r).toBe('load')
  })

  it('returns none for zero e1rm', () => {
    const r = detectRpeOutlier(150, 3, 8, 0, DEFAULT_RPE_TABLE)
    expect(r).toBe('none')
  })

  it('returns none for zero load', () => {
    const r = detectRpeOutlier(0, 3, 8, 200, DEFAULT_RPE_TABLE)
    expect(r).toBe('none')
  })

  it('returns velocity when LRV deviates but load is normal', () => {
    // Give a calibrated LV profile
    const lvProfile = { slope: -0.3, intercept: 1.0, n: 5, rSquared: 0.95 }
    // Set load matching expected pct: e1rm=200, pct for 5@8 = 0.78 → load=156
    // Expected velocity for 5@8: v = (0.78 - 1.0) / (-0.3) = 0.733
    // Provide wildly wrong velocity (e.g. 2.0 m/s)
    const r = detectRpeOutlier(156, 5, 8, 200, DEFAULT_RPE_TABLE, 2.0, lvProfile)
    expect(r).toBe('velocity')
  })

  it('returns both when load and velocity both fail', () => {
    const lvProfile = { slope: -0.3, intercept: 1.0, n: 5, rSquared: 0.95 }
    // load=100 on e1rm=200 (observed=0.50) → load fail
    // velocity=2.0 (way off) → velocity fail
    const r = detectRpeOutlier(100, 5, 8, 200, DEFAULT_RPE_TABLE, 2.0, lvProfile)
    expect(r).toBe('both')
  })

  it('no LRV check when velocity is undefined', () => {
    const lvProfile = { slope: -0.3, intercept: 1.0, n: 5, rSquared: 0.95 }
    const r = detectRpeOutlier(156, 5, 8, 200, DEFAULT_RPE_TABLE, undefined, lvProfile)
    expect(r).toBe('none')
  })
})

describe('isRpeOutlier', () => {
  it('returns false for clean set', () => {
    expect(isRpeOutlier(150, 3, 8, 200, DEFAULT_RPE_TABLE)).toBe(false)
  })

  it('returns true for load outlier', () => {
    expect(isRpeOutlier(100, 3, 8, 200, DEFAULT_RPE_TABLE)).toBe(true)
  })
})

describe('personalizeRpeTable', () => {
  it('EWMA nudges cell toward observed ratio', () => {
    const current = { ...DEFAULT_RPE_TABLE }
    const e1rm = 128.2 // approx 100 / 0.78
    const { table } = personalizeRpeTable(current, 100, 5, 8, e1rm)
    // observed = 100/128.2 ≈ 0.780; current = 0.78; alpha=0.10 → no change
    expect(table['5@8']).toBeCloseTo(0.78, 2)
  })

  it('nudges up when observed pct exceeds current', () => {
    const current = { ...DEFAULT_RPE_TABLE }
    const e1rm = 110 // load=100 → observed = 100/110 ≈ 0.909
    const { table } = personalizeRpeTable(current, 100, 5, 8, e1rm)
    expect(table['5@8']).toBeGreaterThan(DEFAULT_RPE_TABLE['5@8']!)
  })

  it('nudges down when observed pct is below current', () => {
    const current = { ...DEFAULT_RPE_TABLE }
    const e1rm = 200 // load=100 → observed = 0.50
    const { table } = personalizeRpeTable(current, 100, 5, 8, e1rm)
    expect(table['5@8']).toBeLessThan(DEFAULT_RPE_TABLE['5@8']!)
  })

  it('trustWeight = 0 means no update', () => {
    const current = { ...DEFAULT_RPE_TABLE }
    const { table } = personalizeRpeTable(current, 100, 5, 8, 200, undefined, 0)
    expect(table['5@8']).toBeCloseTo(DEFAULT_RPE_TABLE['5@8']!, 4)
  })

  it('e1rmSession <= 0 returns unchanged table', () => {
    const current = { ...DEFAULT_RPE_TABLE }
    const { table, isPersonalised } = personalizeRpeTable(current, 100, 5, 8, 0)
    expect(table).toEqual(current)
    expect(isPersonalised).toBe(false)
  })

  it('meta.cellCounts increments for updated cell', () => {
    const { meta: m1 } = personalizeRpeTable({ ...DEFAULT_RPE_TABLE }, 100, 5, 8, 150)
    expect(m1.cellCounts['5@8']).toBe(1)
    const { meta: m2 } = personalizeRpeTable({ ...DEFAULT_RPE_TABLE }, 100, 5, 8, 150, m1)
    expect(m2.cellCounts['5@8']).toBe(2)
  })

  it('observations window is capped at rpeOutlierWindow', () => {
    let meta = undefined
    let table = { ...DEFAULT_RPE_TABLE }
    for (let i = 0; i < 25; i++) {
      const r = personalizeRpeTable(table, 100, 5, 8, 150, meta as any)
      table = r.table
      meta = r.meta as any
    }
    const obs = (meta as any).observations['5@8']
    expect(obs.length).toBeLessThanOrEqual(DEFAULT_CONSTANTS.rpeOutlierWindow)
  })

  it('returned table is monotone: higher reps → lower pct for same rpe', () => {
    const { table } = personalizeRpeTable({ ...DEFAULT_RPE_TABLE }, 100, 5, 8, 150)
    expect(table['3@8']).toBeGreaterThanOrEqual(table['5@8']!)
    expect(table['5@8']).toBeGreaterThanOrEqual(table['8@8']!)
    expect(table['8@8']).toBeGreaterThanOrEqual(table['10@8']!)
  })

  it('returned table is monotone: higher rpe → higher pct for same reps', () => {
    const { table } = personalizeRpeTable({ ...DEFAULT_RPE_TABLE }, 100, 5, 8, 150)
    expect(table['5@7']).toBeLessThanOrEqual(table['5@8']!)
    expect(table['5@8']).toBeLessThanOrEqual(table['5@9']!)
    expect(table['5@9']).toBeLessThanOrEqual(table['5@10']!)
  })
})

describe('projectMonotoneRpeTable', () => {
  it('already-monotone table is unchanged', () => {
    const projected = projectMonotoneRpeTable({ ...DEFAULT_RPE_TABLE })
    for (const key of Object.keys(DEFAULT_RPE_TABLE)) {
      expect(projected[key]).toBeCloseTo(DEFAULT_RPE_TABLE[key]!, 3)
    }
  })

  it('projected table satisfies monotonicity constraints', () => {
    // Invert a cell to create violation
    const broken = { ...DEFAULT_RPE_TABLE, '5@8': 0.50 }
    const projected = projectMonotoneRpeTable(broken)
    // After projection, higher rpe should have higher pct
    expect(projected['5@9']).toBeGreaterThanOrEqual(projected['5@8']!)
    // More reps should have lower pct
    expect(projected['3@8']).toBeGreaterThanOrEqual(projected['5@8']!)
  })

  it('flat table (all 0.80) stays at 0.80', () => {
    const flat: Record<string, number> = {}
    for (const key of Object.keys(DEFAULT_RPE_TABLE)) flat[key] = 0.80
    const projected = projectMonotoneRpeTable(flat)
    for (const key of Object.keys(flat)) {
      expect(projected[key]).toBeCloseTo(0.80, 3)
    }
  })
})
