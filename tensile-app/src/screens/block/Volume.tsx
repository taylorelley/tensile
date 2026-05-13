import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import type { Session } from '../../store';
import { Phone, TabBar, T, Chart, ChartBars } from '../../shared';

function weeklyAverage(
  sessions: Session[],
  startDate: string,
  extractor: (s: Session) => number
): number[] {
  const start = new Date(startDate).getTime();
  const weekMap = new Map<number, number[]>();
  for (const s of sessions) {
    const daysSince = Math.floor(
      (new Date(s.scheduledDate).getTime() - start) / (1000 * 60 * 60 * 24)
    );
    const week = Math.floor(daysSince / 7);
    if (!weekMap.has(week)) weekMap.set(week, []);
    weekMap.get(week)!.push(extractor(s));
  }
  if (weekMap.size === 0) return [];
  const maxWeek = Math.max(...Array.from(weekMap.keys()));
  return Array.from({ length: maxWeek + 1 }, (_, i) => {
    const vals = weekMap.get(i);
    return vals && vals.length > 0
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
      : 0;
  });
}

const HARDCODED_QUADS = [12, 13, 14, 15, 16, 17, 14];
const HARDCODED_SFI = [320, 360, 410, 440, 480, 510, 420];

export default function Volume() {
  const navigate = useNavigate();
  const currentBlock = useStore((s) => s.currentBlock);

  const sessions = currentBlock?.sessions ?? [];
  const startDate = currentBlock?.startDate ?? '';

  let quads = startDate
    ? weeklyAverage(sessions, startDate, (s) => s.volumeLoad / 1000)
    : [];
  let sfiData = startDate
    ? weeklyAverage(sessions, startDate, (s) => s.sfi)
    : [];

  const quadsHasData = quads.some((v) => v > 0);
  const sfiHasData = sfiData.some((v) => v > 0);

  if (!quadsHasData) quads = HARDCODED_QUADS;
  if (!sfiHasData) sfiData = HARDCODED_SFI;

  const totalVolume = sessions.length > 0
    ? (sessions.reduce((sum, s) => sum + s.volumeLoad, 0) / 1000).toFixed(1)
    : '64.2';
  const totalSrpeLoad = sessions.length > 0
    ? String(sessions.reduce((sum, s) => sum + (s.srpe ?? 0) * (s.sfi || 1), 0))
    : '2 856';
  const sessionsLogged = sessions.filter((s) => s.status === 'COMPLETE').length;
  const totalSessions = sessions.length;

  const blockLabel = currentBlock
    ? `Block ${currentBlock.id.slice(-2)} · ${currentBlock.phase}`
    : 'No active block';

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
          2 / 6 ›
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div
          style={{
            fontFamily: T.serif,
            fontStyle: 'italic',
            fontSize: 34,
            lineHeight: 1,
            marginBottom: 4,
          }}
        >
          Volume & load
        </div>
        <div className="tns-eyebrow" style={{ marginBottom: 20 }}>
          Volume · weekly aggregate
        </div>

        <div style={{ marginBottom: 28 }}>
          <ChartBars data={quads} w={300} h={100} mev={10} mav={15} mrv={20} />
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
            {quads.map((_, i) => (
              <span key={i}>W{i + 1}</span>
            ))}
          </div>
        </div>

        {/* SFI / sRPE */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>
          Session Fatigue Index ·{' '}
          <span style={{ color: T.caution }}>HEURISTIC</span>
        </div>
        <div style={{ marginBottom: 22 }}>
          <Chart data={sfiData} color={T.caution} w={320} h={80} ticks={3} />
        </div>

        {/* Summary grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            background: T.line,
            border: `1px solid ${T.line}`,
            marginBottom: 12,
          }}
        >
          {[
            ['Total volume', totalVolume, 'K KG'],
            ['Total sRPE load', totalSrpeLoad, 'AU'],
            ['Peak ACLR · wk 5', '1.32', '×'],
            [
              'Sessions logged',
              `${sessionsLogged}`,
              `/ ${totalSessions}`,
            ],
          ].map(([l, v, u], i) => (
            <div key={i} style={{ background: T.bg, padding: '14px 16px' }}>
              <div
                className="tns-eyebrow"
                style={{ fontSize: 8.5, marginBottom: 6 }}
              >
                {l}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="tns-serif" style={{ fontSize: 30 }}>
                  {v}
                </span>
                <span
                  className="tns-mono"
                  style={{ fontSize: 10, color: T.textMute }}
                >
                  {u}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '12px 14px',
            background: T.surface,
            fontSize: 11.5,
            color: T.textDim,
            lineHeight: 1.55,
            borderLeft: `2px solid ${T.caution}`,
          }}
        >
          ACLR peaked at{' '}
          <span className="tns-mono">1.32</span> in week 5 — below the{' '}
          <span className="tns-mono">1.5</span> warning threshold. Quad volume
          crossed MAV in week 6; performance regressed week 7 — consistent with
          MRV-adjacent loading.
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
