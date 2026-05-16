# Tensile replay harness

Replays the engine over a recorded or synthetic training history with a
candidate set of constants, then computes a numeric metric suite.

## Usage

Synthetic linear-gain fixture, default constants:

```
npm run replay
```

Stall fixture:

```
npm run replay -- --fixture stall
```

Grid sweep on RPE α:

```
echo '{ "axes": { "rpeAlpha": [0.05, 0.10, 0.15, 0.20] } }' > replay/grids/rpe-alpha.json
npm run replay:grid -- --fixture linearGain --grid replay/grids/rpe-alpha.json
```

Gate against the committed golden file:

```
npm run replay:gate
```

The gate exits non-zero if any metric drifts more than 5% from
`replay/golden.json`. Constants changes that move the golden must commit the
updated `golden.json` alongside the change. Write a new golden with:

```
npm run replay -- --fixture linearGain --write-golden replay/golden.json
```

## Metrics

| metric | meaning | direction |
|---|---|---|
| `rpePredictionMAE` | mean absolute error between RPE-table-predicted %1RM and observed %1RM | lower is better |
| `e1rmSmoothness` | sum of squared second differences of the rolling-EMA e1RM series, normalised | lower is smoother |
| `overrideFrequency` | fraction of completed sessions with an `OVERRIDE_*` audit entry | lower is better |
| `falsePeakRate` | fraction of detected peaks that were followed by continued progress | lower is better |
| `durationTrimIncidence` | fraction of sessions where the duration cap forced a trim | lower means session times are well-calibrated |

## Fixtures

- `fixtures/synth.ts` — seeded generators (`linearGain`, `stall`, `falsePeak`, `noisy`)
- `fixtures/synth/*.json` — exported synthetic fixtures (versioned)
- `fixtures/recorded/` — sanitised recordings exported from a real device
  (gitignored except for designated samples; dob stripped, bodyweight rounded)

## CI

There is no CI gate: this is a single-device app with no server cohort. The
replay harness is a local pre-release tool. Use `npm run replay:gate` before
opening a release PR.
