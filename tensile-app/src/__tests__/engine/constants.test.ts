import { describe, it, expect, afterEach } from 'vitest'
import {
  getConstants,
  setConstants,
  resetConstants,
  DEFAULT_CONSTANTS,
} from '../../engine'

afterEach(() => {
  resetConstants()
})

describe('getConstants / setConstants / resetConstants', () => {
  it('returns default constants initially', () => {
    const c = getConstants()
    expect(c.e1rmAlpha).toBe(0.12)
    expect(c.rpeAlpha).toBe(0.10)
    expect(c.peakDeclineWeeks).toBe(2)
    expect(c.aclrThreshold).toBe(1.5)
  })

  it('partial override changes only specified key', () => {
    setConstants({ e1rmAlpha: 0.5 })
    const c = getConstants()
    expect(c.e1rmAlpha).toBe(0.5)
    expect(c.rpeAlpha).toBe(DEFAULT_CONSTANTS.rpeAlpha)
    expect(c.peakDeclineWeeks).toBe(DEFAULT_CONSTANTS.peakDeclineWeeks)
  })

  it('nested deloadWeights override propagates', () => {
    setConstants({ deloadWeights: { ...DEFAULT_CONSTANTS.deloadWeights, peak: 99 } })
    expect(getConstants().deloadWeights.peak).toBe(99)
    expect(getConstants().deloadWeights.stall).toBe(DEFAULT_CONSTANTS.deloadWeights.stall)
  })

  it('resetConstants restores all defaults', () => {
    setConstants({ e1rmAlpha: 0.99, rpeAlpha: 0.99, aclrThreshold: 5 })
    resetConstants()
    const c = getConstants()
    expect(c.e1rmAlpha).toBe(DEFAULT_CONSTANTS.e1rmAlpha)
    expect(c.rpeAlpha).toBe(DEFAULT_CONSTANTS.rpeAlpha)
    expect(c.aclrThreshold).toBe(DEFAULT_CONSTANTS.aclrThreshold)
  })

  it('sequential overrides accumulate correctly', () => {
    setConstants({ e1rmAlpha: 0.5 })
    setConstants({ rpeAlpha: 0.8 })
    const c = getConstants()
    expect(c.e1rmAlpha).toBe(0.5)
    expect(c.rpeAlpha).toBe(0.8)
  })

  it('reset then re-override starts from defaults', () => {
    setConstants({ e1rmAlpha: 0.5 })
    resetConstants()
    setConstants({ e1rmAlpha: 0.25 })
    expect(getConstants().e1rmAlpha).toBe(0.25)
    expect(getConstants().rpeAlpha).toBe(DEFAULT_CONSTANTS.rpeAlpha)
  })

  it('DEFAULT_CONSTANTS is a stable export (not mutated by setConstants)', () => {
    const originalAlpha = DEFAULT_CONSTANTS.e1rmAlpha
    setConstants({ e1rmAlpha: 0.99 })
    expect(DEFAULT_CONSTANTS.e1rmAlpha).toBe(originalAlpha)
  })
})
