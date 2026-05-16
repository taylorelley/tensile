// Replay-harness constant management. Wraps the engine's `setConstants` so the
// harness can run sweeps without touching production code.
import { DEFAULT_CONSTANTS, setConstants, resetConstants, getConstants, type EngineConstants } from '../src/engine';

export { DEFAULT_CONSTANTS, type EngineConstants };

/** Apply a partial override on top of defaults for the duration of a run. */
export function withConstants(overrides: Partial<EngineConstants>): EngineConstants {
  resetConstants();
  setConstants(overrides);
  return getConstants();
}

/** Stable hash of a constants object (insertion-order independent). Used as
 *  the cache key when writing CSV outputs for grid sweeps. */
export function hashConstants(c: EngineConstants): string {
  const sortedKeys = Object.keys(c).sort();
  const serialised = sortedKeys.map((k) => `${k}=${JSON.stringify((c as Record<string, unknown>)[k])}`).join('|');
  let hash = 0;
  for (let i = 0; i < serialised.length; i++) {
    hash = ((hash << 5) - hash + serialised.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
