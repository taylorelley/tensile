// Command-line entry for the replay harness. Run via `npx tsx replay/cli.ts`.
// Flags:
//   --fixture <name>      synthetic fixture: linearGain | stall | falsePeak | noisy
//   --file <path>         JSON fixture on disk (overrides --fixture)
//   --grid <path>         JSON grid spec: { axes: { rpeAlpha: [0.05,0.1,0.15] } }
//   --golden <path>       golden metrics JSON for the gate
//   --fail-on-regression  exit non-zero when any metric drifts > tolerance
//   --tolerance <num>     fractional tolerance (default 0.05)
//   --write-golden <path> write current metrics as the new golden
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runReplay } from './harness.ts';
import { linearGain, stall, falsePeak, noisy } from './fixtures/synth.ts';
import type { ReplayFixture } from './types.ts';
import { DEFAULT_CONSTANTS, type EngineConstants } from './constants.ts';

const args = process.argv.slice(2);

function arg(name: string): string | undefined {
  const idx = args.indexOf(name);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

function flag(name: string): boolean {
  return args.includes(name);
}

const SYNTH: Record<string, () => ReplayFixture> = {
  linearGain: () => linearGain(42),
  stall: () => stall(42),
  falsePeak: () => falsePeak(42),
  noisy: () => noisy(42),
};

function loadFixture(): { fixture: ReplayFixture; id: string } {
  const file = arg('--file');
  if (file) {
    const fixture = JSON.parse(readFileSync(resolve(file), 'utf8')) as ReplayFixture;
    return { fixture, id: file };
  }
  const name = arg('--fixture') ?? 'linearGain';
  const make = SYNTH[name];
  if (!make) {
    console.error(`Unknown synthetic fixture: ${name}. Available: ${Object.keys(SYNTH).join(', ')}`);
    process.exit(2);
  }
  return { fixture: make(), id: name };
}

const tolerance = Number(arg('--tolerance') ?? '0.05');

const { fixture, id } = loadFixture();

if (flag('--grid')) {
  const gridPath = arg('--grid');
  if (!gridPath) {
    console.error('--grid requires a path argument');
    process.exit(2);
  }
  const grid = JSON.parse(readFileSync(resolve(gridPath), 'utf8')) as { axes: Record<string, number[]> };
  const axes = Object.keys(grid.axes);
  const combinations: Partial<EngineConstants>[] = [];
  function expand(i: number, acc: Partial<EngineConstants>) {
    if (i === axes.length) { combinations.push({ ...acc }); return; }
    const key = axes[i];
    for (const v of grid.axes[key]) {
      expand(i + 1, { ...acc, [key]: v });
    }
  }
  expand(0, {});
  const rows: string[] = ['constants,' + (Object.keys(DEFAULT_CONSTANTS)).filter(k => axes.includes(k)).join(',') + ',rpeMAE,smoothness,overrideFreq,falsePeak,trimRate'];
  for (const overrides of combinations) {
    const result = runReplay(fixture, id, overrides);
    const m = Object.fromEntries(result.metrics.map(x => [x.name, x.value]));
    const overridesByKey = overrides as Record<string, unknown>;
    rows.push([
      JSON.stringify(overrides),
      ...axes.map(a => String(overridesByKey[a])),
      m.rpePredictionMAE.toFixed(4),
      m.e1rmSmoothness.toFixed(4),
      m.overrideFrequency.toFixed(4),
      m.falsePeakRate.toFixed(4),
      m.durationTrimIncidence.toFixed(4),
    ].join(','));
  }
  const out = `replay/out/grid-${id}-${Date.now()}.csv`;
  writeFileSync(out, rows.join('\n'));
  console.log(`Wrote ${combinations.length} rows to ${out}`);
  process.exit(0);
}

const result = runReplay(fixture, id);
console.log(JSON.stringify(result, null, 2));

const writeGoldenPath = arg('--write-golden');
if (writeGoldenPath) {
  const golden = Object.fromEntries(result.metrics.map(m => [m.name, m.value]));
  writeFileSync(resolve(writeGoldenPath), JSON.stringify({ fixtureId: id, golden, ranAt: result.ranAt }, null, 2));
  console.log(`Wrote golden to ${writeGoldenPath}`);
}

const goldenPath = arg('--golden');
if (goldenPath) {
  const golden = JSON.parse(readFileSync(resolve(goldenPath), 'utf8')) as { fixtureId: string; golden: Record<string, number> };
  const diffs: { name: string; current: number; golden: number; delta: number }[] = [];
  for (const m of result.metrics) {
    const g = golden.golden[m.name];
    if (g === undefined) continue;
    const denom = Math.max(Math.abs(g), 1e-6);
    const delta = Math.abs(m.value - g) / denom;
    diffs.push({ name: m.name, current: m.value, golden: g, delta });
  }
  const regressions = diffs.filter(d => d.delta > tolerance);
  console.log('\nGate report:');
  for (const d of diffs) {
    const tag = d.delta > tolerance ? 'FAIL' : 'OK';
    console.log(`  [${tag}] ${d.name}: current=${d.current.toFixed(4)} golden=${d.golden.toFixed(4)} delta=${(d.delta * 100).toFixed(2)}%`);
  }
  if (flag('--fail-on-regression') && regressions.length > 0) {
    console.error(`\n${regressions.length} metric(s) regressed beyond tolerance ${tolerance}.`);
    process.exit(1);
  }
}
