import { describe, it, expect } from 'vitest'
import { BUILTIN_EXERCISES, getBuiltinExercise, TAG_GROUPS } from '../exerciseCatalog'

describe('BUILTIN_EXERCISES structural integrity', () => {
  it('contains at least 50 exercises', () => {
    expect(BUILTIN_EXERCISES.length).toBeGreaterThanOrEqual(50)
  })

  it('has no duplicate exercise IDs', () => {
    const ids = BUILTIN_EXERCISES.map(e => e.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all exercises have non-empty names', () => {
    for (const ex of BUILTIN_EXERCISES) {
      expect(ex.name.length).toBeGreaterThan(0)
    }
  })

  it('all exercises have valid tags', () => {
    const validTags = new Set(TAG_GROUPS)
    for (const ex of BUILTIN_EXERCISES) {
      expect(validTags.has(ex.tag)).toBe(true)
    }
  })

  it('all exercises have at least one primaryMuscle', () => {
    for (const ex of BUILTIN_EXERCISES) {
      expect(ex.primaryMuscles.length).toBeGreaterThan(0)
    }
  })

  it('all primaryMuscle entries are non-empty strings', () => {
    for (const ex of BUILTIN_EXERCISES) {
      for (const muscle of ex.primaryMuscles) {
        expect(typeof muscle).toBe('string')
        expect(muscle.length).toBeGreaterThan(0)
      }
    }
  })

  it('all exercises with efc have a value in [0.2, 1.5] range', () => {
    for (const ex of BUILTIN_EXERCISES) {
      if (ex.efc !== undefined) {
        expect(ex.efc).toBeGreaterThanOrEqual(0.2)
        expect(ex.efc).toBeLessThanOrEqual(1.5)
      }
    }
  })

  it('all exercises have defaultSets >= 1', () => {
    for (const ex of BUILTIN_EXERCISES) {
      expect(ex.defaultSets).toBeGreaterThanOrEqual(1)
    }
  })

  it('all exercises have defaultReps >= 1', () => {
    for (const ex of BUILTIN_EXERCISES) {
      expect(ex.defaultReps).toBeGreaterThanOrEqual(1)
    }
  })

  it('all exercises have defaultRpe between 6.0 and 10.0', () => {
    for (const ex of BUILTIN_EXERCISES) {
      expect(ex.defaultRpe).toBeGreaterThanOrEqual(6.0)
      expect(ex.defaultRpe).toBeLessThanOrEqual(10.0)
    }
  })

  it('all builtin exercises have builtin=true', () => {
    for (const ex of BUILTIN_EXERCISES) {
      expect(ex.builtin).toBe(true)
    }
  })

  it('all exercises with weakPointTargets have valid liftId and position', () => {
    const validLifts = new Set(['squat', 'bench', 'deadlift'])
    for (const ex of BUILTIN_EXERCISES) {
      if (ex.weakPointTargets) {
        for (const wpt of ex.weakPointTargets) {
          expect(validLifts.has(wpt.liftId)).toBe(true)
          expect(typeof wpt.position).toBe('string')
          expect(wpt.position.length).toBeGreaterThan(0)
        }
      }
    }
  })
})

describe('PRIMARY exercises', () => {
  const primaries = BUILTIN_EXERCISES.filter(e => e.tag === 'PRIMARY')

  it('there are at least 3 primary exercises (squat, bench, deadlift)', () => {
    expect(primaries.length).toBeGreaterThanOrEqual(3)
  })

  it('barbell_back_squat exists with correct properties', () => {
    const squat = getBuiltinExercise('barbell_back_squat')
    expect(squat).toBeDefined()
    expect(squat!.tag).toBe('PRIMARY')
    expect(squat!.efc).toBe(1.40)
    expect(squat!.primaryMuscles).toContain('quads')
    expect(squat!.primaryMuscles).toContain('glutes')
  })

  it('bench_press exists with correct properties', () => {
    const bench = getBuiltinExercise('bench_press')
    expect(bench).toBeDefined()
    expect(bench!.tag).toBe('PRIMARY')
    expect(bench!.efc).toBe(0.95)
    expect(bench!.primaryMuscles).toContain('pecs')
  })

  it('conventional_deadlift exists with correct properties', () => {
    const dl = getBuiltinExercise('conventional_deadlift')
    expect(dl).toBeDefined()
    expect(dl!.tag).toBe('PRIMARY')
    expect(dl!.efc).toBe(1.35)
    expect(dl!.primaryMuscles).toContain('hamstrings')
  })

  it('primary exercises have higher efc than accessory exercises on average', () => {
    const primaryEfc = primaries.map(e => e.efc ?? 1.0)
    const accessories = BUILTIN_EXERCISES.filter(e => e.tag === 'SUPP')
    const accessoryEfc = accessories.map(e => e.efc ?? 0.7)
    const primaryMean = primaryEfc.reduce((a, b) => a + b, 0) / primaryEfc.length
    const accessoryMean = accessoryEfc.reduce((a, b) => a + b, 0) / accessoryEfc.length
    expect(primaryMean).toBeGreaterThan(accessoryMean)
  })
})

describe('getBuiltinExercise', () => {
  it('returns the matching exercise by id', () => {
    const ex = getBuiltinExercise('leg_curl')
    expect(ex).toBeDefined()
    expect(ex!.id).toBe('leg_curl')
    expect(ex!.name).toBe('Leg curl')
  })

  it('returns undefined for unknown id', () => {
    expect(getBuiltinExercise('nonexistent_exercise')).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(getBuiltinExercise('')).toBeUndefined()
  })

  it('is case-sensitive (no fuzzy match)', () => {
    expect(getBuiltinExercise('Leg_Curl')).toBeUndefined()
    expect(getBuiltinExercise('LEG_CURL')).toBeUndefined()
  })
})

describe('CORE exercises', () => {
  const coreExercises = BUILTIN_EXERCISES.filter(e => e.tag === 'CORE')

  it('there is at least one CORE exercise', () => {
    expect(coreExercises.length).toBeGreaterThan(0)
  })

  it('plank exists as a CORE exercise', () => {
    const plank = getBuiltinExercise('plank')
    expect(plank).toBeDefined()
    expect(plank!.tag).toBe('CORE')
  })

  it('all CORE exercises target core muscles', () => {
    for (const ex of coreExercises) {
      expect(ex.primaryMuscles.some(m => m === 'core' || m === 'hip_flexors')).toBe(true)
    }
  })
})

describe('weak-point targeting coverage', () => {
  it('at least one exercise targets squat out_of_hole', () => {
    const targeting = BUILTIN_EXERCISES.filter(e =>
      e.weakPointTargets?.some(w => w.liftId === 'squat' && w.position === 'out_of_hole'),
    )
    expect(targeting.length).toBeGreaterThan(0)
  })

  it('at least one exercise targets bench off_chest', () => {
    const targeting = BUILTIN_EXERCISES.filter(e =>
      e.weakPointTargets?.some(w => w.liftId === 'bench' && w.position === 'off_chest'),
    )
    expect(targeting.length).toBeGreaterThan(0)
  })

  it('at least one exercise targets deadlift off_floor', () => {
    const targeting = BUILTIN_EXERCISES.filter(e =>
      e.weakPointTargets?.some(w => w.liftId === 'deadlift' && w.position === 'off_floor'),
    )
    expect(targeting.length).toBeGreaterThan(0)
  })
})
