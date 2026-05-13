import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import type { Session } from '../../store';
import { Phone, TabBar, T, Chart, Spark } from '../../shared';

function weeklyBestE1rm(
  sessions: Session[],
  startDate: string,
  exerciseIds: string[]
): number[] {
  const start = new Date(startDate).getTime();
  const weekMap = new Map<number, number[]>();
  for (const s of sessions) {
    const daysSince = Math.floor(
      (new Date(s.scheduledDate).getTime() - start) / (1000 * 60 * 60 * 24)
    );
    const week = Math.floor(daysSince / 7);
    const matching = s.sets.filter((set) => exerciseIds.includes(set.exerciseId));
    if (matching.length > 0) {
      if (!weekMap.has(week)) weekMap.set(week, []);
      weekMap.get(week)!.push(Math.max(...matching.map((set) => set.e1rm)));
    }
  }
  if (weekMap.size === 0) return [];
  const maxWeek = Math.max(...Array.from(weekMap.keys()));
  return Array.from({ length: maxWeek + 1 }, (_, i) => {
    const vals = weekMap.get(i);
    return vals && vals.length > 0 ? Math.max(...vals) : 0;
  });
}

const HARDCODED_SQUAT = [205, 209, 212, 215, 218, 217, 215];
const HARDCODED_BENCH = [140, 141, 143, 144, 146, 145, 144];
const HARDCODED_DEADLIFT = [232, 236, 240, 243, 246, 244, 240];

export default function Performance() {
  const navigate = useNavigate();
  const currentBlock = useStore((s) => s.currentBlock);
  const profile = useStore((s) => s.profile);

  const sessions = currentBlock?.sessions ?? [];
  const startDate = currentBlock?.startDate ?? '';

  let squatTrend = startDate
    ? weeklyBestE1rm(sessions, startDate, ['barbell_back_squat'])
    : [];
  let benchTrend = startDate
    ? weeklyBestE1rm(sessions, startDate, ['bench_press'])
    : [];
  let deadliftTrend = startDate
    ? weeklyBestE1rm(sessions, startDate, ['conventional_deadlift'])
    : [];

  const squatHasData = squatTrend.some((v) => v > 0);
  const benchHasData = benchTrend.some((v) => v > 0);
  const deadliftHasData = deadliftTrend.some((v) => v > 0);

  if (!squatHasData) squatTrend = HARDCODED_SQUAT;
  if (!benchHasData) benchTrend = HARDCODED_BENCH;
  if (!deadliftHasData) deadliftTrend = HARDCODED_DEADLIFT;

  const blockLabel = currentBlock
    ? `Block ${currentBlock.id.slice(-2)} · ${currentBlock.phase}`
    : 'No active block';
  const blockPeriod = currentBlock
    ? `${currentBlock.startDate}${currentBlock.endDate ? ` – ${currentBlock.endDate}` : ' · active'}`
    : '';

  const latestSquat = profile.rollingE1rm.squat.toFixed(1);
  const latestBench = profile.rollingE1rm.bench.toFixed(1);
  const latestDeadlift = profile.rollingE1rm.deadlift.toFixed(1);

  const latestSquatE1rm = profile.e1rm.squat;
  const latestBenchE1rm = profile.e1rm.bench;
  const latestDeadliftE1rm = profile.e1rm.deadlift;

  const lastSquat = squatTrend[squatTrend.length - 1] ?? latestSquatE1rm;
  const firstSquat = squatTrend[0] ?? latestSquatE1rm;
  const squatDelta = lastSquat - firstSquat;
  const squatPct = firstSquat > 0 ? ((squatDelta / firstSquat) * 100).toFixed(1) : '0.0';

  const lastBench = benchTrend[benchTrend.length - 1] ?? latestBenchE1rm;
  const firstBench = benchTrend[0] ?? latestBenchE1rm;
  const benchDelta = lastBench - firstBench;
  const benchPct = firstBench > 0 ? ((benchDelta / firstBench) * 100).toFixed(1) : '0.0';

  const lastDead = deadliftTrend[deadliftTrend.length - 1] ?? latestDeadliftE1rm;
  const firstDead = deadliftTrend[0] ?? latestDeadliftE1rm;
  const deadDelta = lastDead - firstDead;
  const deadPct = firstDead > 0 ? ((deadDelta / firstDead) * 100).toFixed(1) : '0.0';

  const peakWeek = squatTrend.indexOf(Math.max(...squatTrend));

  return (
    <Phone>
      <div
        style={{
          padding: '8px 22px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div className="tns-eyebrow">{blockLabel}</div>
        <div
          className="tns-mono"
          style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}
        >
          1 / 6 ›
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div
          style={{
            fontFamily: T.serif,
            fontStyle: 'italic',
            fontSize: 34,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}
        >
          Performance
        </div>
        <div className="tns-eyebrow" style={{ marginBottom: 20 }}>
          {blockPeriod || (currentBlock?.phase ?? '')}
        </div>

        {/* Headline e1RM */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <div>
            <div className="tns-eyebrow" style={{ marginBottom: 6 }}>
              Squat · rolling e1RM
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                className="tns-serif"
                style={{ fontSize: 64, lineHeight: 0.85 }}
              >
                {latestSquat}
              </span>
              <span
                className="tns-mono"
                style={{ fontSize: 11, color: T.textDim }}
              >
                KG
              </span>
            </div>
            <div
              className="tns-mono"
              style={{
                fontSize: 11,
                color: T.good,
                marginTop: 6,
                letterSpacing: '0.06em',
              }}
            >
              + {squatDelta.toFixed(1)} KG · + {squatPct}%
              {peakWeek >= 0 ? ` · PEAK WK ${peakWeek + 1}` : ''}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <Chart data={squatTrend} peak={peakWeek >= 0 ? peakWeek : undefined} w={320} h={110} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 4,
              fontFamily: T.mono,
              fontSize: 9,
              color: T.textMute,
              letterSpacing: '0.06em',
            }}
          >
            {squatTrend.map((_, i) => (
              <span key={i}>WK {i + 1}</span>
            ))}
          </div>
        </div>

        {/* Other lifts */}
        <div className="tns-eyebrow" style={{ marginTop: 26, marginBottom: 10 }}>
          Other primary lifts
        </div>
        <div style={{ border: `1px solid ${T.line}` }}>
          {[
            {
              l: 'Bench press',
              v: latestBench,
              d: `+ ${benchPct}%`,
              s: benchTrend,
            },
            {
              l: 'Deadlift',
              v: latestDeadlift,
              d: `+ ${deadPct}%`,
              s: deadliftTrend,
            },
          ].map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: i < 1 ? `1px solid ${T.lineSoft}` : 'none',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{r.l}</div>
                <div
                  className="tns-mono"
                  style={{ fontSize: 10, color: T.good, marginTop: 2 }}
                >
                  {r.d}
                </div>
              </div>
              <Spark data={r.s} w={70} h={22} />
              <div style={{ textAlign: 'right', minWidth: 70 }}>
                <span className="tns-serif" style={{ fontSize: 22 }}>
                  {r.v}
                </span>
                <span
                  className="tns-mono"
                  style={{ fontSize: 9, color: T.textMute, marginLeft: 3 }}
                >
                  KG
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* TTP */}
        <div className="tns-eyebrow" style={{ marginTop: 24, marginBottom: 10 }}>
          Time-to-peak
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 1,
            background: T.line,
            border: `1px solid ${T.line}`,
          }}
        >
          {[
            ['This block', String(peakWeek >= 0 ? peakWeek + 1 : '—'), 'WK', T.accent],
            ['Last 3 avg', '5.7', 'WK', T.text],
            ['Pattern', 'Dip→', 'PROG', T.text],
          ].map(([l, v, u, c], i) => (
            <div key={i} style={{ background: T.bg, padding: '12px 14px' }}>
              <div
                className="tns-eyebrow"
                style={{ fontSize: 8.5, marginBottom: 4 }}
              >
                {l}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span
                  className="tns-serif"
                  style={{ fontSize: 26, color: c as string }}
                >
                  {v}
                </span>
                <span
                  className="tns-mono"
                  style={{ fontSize: 9, color: T.textMute }}
                >
                  {u}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TabBar
        active="block"
        onNavigate={(id) => {
          if (id === 'today') navigate('/');
          else if (id === 'block') navigate('/block/performance');
          else if (id === 'meet') navigate('/meet/setup');
          else navigate('/');
        }}
      />
    </Phone>
  );
}
