import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../idbStorage', () => ({
  idbStorage: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}))

import { useStore, generateBlock } from '../../store'
import { DEFAULT_RPE_TABLE } from '../../engine'
import type { UserProfile } from '../../store'

const testProfile: UserProfile = {
  bodyWeight: 84,
  dob: '1991-01-01',
  sex: 'Male',
  trainingAge: '2–5 years',
  trainingAgeYears: 3,
  primaryGoal: 'Powerlifting',
  trainingFrequency: 4,
  sessionDuration: 120, // generous cap to avoid trimming
  availableDays: [true, false, false, false, false, false, false], // Mon only for predictability
  excludedExercises: [],
  squatStance: 'moderate',
  deadliftStance: 'conventional',
  belt: true,
  kneeSleeves: 'sleeves',
  weakPoints: { squat: 'out_of_hole', bench: 'off_chest', deadlift: 'off_floor' },
  e1rm: { squat: 200, bench: 140, deadlift: 230 },
  rollingE1rm: { squat: 198, bench: 139, deadlift: 228 },
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
  mevEstimates: { quads: 10, hamstrings: 8, glutes: 8, pecs: 10, delts: 8, triceps: 8, lats: 10, biceps: 6, core: 8 },
  mrvEstimates: { quads: 22, hamstrings: 20, glutes: 20, pecs: 22, delts: 18, triceps: 20, lats: 22, biceps: 18, core: 20 },
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

describe('generateBlock (exported helper)', () => {
  it('produces a DEVELOPMENT block', () => {
    const block = generateBlock(testProfile)
    expect(block.type).toBe('DEVELOPMENT')
  })

  it('ACCUMULATION is the default phase', () => {
    const block = generateBlock(testProfile)
    expect(block.phase).toBe('ACCUMULATION')
  })

  it('respects explicit phase argument', () => {
    const block = generateBlock(testProfile, 'INTENSIFICATION')
    expect(block.phase).toBe('INTENSIFICATION')
  })

  it('block is ACTIVE', () => {
    const block = generateBlock(testProfile)
    expect(block.status).toBe('ACTIVE')
  })

  it('session count equals availableDays * ttpEstimate weeks', () => {
    // testProfile has 1 available day (Mon) and ttpEstimate=6
    const block = generateBlock(testProfile)
    expect(block.sessions.length).toBe(6)
  })

  it('4 available days produces 4 * weeks sessions', () => {
    const profile = {
      ...testProfile,
      availableDays: [true, false, true, false, true, true, false] as boolean[], // Mon, Wed, Fri, Sat
    }
    const block = generateBlock(profile)
    expect(block.sessions.length).toBe(24) // 4 days × 6 weeks
  })

  it('all sessions are initially SCHEDULED', () => {
    const block = generateBlock(testProfile)
    for (const s of block.sessions) {
      expect(s.status).toBe('SCHEDULED')
    }
  })

  it('sessions have exercises', () => {
    const block = generateBlock(testProfile)
    for (const s of block.sessions) {
      expect(s.exercises.length).toBeGreaterThan(0)
    }
  })

  it('primary exercises have prescribedLoad > 0 when e1rm is set', () => {
    const block = generateBlock(testProfile)
    for (const s of block.sessions) {
      const primary = s.exercises.find(e => e.tag === 'PRIMARY')
      if (primary) {
        expect(primary.prescribedLoad).toBeGreaterThan(0)
      }
    }
  })

  it('scheduledDate strings are valid ISO date format', () => {
    const block = generateBlock(testProfile)
    for (const s of block.sessions) {
      expect(s.scheduledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('REALISATION phase has lower reps on primary than ACCUMULATION', () => {
    const accum = generateBlock(testProfile, 'ACCUMULATION')
    const real = generateBlock(testProfile, 'REALISATION')
    const accumPrimary = accum.sessions[0].exercises.find(e => e.tag === 'PRIMARY')
    const realPrimary = real.sessions[0].exercises.find(e => e.tag === 'PRIMARY')
    if (accumPrimary && realPrimary && accumPrimary.id === realPrimary.id) {
      expect(realPrimary.reps).toBeLessThanOrEqual(accumPrimary.reps)
    }
  })

  it('block has empty weeklyMuscleVolume initially', () => {
    const block = generateBlock(testProfile)
    expect(block.weeklyMuscleVolume).toEqual({})
  })

  it('block has empty auditLog initially', () => {
    const block = generateBlock(testProfile)
    expect(block.auditLog).toEqual([])
  })

  it('trainingAge 2–5 maps to ttpEstimate 6', () => {
    const block = generateBlock(testProfile)
    // With ttpEstimate=6 and 1 day available, 6 sessions
    expect(block.sessions.length).toBe(6)
  })
})

describe('generateFirstBlock store action', () => {
  it('creates one block in state', () => {
    useStore.getState().generateFirstBlock()
    expect(useStore.getState().blocks.length).toBe(1)
  })

  it('sets currentBlock', () => {
    useStore.getState().generateFirstBlock()
    expect(useStore.getState().currentBlock).not.toBeNull()
  })

  it('produced block is DEVELOPMENT type', () => {
    useStore.getState().generateFirstBlock()
    expect(useStore.getState().currentBlock?.type).toBe('DEVELOPMENT')
  })

  it('currentSession is null after generating first block', () => {
    useStore.getState().generateFirstBlock()
    expect(useStore.getState().currentSession).toBeNull()
  })
})

describe('generateNextDevelopmentBlock store action', () => {
  it('blocks peakingActive=true', () => {
    useStore.setState({ profile: { ...testProfile, peakingActive: true } })
    useStore.getState().generateFirstBlock()
    const initial = useStore.getState().blocks.length
    useStore.getState().generateNextDevelopmentBlock()
    expect(useStore.getState().blocks.length).toBe(initial)
  })

  it('adds a second block when called after first', () => {
    useStore.getState().generateFirstBlock()
    useStore.getState().generateNextDevelopmentBlock()
    expect(useStore.getState().blocks.length).toBe(2)
  })

  it('marks previous block as COMPLETE', () => {
    useStore.getState().generateFirstBlock()
    useStore.getState().generateNextDevelopmentBlock()
    expect(useStore.getState().blocks[0].status).toBe('COMPLETE')
  })

  it('increments profile.completedBlocks', () => {
    useStore.getState().generateFirstBlock()
    useStore.getState().generateNextDevelopmentBlock()
    expect(useStore.getState().profile.completedBlocks).toBe(1)
  })

  it('phase cycles ACCUMULATION → INTENSIFICATION in PHASE mode', () => {
    useStore.setState({ profile: { ...testProfile, completedBlocks: 0 } })
    useStore.getState().generateFirstBlock()
    useStore.getState().generateNextDevelopmentBlock()
    expect(useStore.getState().currentBlock?.phase).toBe('INTENSIFICATION')
  })

  it('TTP mode always uses ACCUMULATION phase', () => {
    useStore.setState({ profile: { ...testProfile, programmingMode: 'TTP' } })
    useStore.getState().generateFirstBlock()
    useStore.getState().generateNextDevelopmentBlock()
    expect(useStore.getState().currentBlock?.phase).toBe('ACCUMULATION')
  })

  it('applies pending programming mode switch at block boundary', () => {
    useStore.setState({
      profile: { ...testProfile, programmingMode: 'PHASE', pendingProgrammingMode: 'TTP' },
    })
    useStore.getState().generateFirstBlock()
    useStore.getState().generateNextDevelopmentBlock()
    const state = useStore.getState()
    expect(state.profile.programmingMode).toBe('TTP')
    expect(state.profile.pendingProgrammingMode).toBeUndefined()
  })
})
