import { describe, it, expect } from 'vitest'
import {
  calculateSetSFI,
  calculateSessionSFI,
  calculateRCS,
  rcsBand,
} from '../../engine'

describe('calculateSetSFI', () => {
  it('applies formula: (rpe/9)^2 * reps^0.65 * efc * proximityFactor', () => {
    // squat: efc=1.40, topSet → proximity=1.2
    const result = calculateSetSFI(9, 3, 'barbell_back_squat', true)
    const expected = Math.pow(9 / 9, 2) * Math.pow(3, 0.65) * 1.40 * 1.2
    expect(result).toBeCloseTo(expected, 4)
  })

  it('non-top-set: proximityFactor = 1.0', () => {
    const topSet = calculateSetSFI(9, 3, 'barbell_back_squat', true)
    const workSet = calculateSetSFI(9, 3, 'barbell_back_squat', false)
    expect(workSet).toBeCloseTo(topSet / 1.2, 4)
  })

  it('bench press uses efc=0.95', () => {
    const bench = calculateSetSFI(9, 3, 'bench_press', false)
    const expected = Math.pow(9 / 9, 2) * Math.pow(3, 0.65) * 0.95 * 1.0
    expect(bench).toBeCloseTo(expected, 4)
  })

  it('unknown exercise falls back to efc=0.85', () => {
    const unknown = calculateSetSFI(9, 3, 'unknown_exercise', false)
    const expected = Math.pow(9 / 9, 2) * Math.pow(3, 0.65) * 0.85 * 1.0
    expect(unknown).toBeCloseTo(expected, 4)
  })

  it('plank (core) uses efc=0.30', () => {
    const plank = calculateSetSFI(7, 1, 'plank', false)
    const expected = Math.pow(7 / 9, 2) * Math.pow(1, 0.65) * 0.30 * 1.0
    expect(plank).toBeCloseTo(expected, 4)
  })

  it('rpe=9, reps=5, deadlift: isTopSet false vs true differs by 1.2×', () => {
    const normal = calculateSetSFI(9, 5, 'conventional_deadlift', false)
    const top = calculateSetSFI(9, 5, 'conventional_deadlift', true)
    expect(top / normal).toBeCloseTo(1.2, 5)
  })

  it('lower rpe produces lower SFI', () => {
    const high = calculateSetSFI(9, 5, 'bench_press', false)
    const low = calculateSetSFI(7, 5, 'bench_press', false)
    expect(low).toBeLessThan(high)
  })

  it('more reps produces higher SFI', () => {
    const few = calculateSetSFI(8, 3, 'bench_press', false)
    const many = calculateSetSFI(8, 10, 'bench_press', false)
    expect(many).toBeGreaterThan(few)
  })
})

describe('calculateSessionSFI', () => {
  it('empty set list returns 0', () => {
    expect(calculateSessionSFI([])).toBe(0)
  })

  it('single set returns same as calculateSetSFI', () => {
    const sets = [{ rpe: 8, reps: 5, exerciseId: 'bench_press', isTopSet: false }]
    expect(calculateSessionSFI(sets)).toBeCloseTo(calculateSetSFI(8, 5, 'bench_press', false), 4)
  })

  it('sums across multiple sets', () => {
    const sets = [
      { rpe: 9, reps: 3, exerciseId: 'barbell_back_squat', isTopSet: true },
      { rpe: 8, reps: 5, exerciseId: 'bench_press', isTopSet: false },
    ]
    const expected = calculateSetSFI(9, 3, 'barbell_back_squat', true) + calculateSetSFI(8, 5, 'bench_press', false)
    expect(calculateSessionSFI(sets)).toBeCloseTo(expected, 4)
  })

  it('isTopSet is passed through correctly', () => {
    const withTop = [{ rpe: 9, reps: 3, exerciseId: 'barbell_back_squat', isTopSet: true }]
    const withoutTop = [{ rpe: 9, reps: 3, exerciseId: 'barbell_back_squat', isTopSet: false }]
    expect(calculateSessionSFI(withTop)).toBeGreaterThan(calculateSessionSFI(withoutTop))
  })
})

describe('calculateRCS', () => {
  it('all wellness = 10 → RCS = 100', () => {
    const rcs = calculateRCS({
      sleepQuality: 10, overallFatigue: 10, muscleSoreness: 10,
      motivation: 10, stress: 10,
    })
    expect(rcs).toBe(100)
  })

  it('all wellness = 1 → RCS = 0', () => {
    const rcs = calculateRCS({
      sleepQuality: 1, overallFatigue: 1, muscleSoreness: 1,
      motivation: 1, stress: 1,
    })
    expect(rcs).toBe(0)
  })

  it('mid-range wellness produces value between 0 and 100', () => {
    const rcs = calculateRCS({
      sleepQuality: 6, overallFatigue: 6, muscleSoreness: 6,
      motivation: 6, stress: 6,
    })
    expect(rcs).toBeGreaterThan(0)
    expect(rcs).toBeLessThan(100)
  })

  it('HRV above baseline adds positive modifier', () => {
    const baseRcs = calculateRCS({ sleepQuality: 7, overallFatigue: 7, muscleSoreness: 7, motivation: 7, stress: 7 })
    const hvRcs = calculateRCS(
      { sleepQuality: 7, overallFatigue: 7, muscleSoreness: 7, motivation: 7, stress: 7 },
      60, 50  // hrv7Day=60, baseline=50 → deviation=+0.20 → modifier=+4
    )
    expect(hvRcs).toBeGreaterThan(baseRcs)
  })

  it('HRV below baseline adds negative modifier', () => {
    const baseRcs = calculateRCS({ sleepQuality: 7, overallFatigue: 7, muscleSoreness: 7, motivation: 7, stress: 7 })
    const lowHrvRcs = calculateRCS(
      { sleepQuality: 7, overallFatigue: 7, muscleSoreness: 7, motivation: 7, stress: 7 },
      40, 60  // hrv7Day=40, baseline=60 → deviation=-0.333 → modifier=-6.67
    )
    expect(lowHrvRcs).toBeLessThan(baseRcs)
  })

  it('HRV modifier capped at +10', () => {
    const rcs1 = calculateRCS(
      { sleepQuality: 7, overallFatigue: 7, muscleSoreness: 7, motivation: 7, stress: 7 },
      200, 50  // extreme positive
    )
    const rcs2 = calculateRCS(
      { sleepQuality: 7, overallFatigue: 7, muscleSoreness: 7, motivation: 7, stress: 7 },
      1000, 50  // even more extreme
    )
    expect(rcs1).toBe(rcs2)
  })

  it('HRV modifier capped at -15', () => {
    const rcs = calculateRCS(
      { sleepQuality: 10, overallFatigue: 10, muscleSoreness: 10, motivation: 10, stress: 10 },
      0.01, 100  // extreme negative HRV
    )
    expect(rcs).toBeGreaterThanOrEqual(0)
  })

  it('rpeDrift penalty reduces RCS', () => {
    const noDrift = calculateRCS({ sleepQuality: 7, overallFatigue: 7, muscleSoreness: 7, motivation: 7, stress: 7 }, undefined, undefined, 0)
    const drift = calculateRCS({ sleepQuality: 7, overallFatigue: 7, muscleSoreness: 7, motivation: 7, stress: 7 }, undefined, undefined, 2)
    expect(drift).toBeLessThan(noDrift)
  })

  it('wellness.hrvRmssd takes precedence over hrv7DayRolling', () => {
    const withRmssd = calculateRCS(
      { sleepQuality: 7, overallFatigue: 7, muscleSoreness: 7, motivation: 7, stress: 7, hrvRmssd: 80 },
      30, 60  // hrv7DayRolling=30 (bad), but hrvRmssd=80 (good vs baseline=60)
    )
    const withRolling = calculateRCS(
      { sleepQuality: 7, overallFatigue: 7, muscleSoreness: 7, motivation: 7, stress: 7 },
      30, 60
    )
    // RCS with hrvRmssd=80 (good HRV) should be higher than with hrv7DayRolling=30
    expect(withRmssd).toBeGreaterThan(withRolling)
  })

  it('RCS is always in [0, 100]', () => {
    for (let i = 1; i <= 10; i++) {
      const rcs = calculateRCS({
        sleepQuality: i, overallFatigue: i, muscleSoreness: i,
        motivation: i, stress: i
      })
      expect(rcs).toBeGreaterThanOrEqual(0)
      expect(rcs).toBeLessThanOrEqual(100)
    }
  })
})

describe('rcsBand', () => {
  it('rcs >= 85 → Excellent', () => {
    expect(rcsBand(100).band).toBe('Excellent')
    expect(rcsBand(85).band).toBe('Excellent')
  })

  it('rcs >= 70 and < 85 → Good', () => {
    expect(rcsBand(70).band).toBe('Good')
    expect(rcsBand(84).band).toBe('Good')
  })

  it('rcs >= 55 and < 70 → Moderate', () => {
    expect(rcsBand(55).band).toBe('Moderate')
    expect(rcsBand(69).band).toBe('Moderate')
  })

  it('rcs >= 40 and < 55 → Poor', () => {
    expect(rcsBand(40).band).toBe('Poor')
    expect(rcsBand(54).band).toBe('Poor')
  })

  it('rcs < 40 → Very poor', () => {
    expect(rcsBand(39).band).toBe('Very poor')
    expect(rcsBand(0).band).toBe('Very poor')
  })

  it('returns a modifier string for each band', () => {
    for (const rcs of [0, 40, 55, 70, 85, 100]) {
      expect(rcsBand(rcs).modifier).toBeTruthy()
    }
  })
})
