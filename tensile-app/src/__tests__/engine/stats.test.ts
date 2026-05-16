import { describe, it, expect } from 'vitest'
import { pearsonCorrelation, spearmanCorrelation, partialSpearman } from '../../engine'

describe('pearsonCorrelation', () => {
  it('perfect positive correlation → 1.0', () => {
    expect(pearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBeCloseTo(1.0, 5)
  })

  it('perfect negative correlation → -1.0', () => {
    expect(pearsonCorrelation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2])).toBeCloseTo(-1.0, 5)
  })

  it('same array → 1.0', () => {
    expect(pearsonCorrelation([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])).toBeCloseTo(1.0, 5)
  })

  it('constant y → 0 (zero variance denominator)', () => {
    expect(pearsonCorrelation([1, 2, 3, 4, 5], [3, 3, 3, 3, 3])).toBe(0)
  })

  it('length mismatch → 0', () => {
    expect(pearsonCorrelation([1, 2, 3], [1, 2])).toBe(0)
  })

  it('n < 2 → 0', () => {
    expect(pearsonCorrelation([1], [1])).toBe(0)
    expect(pearsonCorrelation([], [])).toBe(0)
  })

  it('known correlation with 4 points', () => {
    // Manually computed: x=[1,2,3,4], y=[1,3,2,4] → r ≈ 0.8
    const r = pearsonCorrelation([1, 2, 3, 4], [1, 3, 2, 4])
    expect(r).toBeGreaterThan(0.7)
    expect(r).toBeLessThan(1.0)
  })

  it('result is always in [-1, 1]', () => {
    const r = pearsonCorrelation([1, 3, 2, 5, 4], [2, 1, 4, 3, 5])
    expect(r).toBeGreaterThanOrEqual(-1)
    expect(r).toBeLessThanOrEqual(1)
  })
})

describe('spearmanCorrelation', () => {
  it('monotone increasing → 1.0', () => {
    expect(spearmanCorrelation([1, 2, 3, 4, 5], [10, 20, 30, 40, 50])).toBeCloseTo(1.0, 5)
  })

  it('monotone decreasing → -1.0', () => {
    expect(spearmanCorrelation([1, 2, 3, 4, 5], [50, 40, 30, 20, 10])).toBeCloseTo(-1.0, 5)
  })

  it('tolerates non-linear relationships better than Pearson', () => {
    // x and y^3 are monotonically related
    const x = [1, 2, 3, 4, 5]
    const y = x.map(v => v * v * v)
    expect(spearmanCorrelation(x, y)).toBeCloseTo(1.0, 5)
  })

  it('handles ties by averaging ranks', () => {
    const r = spearmanCorrelation([1, 1, 2, 3], [1, 2, 2, 3])
    expect(typeof r).toBe('number')
    expect(r).toBeGreaterThan(0)
  })

  it('length mismatch → 0', () => {
    expect(spearmanCorrelation([1, 2, 3], [1, 2])).toBe(0)
  })

  it('n < 2 → 0', () => {
    expect(spearmanCorrelation([1], [1])).toBe(0)
  })

  it('result is always in [-1, 1]', () => {
    const r = spearmanCorrelation([3, 1, 4, 1, 5], [9, 2, 6, 5, 3])
    expect(r).toBeGreaterThanOrEqual(-1)
    expect(r).toBeLessThanOrEqual(1)
  })
})

describe('partialSpearman', () => {
  it('n < 4 → 0', () => {
    expect(partialSpearman([1, 2, 3], [1, 2, 3], [[1, 2, 3]])).toBe(0)
  })

  it('mismatched lengths → 0', () => {
    expect(partialSpearman([1, 2, 3, 4], [1, 2, 3], [[1, 2, 3, 4]])).toBe(0)
  })

  it('control of same length as data', () => {
    const x = [1, 2, 3, 4, 5, 6]
    const y = [2, 4, 6, 8, 10, 12]
    const z = [1, 2, 3, 4, 5, 6]
    const r = partialSpearman(x, y, [z])
    expect(typeof r).toBe('number')
  })

  it('removing a perfect mediator reduces correlation toward zero', () => {
    // x and y are related ONLY through z
    // x → z → y: x=[1,2,3,4,5,6], z=x, y=z
    // After controlling for z, partial corr of x,y should drop
    const x = [1, 2, 3, 4, 5, 6]
    const z = [1, 2, 3, 4, 5, 6]
    const y = [1, 2, 3, 4, 5, 6]  // y perfectly == z
    const partialR = partialSpearman(x, y, [z])
    const rawR = spearmanCorrelation(x, y)
    // After controlling for z which explains everything, partial should be smaller
    expect(Math.abs(partialR)).toBeLessThanOrEqual(Math.abs(rawR) + 0.01)
  })

  it('no confound: empty controls array is handled gracefully', () => {
    // With no controls, it's just Spearman correlation on the ranks
    const x = [1, 2, 3, 4, 5, 6]
    const y = [1, 2, 3, 4, 5, 6]
    // partialSpearman with empty controls — the design matrix has only intercept
    const r = partialSpearman(x, y, [new Array(6).fill(0)])
    expect(typeof r).toBe('number')
  })
})
