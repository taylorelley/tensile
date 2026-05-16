import { describe, it, expect } from 'vitest'
import {
  calculateDeloadScore,
  deloadRecommendation,
  DEFAULT_CONSTANTS,
  setConstants,
} from '../../engine'
import type { DeloadSignals } from '../../engine'

const noSignals: DeloadSignals = {
  peakDetected: false,
  stallDetected: false,
  wellnessSustainedLow: false,
  rpeDrift: false,
  hrvTrendLow: false,
  aclrFlag: false,
  jointPainFlag: false,
  ttpExceeded: false,
}

describe('calculateDeloadScore', () => {
  it('all signals false → score 0', () => {
    expect(calculateDeloadScore(noSignals)).toBe(0)
  })

  it('peakDetected only → score = w.peak', () => {
    const score = calculateDeloadScore({ ...noSignals, peakDetected: true })
    expect(score).toBe(DEFAULT_CONSTANTS.deloadWeights.peak)
  })

  it('stallDetected only → score = w.stall', () => {
    const score = calculateDeloadScore({ ...noSignals, stallDetected: true })
    expect(score).toBe(DEFAULT_CONSTANTS.deloadWeights.stall)
  })

  it('performance cluster uses cluster-max: peak + stall → max(5, 4) = 5', () => {
    const score = calculateDeloadScore({ ...noSignals, peakDetected: true, stallDetected: true })
    expect(score).toBe(DEFAULT_CONSTANTS.deloadWeights.peak) // max(5,4) = 5
  })

  it('rpeDrift only → score = w.rpeDrift', () => {
    const score = calculateDeloadScore({ ...noSignals, rpeDrift: true })
    expect(score).toBe(DEFAULT_CONSTANTS.deloadWeights.rpeDrift)
  })

  it('ttpExceeded only → score = w.ttp', () => {
    const score = calculateDeloadScore({ ...noSignals, ttpExceeded: true })
    expect(score).toBe(DEFAULT_CONSTANTS.deloadWeights.ttp)
  })

  it('all performance signals → cluster-max of (peak=5, stall=4, rpeDrift=3, ttp=4) = 5', () => {
    const score = calculateDeloadScore({ ...noSignals, peakDetected: true, stallDetected: true, rpeDrift: true, ttpExceeded: true })
    expect(score).toBe(5) // max of performance cluster only (no recovery/load signals)
  })

  it('wellnessSustainedLow only → score = w.wellness', () => {
    const score = calculateDeloadScore({ ...noSignals, wellnessSustainedLow: true })
    expect(score).toBe(DEFAULT_CONSTANTS.deloadWeights.wellness)
  })

  it('hrvTrendLow only → score = w.hrv', () => {
    const score = calculateDeloadScore({ ...noSignals, hrvTrendLow: true })
    expect(score).toBe(DEFAULT_CONSTANTS.deloadWeights.hrv)
  })

  it('recovery cluster max: wellness + hrv → max(4, 2) = 4', () => {
    const score = calculateDeloadScore({ ...noSignals, wellnessSustainedLow: true, hrvTrendLow: true })
    expect(score).toBe(DEFAULT_CONSTANTS.deloadWeights.wellness)
  })

  it('aclrFlag → adds w.aclr independently', () => {
    const score = calculateDeloadScore({ ...noSignals, aclrFlag: true })
    expect(score).toBe(DEFAULT_CONSTANTS.deloadWeights.aclr)
  })

  it('all signals (except jointPain) → performance(5) + recovery(4) + aclr(1) = 10', () => {
    const score = calculateDeloadScore({
      peakDetected: true, stallDetected: true, wellnessSustainedLow: true,
      rpeDrift: true, hrvTrendLow: true, aclrFlag: true,
      jointPainFlag: false, ttpExceeded: true,
    })
    expect(score).toBe(10)
  })

  it('custom weights via setConstants', () => {
    setConstants({ deloadWeights: { ...DEFAULT_CONSTANTS.deloadWeights, peak: 10 } })
    const score = calculateDeloadScore({ ...noSignals, peakDetected: true })
    expect(score).toBe(10)
  })

  it('jointPainFlag does not contribute to score (handled in recommendation)', () => {
    const withJoint = calculateDeloadScore({ ...noSignals, jointPainFlag: true })
    const withoutJoint = calculateDeloadScore(noSignals)
    expect(withJoint).toBe(withoutJoint)
  })
})

describe('deloadRecommendation', () => {
  it('jointPainFlag → urgent level regardless of score', () => {
    const r = deloadRecommendation(0, { ...noSignals, jointPainFlag: true })
    expect(r.level).toBe('urgent')
  })

  it('jointPainFlag overrides even high score', () => {
    const r = deloadRecommendation(100, { ...noSignals, jointPainFlag: true })
    expect(r.level).toBe('urgent')
  })

  it('score >= strong threshold → strong', () => {
    const r = deloadRecommendation(DEFAULT_CONSTANTS.deloadTiers.strong, noSignals)
    expect(r.level).toBe('strong')
  })

  it('score >= moderate threshold → moderate', () => {
    const r = deloadRecommendation(DEFAULT_CONSTANTS.deloadTiers.moderate, noSignals)
    expect(r.level).toBe('moderate')
  })

  it('score >= light threshold → light', () => {
    const r = deloadRecommendation(DEFAULT_CONSTANTS.deloadTiers.light, noSignals)
    expect(r.level).toBe('light')
  })

  it('score below light → none', () => {
    const r = deloadRecommendation(DEFAULT_CONSTANTS.deloadTiers.light - 1, noSignals)
    expect(r.level).toBe('none')
  })

  it('score 0 → none', () => {
    const r = deloadRecommendation(0, noSignals)
    expect(r.level).toBe('none')
    expect(r.message).toBeTruthy()
  })

  it('all levels return a non-empty message', () => {
    const levels = [
      deloadRecommendation(0, noSignals),
      deloadRecommendation(3, noSignals),
      deloadRecommendation(5, noSignals),
      deloadRecommendation(8, noSignals),
      deloadRecommendation(0, { ...noSignals, jointPainFlag: true }),
    ]
    for (const r of levels) {
      expect(r.message.length).toBeGreaterThan(0)
    }
  })

  it('custom deload tiers via setConstants shift thresholds', () => {
    setConstants({ deloadTiers: { strong: 15, moderate: 10, light: 5 } })
    expect(deloadRecommendation(8, noSignals).level).toBe('light')
    expect(deloadRecommendation(10, noSignals).level).toBe('moderate')
    expect(deloadRecommendation(15, noSignals).level).toBe('strong')
  })
})
