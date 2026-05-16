import { describe, it, expect } from 'vitest'
import { generatePeakingPlan } from '../../engine'

function futureDateWeeks(weeks: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + weeks * 7)
  return d
}

describe('generatePeakingPlan', () => {
  it('meetDate equals competitionDate', () => {
    const comp = futureDateWeeks(20)
    const plan = generatePeakingPlan(comp, 6)
    expect(plan.meetDate.toISOString().split('T')[0]).toBe(comp.toISOString().split('T')[0])
  })

  it('taperStart is 3 days before meetDate', () => {
    const comp = futureDateWeeks(20)
    const plan = generatePeakingPlan(comp, 6)
    const diff = Math.round((plan.meetDate.getTime() - plan.taperStart.getTime()) / (1000 * 60 * 60 * 24))
    expect(diff).toBe(3)
  })

  it('realisationStart is before taperStart', () => {
    const plan = generatePeakingPlan(futureDateWeeks(20), 6)
    expect(plan.realisationStart.getTime()).toBeLessThan(plan.taperStart.getTime())
  })

  it('pivotStart is before realisationStart', () => {
    const plan = generatePeakingPlan(futureDateWeeks(20), 6)
    expect(plan.pivotStart.getTime()).toBeLessThan(plan.realisationStart.getTime())
  })

  it('developmentStart is before pivotStart', () => {
    const plan = generatePeakingPlan(futureDateWeeks(20), 6)
    expect(plan.developmentStart.getTime()).toBeLessThan(plan.pivotStart.getTime())
  })

  it('feasible=true when competition is far enough in future', () => {
    const plan = generatePeakingPlan(futureDateWeeks(25), 8)
    expect(plan.feasible).toBe(true)
  })

  it('feasible=false when competition is too soon', () => {
    const plan = generatePeakingPlan(futureDateWeeks(2), 8)
    expect(plan.feasible).toBe(false)
  })

  it('weeksAvailable is roughly the number of weeks to competition', () => {
    const weeks = 20
    const plan = generatePeakingPlan(futureDateWeeks(weeks), 6)
    expect(plan.weeksAvailable).toBeGreaterThanOrEqual(weeks - 1)
    expect(plan.weeksAvailable).toBeLessThanOrEqual(weeks + 1)
  })

  it('default pivotWeeks: ttpEstimate=6 → max(1, min(3, round(6*0.33)))=2', () => {
    const plan = generatePeakingPlan(futureDateWeeks(20), 6)
    // pivot duration = 2 weeks
    const pivotDays = Math.round((plan.realisationStart.getTime() - plan.pivotStart.getTime()) / (1000 * 60 * 60 * 24))
    expect(pivotDays).toBe(14) // 2 * 7
  })

  it('default pivotWeeks: ttpEstimate=3 → max(1, min(3, round(1.0)))=1', () => {
    const plan = generatePeakingPlan(futureDateWeeks(20), 3)
    const pivotDays = Math.round((plan.realisationStart.getTime() - plan.pivotStart.getTime()) / (1000 * 60 * 60 * 24))
    expect(pivotDays).toBe(7) // 1 * 7
  })

  it('custom pivotWeeks parameter is respected', () => {
    const plan = generatePeakingPlan(futureDateWeeks(20), 6, 3)
    const pivotDays = Math.round((plan.realisationStart.getTime() - plan.pivotStart.getTime()) / (1000 * 60 * 60 * 24))
    expect(pivotDays).toBe(21) // 3 * 7
  })

  it('competitionDate in the past → weeksAvailable < 0 → feasible=false', () => {
    const past = new Date()
    past.setDate(past.getDate() - 14)
    const plan = generatePeakingPlan(past, 6)
    expect(plan.feasible).toBe(false)
  })
})
