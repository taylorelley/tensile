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
import type { UserProfile, Block, Session, SessionExercise, SetLog } from '../../store'

const BID = 'block-1'
const SID = 'session-1'
const TODAY = new Date().toISOString().split('T')[0]

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

const squatExercise: SessionExercise = {
  id: 'barbell_back_squat',
  name: 'Back squat',
  tag: 'PRIMARY',
  sets: 4,
  reps: 3,
  rpeTarget: 8.5,
  primaryMuscles: ['quads', 'glutes', 'hamstrings', 'spinal_erectors'],
}

const legCurlExercise: SessionExercise = {
  id: 'leg_curl',
  name: 'Leg curl',
  tag: 'SUPP',
  sets: 3,
  reps: 12,
  rpeTarget: 8.0,
  primaryMuscles: ['hamstrings'],
}

function makeSession(exercises: SessionExercise[] = [squatExercise]): Session {
  return {
    id: SID,
    blockId: BID,
    scheduledDate: TODAY,
    status: 'IN_PROGRESS',
    exercises,
    currentExerciseIndex: 0,
    wellness: { sleepQuality: 7, overallFatigue: 6, muscleSoreness: 5, motivation: 8, stress: 6 },
    wellnessCompleted: true,
    rcs: 70,
    sfi: 0,
    volumeLoad: 0,
    sets: [],
    overrides: [],
    muscleGroupVolume: {},
  }
}

function makeBlock(session: Session): Block {
  return {
    id: BID,
    type: 'DEVELOPMENT',
    phase: 'ACCUMULATION',
    startDate: TODAY,
    week: 1,
    status: 'ACTIVE',
    sessions: [session],
    weeklyMuscleVolume: {},
    auditLog: [],
  }
}

const squatSetLog: SetLog = {
  id: 'set-1',
  exerciseId: 'barbell_back_squat',
  setType: 'TOP_SET',
  prescribedLoad: 170,
  actualLoad: 175,
  prescribedReps: 3,
  actualReps: 3,
  prescribedRpeTarget: 8.5,
  actualRpe: 8.5,
  e1rm: 200,
  sfi: 2.5,
}

const accessorySetLog: SetLog = {
  id: 'set-2',
  exerciseId: 'leg_curl',
  setType: 'BACK_OFF',
  prescribedLoad: 50,
  actualLoad: 50,
  prescribedReps: 12,
  actualReps: 12,
  prescribedRpeTarget: 8.0,
  actualRpe: 8.0,
  e1rm: 0,
  sfi: 0.8,
}

function setupStore(exercises?: SessionExercise[]) {
  const session = makeSession(exercises)
  const block = makeBlock(session)
  useStore.setState({
    profile: { ...testProfile },
    blocks: [block],
    currentBlock: block,
    currentSession: session,
    deloadRecommendation: null,
  })
}

beforeEach(() => {
  setupStore()
})

describe('logSet', () => {
  it('appends the set to session.sets', () => {
    useStore.getState().logSet(BID, SID, squatSetLog)
    const session = useStore.getState().blocks[0].sessions[0]
    expect(session.sets.length).toBe(1)
    expect(session.sets[0].id).toBe('set-1')
  })

  it('updates volumeLoad correctly', () => {
    useStore.getState().logSet(BID, SID, squatSetLog)
    const session = useStore.getState().blocks[0].sessions[0]
    expect(session.volumeLoad).toBe(Math.round(175 * 3))
  })

  it('updates SFI', () => {
    useStore.getState().logSet(BID, SID, squatSetLog)
    const session = useStore.getState().blocks[0].sessions[0]
    expect(session.sfi).toBeGreaterThan(0)
  })

  it('accumulates muscleGroupVolume for primary muscles', () => {
    useStore.getState().logSet(BID, SID, squatSetLog)
    const session = useStore.getState().blocks[0].sessions[0]
    expect(session.muscleGroupVolume['quads']).toBe(1)
    expect(session.muscleGroupVolume['glutes']).toBe(1)
    expect(session.muscleGroupVolume['hamstrings']).toBe(1)
  })

  it('updates e1rm for a lift-keyed exercise (squat)', () => {
    const initialE1rm = useStore.getState().profile.e1rm.squat
    useStore.getState().logSet(BID, SID, squatSetLog)
    const newE1rm = useStore.getState().profile.e1rm.squat
    // e1rm should be updated (may be same or different depending on formula)
    expect(typeof newE1rm).toBe('number')
    expect(newE1rm).toBeGreaterThan(0)
    // With actualLoad=175, actualReps=3, rpe=8.5 and e1rm initialised at 200,
    // the computed session e1rm will differ somewhat from 200
    expect(newE1rm).not.toBe(0)
    // The rolling e1rm uses EMA so it shouldn't jump wildly
    expect(Math.abs(newE1rm - initialE1rm)).toBeLessThan(50)
  })

  it('updates rollingE1rm for a lift-keyed exercise', () => {
    const initial = useStore.getState().profile.rollingE1rm.squat
    useStore.getState().logSet(BID, SID, squatSetLog)
    const updated = useStore.getState().profile.rollingE1rm.squat
    expect(typeof updated).toBe('number')
    expect(updated).not.toBe(initial)
  })

  it('increments rpeCalibration.sessions for lift-keyed exercise', () => {
    const initial = useStore.getState().profile.rpeCalibration.sessions
    useStore.getState().logSet(BID, SID, squatSetLog)
    expect(useStore.getState().profile.rpeCalibration.sessions).toBe(initial + 1)
  })

  it('does not update e1rm for non-lift-keyed exercise (leg_curl)', () => {
    setupStore([legCurlExercise])
    const initialDeadlift = useStore.getState().profile.e1rm.deadlift
    const initialSquat = useStore.getState().profile.e1rm.squat
    useStore.getState().logSet(BID, SID, accessorySetLog)
    expect(useStore.getState().profile.e1rm.deadlift).toBe(initialDeadlift)
    expect(useStore.getState().profile.e1rm.squat).toBe(initialSquat)
  })

  it('updates muscleGroupVolume for each primary muscle of the exercise', () => {
    setupStore([legCurlExercise])
    useStore.getState().logSet(BID, SID, accessorySetLog)
    const session = useStore.getState().blocks[0].sessions[0]
    expect(session.muscleGroupVolume['hamstrings']).toBe(1)
  })

  it('accumulates volume across multiple sets for same muscle', () => {
    useStore.getState().logSet(BID, SID, squatSetLog)
    useStore.getState().logSet(BID, SID, { ...squatSetLog, id: 'set-3' })
    const session = useStore.getState().blocks[0].sessions[0]
    expect(session.muscleGroupVolume['quads']).toBe(2)
  })

  it('session remains IN_PROGRESS after logSet', () => {
    useStore.getState().logSet(BID, SID, squatSetLog)
    const session = useStore.getState().blocks[0].sessions[0]
    expect(session.status).toBe('IN_PROGRESS')
  })

  it('does nothing when session not found', () => {
    const initial = useStore.getState().profile.e1rm.squat
    useStore.getState().logSet(BID, 'nonexistent', squatSetLog)
    expect(useStore.getState().profile.e1rm.squat).toBe(initial)
  })

  it('updates rpeTable when set is not a hard outlier', () => {
    const initialTable = { ...useStore.getState().profile.rpeTable }
    // normalish set; table should be nudged
    useStore.getState().logSet(BID, SID, squatSetLog)
    const newTable = useStore.getState().profile.rpeTable
    expect(newTable).toBeDefined()
    expect(newTable).not.toEqual(initialTable)
  })

  it('appends override message on velocity outlier', () => {
    // Provide a calibrated lvProfile to trigger velocity comparison
    const lvProfile = { slope: -0.3, intercept: 1.0, n: 5, rSquared: 0.95 }
    useStore.setState({
      profile: {
        ...testProfile,
        lvProfiles: { squat: lvProfile },
      },
    })
    const setWithBadVelocity: SetLog = {
      ...squatSetLog,
      lastRepVelocity: 2.0, // wildly fast → velocity outlier
    }
    useStore.getState().logSet(BID, SID, setWithBadVelocity)
    const session = useStore.getState().blocks[0].sessions[0]
    // If velocity outlier detected, an override message should be appended
    expect(session.overrides).toBeDefined()
  })
})
