import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../idbStorage', () => ({
  idbStorage: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}))

import { useStore } from '../../store'
import { DEFAULT_RPE_TABLE } from '../../engine'
import type { UserProfile } from '../../store'
import type { CatalogEntry } from '../../exerciseCatalog'

const testProfile: UserProfile = {
  bodyWeight: 84,
  dob: '1991-01-01',
  sex: 'Male',
  trainingAge: '2–5 years',
  trainingAgeYears: 3,
  primaryGoal: 'Powerlifting',
  trainingFrequency: 4,
  sessionDuration: 90,
  availableDays: [true, false, true, false, true, true, false],
  excludedExercises: [],
  squatStance: 'moderate',
  deadliftStance: 'conventional',
  belt: true,
  kneeSleeves: 'sleeves',
  weakPoints: { squat: 'out_of_hole', bench: 'off_chest', deadlift: 'off_floor' },
  e1rm: { squat: 200, bench: 140, deadlift: 230 },
  rollingE1rm: { squat: 200, bench: 140, deadlift: 230 },
  ttpEstimate: 6,
  ttpHistory: [],
  federation: 'IPF',
  equipment: 'Raw',
  weightClass: '83',
  completedBlocks: 0,
  rpeCalibration: { sessions: 0, mae: 1.0 },
  rpeTable: { ...DEFAULT_RPE_TABLE },
  rpeTablePersonalised: false,
  rpeTableMeta: { updatedAt: new Date().toISOString(), cellCounts: {}, isMonotone: true, observations: {} },
  mevEstimates: {},
  mrvEstimates: {},
  accessoryResponsiveness: {},
  accessoryResponsivenessExploratory: {},
  weakPointStreak: {},
  recentProgramme: 'Custom RPE',
  peakingActive: false,
  programmingMode: 'PHASE',
  telemetryConsent: 'NONE',
}

beforeEach(() => {
  useStore.setState({
    profile: { ...testProfile },
    blocks: [],
    currentBlock: null,
    currentSession: null,
    deloadRecommendation: null,
    onboardingComplete: false,
    customExercises: [],
  })
})

describe('setProfile', () => {
  it('merges partial update into existing profile', () => {
    useStore.getState().setProfile({ bodyWeight: 90 })
    expect(useStore.getState().profile.bodyWeight).toBe(90)
  })

  it('does not clobber unrelated fields', () => {
    useStore.getState().setProfile({ bodyWeight: 90 })
    expect(useStore.getState().profile.sex).toBe('Male')
    expect(useStore.getState().profile.ttpEstimate).toBe(6)
  })

  it('can update e1rm record', () => {
    useStore.getState().setProfile({ e1rm: { squat: 220, bench: 150, deadlift: 250 } })
    expect(useStore.getState().profile.e1rm.squat).toBe(220)
    expect(useStore.getState().profile.e1rm.bench).toBe(150)
  })

  it('can update trainingAge string', () => {
    useStore.getState().setProfile({ trainingAge: '5–10 years', trainingAgeYears: 7 })
    expect(useStore.getState().profile.trainingAge).toBe('5–10 years')
    expect(useStore.getState().profile.trainingAgeYears).toBe(7)
  })
})

describe('addCustomExercise / removeCustomExercise', () => {
  const customEntry: CatalogEntry = {
    id: 'custom-ab-wheel-v2',
    name: 'Custom ab wheel v2',
    tag: 'CORE',
    defaultSets: 3,
    defaultReps: 8,
    defaultRpe: 7.5,
    builtin: false,
    primaryMuscles: ['core'],
    efc: 0.40,
  }

  it('addCustomExercise appends to customExercises', () => {
    useStore.getState().addCustomExercise(customEntry)
    expect(useStore.getState().customExercises.length).toBe(1)
    expect(useStore.getState().customExercises[0].id).toBe('custom-ab-wheel-v2')
  })

  it('added exercise always has builtin=false', () => {
    const asBuiltin = { ...customEntry, builtin: true }
    useStore.getState().addCustomExercise(asBuiltin)
    expect(useStore.getState().customExercises[0].builtin).toBe(false)
  })

  it('removeCustomExercise removes the matching exercise', () => {
    useStore.getState().addCustomExercise(customEntry)
    expect(useStore.getState().customExercises.length).toBe(1)
    useStore.getState().removeCustomExercise('custom-ab-wheel-v2')
    expect(useStore.getState().customExercises.length).toBe(0)
  })

  it('removeCustomExercise is a no-op for unknown id', () => {
    useStore.getState().addCustomExercise(customEntry)
    useStore.getState().removeCustomExercise('nonexistent')
    expect(useStore.getState().customExercises.length).toBe(1)
  })

  it('can add multiple custom exercises', () => {
    useStore.getState().addCustomExercise(customEntry)
    useStore.getState().addCustomExercise({ ...customEntry, id: 'custom-2', name: 'Custom 2' })
    expect(useStore.getState().customExercises.length).toBe(2)
  })
})

describe('clearDeloadRecommendation', () => {
  it('sets deloadRecommendation to null', () => {
    useStore.setState({ deloadRecommendation: { level: 'MODERATE', message: 'Take it easy' } })
    useStore.getState().clearDeloadRecommendation()
    expect(useStore.getState().deloadRecommendation).toBeNull()
  })
})

describe('requestProgrammingModeSwitch', () => {
  it('switches immediately when no active block', () => {
    useStore.getState().requestProgrammingModeSwitch('TTP')
    expect(useStore.getState().profile.programmingMode).toBe('TTP')
  })

  it('sets pendingProgrammingMode when active block exists', () => {
    const activeBlock = {
      id: 'b-1',
      type: 'DEVELOPMENT' as const,
      phase: 'ACCUMULATION' as const,
      startDate: '2026-01-01',
      week: 1,
      status: 'ACTIVE' as const,
      sessions: [],
      weeklyMuscleVolume: {},
      auditLog: [],
    }
    useStore.setState({ currentBlock: activeBlock, blocks: [activeBlock] })
    useStore.getState().requestProgrammingModeSwitch('TTP')
    expect(useStore.getState().profile.programmingMode).toBe('PHASE')
    expect(useStore.getState().profile.pendingProgrammingMode).toBe('TTP')
  })

  it('clears pendingProgrammingMode when switching to current mode with active block', () => {
    const activeBlock = {
      id: 'b-1',
      type: 'DEVELOPMENT' as const,
      phase: 'ACCUMULATION' as const,
      startDate: '2026-01-01',
      week: 1,
      status: 'ACTIVE' as const,
      sessions: [],
      weeklyMuscleVolume: {},
      auditLog: [],
    }
    useStore.setState({ currentBlock: activeBlock, blocks: [activeBlock] })
    useStore.setState({ profile: { ...useStore.getState().profile, pendingProgrammingMode: 'TTP' } })
    useStore.getState().requestProgrammingModeSwitch('PHASE')
    expect(useStore.getState().profile.pendingProgrammingMode).toBeUndefined()
  })
})

describe('getRpeCellConfidence', () => {
  it('returns "low" when cell has no observations', () => {
    expect(useStore.getState().getRpeCellConfidence(3, 8.5)).toBe('low')
  })

  it('returns "medium" when cell has 3–9 observations', () => {
    useStore.setState({
      profile: {
        ...testProfile,
        rpeTableMeta: {
          updatedAt: new Date().toISOString(),
          cellCounts: { '3@8.5': 5 },
          isMonotone: true,
          observations: {},
        },
      },
    })
    expect(useStore.getState().getRpeCellConfidence(3, 8.5)).toBe('medium')
  })

  it('returns "high" when cell has >= 10 observations', () => {
    useStore.setState({
      profile: {
        ...testProfile,
        rpeTableMeta: {
          updatedAt: new Date().toISOString(),
          cellCounts: { '5@8': 12 },
          isMonotone: true,
          observations: {},
        },
      },
    })
    expect(useStore.getState().getRpeCellConfidence(5, 8)).toBe('high')
  })
})

describe('setTelemetryConsent', () => {
  it('updates telemetryConsent to AGGREGATE', () => {
    useStore.getState().setTelemetryConsent('AGGREGATE')
    expect(useStore.getState().profile.telemetryConsent).toBe('AGGREGATE')
  })

  it('updates telemetryConsent back to NONE', () => {
    useStore.setState({ profile: { ...testProfile, telemetryConsent: 'AGGREGATE' } })
    useStore.getState().setTelemetryConsent('NONE')
    expect(useStore.getState().profile.telemetryConsent).toBe('NONE')
  })
})

describe('exportAggregate', () => {
  it('returns null when consent is NONE', () => {
    expect(useStore.getState().exportAggregate()).toBeNull()
  })

  it('returns JSON string when consent is AGGREGATE', () => {
    useStore.getState().setTelemetryConsent('AGGREGATE')
    const result = useStore.getState().exportAggregate()
    expect(result).not.toBeNull()
    expect(typeof result).toBe('string')
    const parsed = JSON.parse(result!)
    expect(parsed.schemaVersion).toBe(1)
  })

  it('strips dob from exported profile', () => {
    useStore.getState().setTelemetryConsent('AGGREGATE')
    const result = useStore.getState().exportAggregate()
    const parsed = JSON.parse(result!)
    expect(parsed.profile.dob).toBeUndefined()
  })

  it('rounds bodyWeight to nearest 5', () => {
    useStore.setState({ profile: { ...testProfile, bodyWeight: 83, telemetryConsent: 'AGGREGATE' } })
    const result = useStore.getState().exportAggregate()
    const parsed = JSON.parse(result!)
    expect(parsed.profile.bodyWeight % 5).toBe(0)
  })
})
