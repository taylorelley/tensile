import { describe, it, expect } from 'vitest'
import { computeEwmaAclr, ewmaAclrSeries } from '../../engine'
import type { AclrInput } from '../../engine'

function dateStr(daysAgo: number): string {
  const d = new Date('2026-01-30')
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

const REF_DATE = new Date('2026-01-30')

describe('computeEwmaAclr', () => {
  it('empty sessions → zero result, calibrating', () => {
    const r = computeEwmaAclr([], REF_DATE)
    expect(r.acute).toBe(0)
    expect(r.chronic).toBe(0)
    expect(r.ratio).toBe(0)
    expect(r.calibrating).toBe(true)
  })

  it('calibrating=true when fewer than 14 days of history', () => {
    const sessions: AclrInput[] = [
      { date: dateStr(5), load: 100 },
      { date: dateStr(3), load: 100 },
    ]
    const r = computeEwmaAclr(sessions, REF_DATE)
    expect(r.calibrating).toBe(true)
  })

  it('calibrating=false when 14+ days of history', () => {
    const sessions: AclrInput[] = [
      { date: dateStr(20), load: 100 },
      { date: dateStr(10), load: 100 },
    ]
    const r = computeEwmaAclr(sessions, REF_DATE)
    expect(r.calibrating).toBe(false)
  })

  it('single session produces non-zero acute and chronic', () => {
    const sessions: AclrInput[] = [{ date: dateStr(0), load: 100 }]
    const r = computeEwmaAclr(sessions, REF_DATE)
    expect(r.acute).toBeGreaterThan(0)
    expect(r.chronic).toBeGreaterThan(0)
  })

  it('acute is always >= chronic for constant load from day 0 (faster EMA converges first)', () => {
    // After only a few days of constant load, acute (7-day EMA) should exceed chronic (28-day EMA)
    const sessions: AclrInput[] = [
      { date: dateStr(5), load: 200 },
      { date: dateStr(4), load: 200 },
      { date: dateStr(3), load: 200 },
      { date: dateStr(2), load: 200 },
      { date: dateStr(1), load: 200 },
      { date: dateStr(0), load: 200 },
    ]
    const r = computeEwmaAclr(sessions, REF_DATE)
    expect(r.acute).toBeGreaterThan(r.chronic)
  })

  it('ratio = 0 when chronic = 0', () => {
    // No history before today → chronic never accumulates enough
    // With a single session today, chronic is small but nonzero after EWMA
    const r = computeEwmaAclr([], REF_DATE)
    expect(r.ratio).toBe(0)
  })

  it('ratio > 0 when there are sessions', () => {
    const sessions: AclrInput[] = [
      { date: dateStr(10), load: 150 },
      { date: dateStr(5), load: 150 },
      { date: dateStr(2), load: 150 },
    ]
    const r = computeEwmaAclr(sessions, REF_DATE)
    expect(r.ratio).toBeGreaterThan(0)
  })

  it('multiple sessions on same day: loads are summed', () => {
    const single: AclrInput[] = [{ date: dateStr(0), load: 200 }]
    const double: AclrInput[] = [
      { date: dateStr(0), load: 100 },
      { date: dateStr(0), load: 100 },
    ]
    const r1 = computeEwmaAclr(single, REF_DATE)
    const r2 = computeEwmaAclr(double, REF_DATE)
    expect(r1.acute).toBeCloseTo(r2.acute, 5)
  })

  it('increasing load over time raises ratio', () => {
    const low: AclrInput[] = [
      { date: dateStr(14), load: 50 },
      { date: dateStr(7), load: 50 },
      { date: dateStr(3), load: 50 },
    ]
    const ramp: AclrInput[] = [
      { date: dateStr(14), load: 50 },
      { date: dateStr(7), load: 100 },
      { date: dateStr(3), load: 200 },
    ]
    const r1 = computeEwmaAclr(low, REF_DATE)
    const r2 = computeEwmaAclr(ramp, REF_DATE)
    expect(r2.ratio).toBeGreaterThan(r1.ratio)
  })
})

describe('ewmaAclrSeries', () => {
  it('empty sessions → empty ratios', () => {
    const r = ewmaAclrSeries([], REF_DATE)
    expect(r.ratios).toEqual([])
    expect(r.calibratingDays).toBe(0)
  })

  it('ratios array length equals total days from first session to reference', () => {
    const sessions: AclrInput[] = [
      { date: dateStr(10), load: 100 },
      { date: dateStr(5), load: 100 },
    ]
    const r = ewmaAclrSeries(sessions, REF_DATE)
    expect(r.ratios.length).toBe(11) // 10 days ago through today = 11 days
  })

  it('calibratingDays = min(14, totalDays)', () => {
    const sessions: AclrInput[] = [{ date: dateStr(5), load: 100 }]
    const r = ewmaAclrSeries(sessions, REF_DATE)
    expect(r.calibratingDays).toBe(6) // 5 days ago through today = 6 days

    const long: AclrInput[] = [{ date: dateStr(30), load: 100 }]
    const r2 = ewmaAclrSeries(long, REF_DATE)
    expect(r2.calibratingDays).toBe(14)
  })

  it('ratios are non-negative', () => {
    const sessions: AclrInput[] = [
      { date: dateStr(7), load: 100 },
      { date: dateStr(3), load: 150 },
    ]
    const r = ewmaAclrSeries(sessions, REF_DATE)
    for (const ratio of r.ratios) {
      expect(ratio).toBeGreaterThanOrEqual(0)
    }
  })
})
