// Replay harness entry point. Given a fixture and an optional constants
// override, returns the metric suite. Production engine state is reset before
// and after each run so harness invocations do not bleed into one another.
import { resetConstants, setConstants } from '../src/engine';
import { runAllMetrics, type Metric } from './metrics';
import type { ReplayFixture } from './types';
import type { EngineConstants } from './constants';

export interface ReplayResult {
  fixtureId: string;
  metrics: Metric[];
  ranAt: string;
}

export function runReplay(
  fixture: ReplayFixture,
  fixtureId: string,
  overrides?: Partial<EngineConstants>,
): ReplayResult {
  resetConstants();
  if (overrides) setConstants(overrides);
  const metrics = runAllMetrics(fixture);
  resetConstants();
  return { fixtureId, metrics, ranAt: new Date().toISOString() };
}
