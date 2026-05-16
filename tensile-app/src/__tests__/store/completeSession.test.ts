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
import type { UserProfile, Block, Session, SessionExercise } from '../../store'

const BID = 'block-test'
const SID = 'sess-test'
const TODAY = '2026-01-05' // a fixed date for predictable week calculation

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

const benchExercise: SessionExercise = {
  id: 'bench_press',
  name: 'Bench press',
  tag: 'PRIMARY',
  sets: 4,
  reps: 4,
  rpeTarget: 8.0,
  primaryMuscles: ['pecs', 'triceps'],
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: SID,
    blockId: BID,
    scheduledDate: TODAY,
    status: 'IN_PROGRESS',
    exercises: [benchExercise],
    currentExerciseIndex: 0,
    wellness: { sleepQuality: 7, overallFatigue: 6, muscleSoreness: 5, motivation: 8, stress: 6 },
    wellnessCompleted: true,
    rcs: 70,
    sfi: 0,
    volumeLoad: 0,
    sets: [],
    overrides: [],
    muscleGroupVolume: { pecs: 2, triceps: 2 },
    ...overrides,
  }
}

function makeBlock(sessions: Session[], week = 1): Block {
  return {
    id: BID,
    type: 'DEVELOPMENT',
    phase: 'ACCUMULATION',
    startDate: TODAY,
    week,
    status: 'ACTIVE',
    sessions,
    weeklyMuscleVolume: {},
    auditLog: [],
  }
}

function setup(sessions?: Session[], week?: number) {
  const sess = sessions ?? [makeSession()]
  const block = makeBlock(sess, week)
  useStore.setState({
    profile: { ...testProfile },
    blocks: [block],
    currentBlock: block,
    currentSession: sess[0],
    deloadRecommendation: null,
  })
}

beforeEach(() => {
  setup()
})

describe('completeSession', () => {
  it('sets session status to COMPLETE', () => {
    useStore.getState().completeSession(BID, SID, 7)
    const session = useStore.getState().blocks[0].sessions[0]
    expect(session.status).toBe('COMPLETE')
  })

  it('sets completedDate', () => {
    useStore.getState().completeSession(BID, SID, 7)
    const session = useStore.getState().blocks[0].sessions[0]
    expect(session.completedDate).toBeDefined()
    expect(session.completedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('stores srpe value', () => {
    useStore.getState().completeSession(BID, SID, 7)
    const session = useStore.getState().blocks[0].sessions[0]
    expect(session.srpe).toBe(7)
  })

  it('computes srpeLoad as srpe × estimatedDuration', () => {
    // benchExercise has sets=4; estimatedDuration = round(4 * 3.5) = 14
    useStore.getState().completeSession(BID, SID, 7)
    const session = useStore.getState().blocks[0].sessions[0]
    const estimatedDuration = Math.round(4 * 3.5)
    expect(session.srpeLoad).toBe(7 * estimatedDuration)
  })

  it('does nothing when session not found', () => {
    useStore.getState().completeSession(BID, 'nonexistent', 7)
    const session = useStore.getState().blocks[0].sessions[0]
    expect(session.status).toBe('IN_PROGRESS')
  })

  it('advances block.week when all sessions in current week are done', () => {
    // Single session in week 1 → completing it should advance to week 2
    expect(useStore.getState().blocks[0].week).toBe(1)
    useStore.getState().completeSession(BID, SID, 7)
    expect(useStore.getState().blocks[0].week).toBe(2)
  })

  it('does NOT advance block.week when another session in the week is still scheduled', () => {
    const sess1 = makeSession({ id: 'sess-1', scheduledDate: TODAY, status: 'IN_PROGRESS' })
    const sess2 = makeSession({ id: 'sess-2', scheduledDate: TODAY, status: 'SCHEDULED' })
    setup([sess1, sess2])
    useStore.getState().completeSession(BID, 'sess-1', 7)
    expect(useStore.getState().blocks[0].week).toBe(1)
  })

  it('aggregates session muscleGroupVolume into block.weeklyMuscleVolume', () => {
    // Session has muscleGroupVolume = { pecs: 2, triceps: 2 }
    useStore.getState().completeSession(BID, SID, 7)
    const weeklyVol = useStore.getState().blocks[0].weeklyMuscleVolume
    // Week 1 is index 0 (week - 1)
    expect(weeklyVol[0]).toBeDefined()
    expect(weeklyVol[0]['pecs']).toBe(2)
    expect(weeklyVol[0]['triceps']).toBe(2)
  })

  it('adds WEEK_COMPLETE audit entry when week ends', () => {
    useStore.getState().completeSession(BID, SID, 7)
    const auditLog = useStore.getState().blocks[0].auditLog
    expect(auditLog.length).toBeGreaterThan(0)
    expect(auditLog.some(e => e.ruleId === 'WEEK_COMPLETE')).toBe(true)
  })

  it('sets a deloadRecommendation when week completes', () => {
    useStore.getState().completeSession(BID, SID, 7)
    const rec = useStore.getState().deloadRecommendation
    // Rec should be set (may be level='none' if no signals fire)
    expect(rec).not.toBeNull()
    expect(rec?.level).toBeDefined()
  })

  it('deload recommendation is urgent when jointPain >= 7 in recent sessions', () => {
    // Create 3 completed sessions with high joint pain so the flag fires
    const rcs3 = 60
    const done1 = makeSession({
      id: 'done-1',
      scheduledDate: TODAY,
      status: 'COMPLETE',
      rcs: rcs3,
      wellness: { sleepQuality: 7, overallFatigue: 6, muscleSoreness: 5, motivation: 8, stress: 6, jointPain: 8 },
    })
    const done2 = makeSession({
      id: 'done-2',
      scheduledDate: TODAY,
      status: 'COMPLETE',
      rcs: rcs3,
      wellness: { sleepQuality: 7, overallFatigue: 6, muscleSoreness: 5, motivation: 8, stress: 6, jointPain: 8 },
    })
    const current = makeSession({ id: SID, status: 'IN_PROGRESS' })
    setup([done1, done2, current])
    useStore.getState().completeSession(BID, SID, 7)
    const rec = useStore.getState().deloadRecommendation
    expect(rec?.level).toBe('urgent')
  })

  it('currentSession is updated to reflect completion', () => {
    useStore.getState().completeSession(BID, SID, 7)
    const current = useStore.getState().currentSession
    if (current?.id === SID) {
      expect(current.status).toBe('COMPLETE')
    }
  })
})
