import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import type { Session } from '../../store';
import { Phone, TabBar, T, Chart, ChartEmpty, Spark } from '../../shared';
import { detectPeak, detectStall } from '../../engine';

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

export default function Performance() {
  const navigate = useNavigate();
  const currentBlock = useStore((s) => s.currentBlock);
  const profile = useStore((s) => s.profile);

  const sessions = currentBlock?.sessions ?? [];
  const startDate = currentBlock?.startDate ?? '';

  const squatTrend = startDate
    ? weeklyBestE1rm(sessions, startDate, ['barbell_back_squat'])
    : [];
  const benchTrend = startDate
    ? weeklyBestE1rm(sessions, startDate, ['bench_press'])
    : [];
  const deadliftTrend = startDate
    ? weeklyBestE1rm(sessions, startDate, ['conventional_deadlift'])
    : [];

  const squatHasData = squatTrend.some((v) => v > 0);

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

  const blockWeek = currentBlock?.week ?? 1;
  const minimumTTP = profile.ttpEstimate;
  // Filter out zero-padded weeks (no data) before running peak/stall detection
  const squatTrendFiltered = squatTrend.filter(v => v > 0);
  const benchTrendFiltered = benchTrend.filter(v => v > 0);
  const deadliftTrendFiltered = deadliftTrend.filter(v => v > 0);
  const squatPeak = detectPeak(squatTrendFiltered, minimumTTP, blockWeek);
  const squatStall = detectStall(squatTrendFiltered, blockWeek);
  const benchPeak = detectPeak(benchTrendFiltered, minimumTTP, blockWeek);
  const benchStall = detectStall(benchTrendFiltered, blockWeek);
  const deadliftPeak = detectPeak(deadliftTrendFiltered, minimumTTP, blockWeek);
  const deadliftStall = detectStall(deadliftTrendFiltered, blockWeek);

  const squatPeakWeek = squatPeak ? squatTrend.indexOf(Math.max(...squatTrendFiltered)) : -1;

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
          style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', cursor: 'pointer' }}
          onClick={() => navigate('/block/volume')}
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
            {squatHasData && (
              <div
                className="tns-mono"
                style={{
                  fontSize: 11,
                  color: squatDelta >= 0 ? T.good : T.bad,
                  marginTop: 6,
                  letterSpacing: '0.06em',
                }}
              >
                {squatDelta >= 0 ? '+' : ''}{squatDelta.toFixed(1)} KG · {Number(squatPct) >= 0 ? '+' : ''}{squatPct}%
                {squatPeakWeek >= 0 ? ` · PEAK WK ${squatPeakWeek + 1}` : ''}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          {squatHasData ? (
            <>
              <Chart data={squatTrend} peak={squatPeakWeek >= 0 ? squatPeakWeek : undefined} w={320} h={110} />
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
            </>
          ) : (
            <ChartEmpty message="LOG A SQUAT SESSION TO SEE TRENDS" h={110} />
          )}
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
              d: `${Number(benchPct) >= 0 ? '+' : ''}${benchPct}%`,
              dColor: benchDelta >= 0 ? T.good : T.bad,
              s: benchTrend,
              peak: benchPeak,
              stall: benchStall,
            },
            {
              l: 'Deadlift',
              v: latestDeadlift,
              d: `${Number(deadPct) >= 0 ? '+' : ''}${deadPct}%`,
              dColor: deadDelta >= 0 ? T.good : T.bad,
              s: deadliftTrend,
              peak: deadliftPeak,
              stall: deadliftStall,
            },
          ].map((r, i, arr) => {
            const hasData = r.s.some(v => v > 0);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderBottom: i < arr.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>{r.l}</div>
                  <div
                    className="tns-mono"
                    style={{ fontSize: 10, color: hasData ? r.dColor : T.textMute, marginTop: 2 }}
                  >
                    {hasData ? `${r.d}${r.peak ? ' · PEAK' : r.stall ? ' · STALL' : ''}` : 'NO DATA YET'}
                  </div>
                </div>
                <Spark data={hasData ? r.s : []} w={70} h={22} />
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
            );
          })}
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
            ['This block', String(squatPeakWeek >= 0 ? squatPeakWeek + 1 : '—'), 'WK', T.accent],
            ['Last 3 avg', profile.ttpHistory.length >= 3 ? (profile.ttpHistory.slice(-3).reduce((a, b) => a + b, 0) / 3).toFixed(1) : '—', 'WK', T.text],
            ['Pattern', squatPeak ? 'Peak→' : squatStall ? 'Stall→' : 'Dip→', squatPeak ? 'PEAK' : squatStall ? 'STALL' : 'PROG', squatPeak ? T.good : squatStall ? T.bad : T.text],
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
          else if (id === 'lifts') navigate('/lifts');
          else if (id === 'meet') navigate('/meet/setup');
          else navigate('/');
        }}
      />
    </Phone>
  );
}
