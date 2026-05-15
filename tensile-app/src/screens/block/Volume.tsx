import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import type { Session } from '../../store';
import { Phone, TabBar, T, Chart, ChartBars, ChartEmpty } from '../../shared';
import { volumeBudget } from '../../engine';

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

export default function Volume() {
  const navigate = useNavigate();
  const currentBlock = useStore((s) => s.currentBlock);
  const profile = useStore((s) => s.profile);

  const sessions = currentBlock?.sessions ?? [];
  const startDate = currentBlock?.startDate ?? '';

  // Weekly working-set count (TOP_SET + BACK_OFF) — same units as MEV/MRV landmarks
  const setCountData = startDate
    ? weeklyAverage(
        sessions,
        startDate,
        (s) => s.sets.filter(set => set.setType === 'TOP_SET' || set.setType === 'BACK_OFF').length
      )
    : [];
  const sfiData = startDate
    ? weeklyAverage(sessions, startDate, (s) => s.sfi)
    : [];

  const setCountHasData = setCountData.some((v) => v > 0);
  const sfiHasData = sfiData.some((v) => v > 0);

  const mev = profile.mevEstimates.quads ?? 10;
  const mrv = profile.mrvEstimates.quads ?? 22;
  const mav = Math.round((mev + mrv) / 2);
  const blockWeek = currentBlock?.week ?? 1;
  const totalBlockWeeks = profile.ttpEstimate || 7;
  const recoverySignal = currentBlock?.sessions?.[currentBlock.sessions.length - 1]?.rcs ?? 70;
  const weeklyBudget = volumeBudget(mev, mrv, blockWeek, totalBlockWeeks, recoverySignal);

  const totalVolume = sessions.length > 0
    ? (sessions.reduce((sum, s) => sum + s.volumeLoad, 0) / 1000).toFixed(1)
    : '—';
  const totalSrpeLoad = sessions.length > 0
    ? String(Math.round(sessions.reduce((sum, s) => sum + (s.srpe ?? 0) * (s.sfi || 1), 0)))
    : '—';
  const sessionsLogged = sessions.filter((s) => s.status === 'COMPLETE').length;
  const totalSessions = sessions.length;

  // Compute peak ACLR from actual session data
  const sortedCompleted = [...sessions]
    .filter((s) => s.status === 'COMPLETE')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  let peakAclr = 0;
  let peakAclrWeek = '—';
  if (sortedCompleted.length >= 2) {
    const start = new Date(currentBlock?.startDate ?? sortedCompleted[0].scheduledDate).getTime();
    const weekMap = new Map<number, number[]>();
    for (const s of sortedCompleted) {
      const daysSince = Math.floor(
        (new Date(s.scheduledDate).getTime() - start) / (1000 * 60 * 60 * 24)
      );
      const week = Math.floor(daysSince / 7);
      if (!weekMap.has(week)) weekMap.set(week, []);
      weekMap.get(week)!.push(s.sfi);
    }
    let prevAvg = 0;
    for (let w = 0; w <= Math.max(...Array.from(weekMap.keys())); w++) {
      const vals = weekMap.get(w);
      const avg = vals && vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      if (prevAvg > 0 && avg > 0) {
        const aclr = avg / prevAvg;
        if (aclr > peakAclr) {
          peakAclr = aclr;
          peakAclrWeek = `wk ${w + 1}`;
        }
      }
      prevAvg = avg;
    }
  }

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
        <div
          className="tns-mono"
          style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', cursor: 'pointer' }}
          onClick={() => navigate('/block/performance')}
        >
          ‹ 1 / 6
        </div>
        <div className="tns-eyebrow">{blockLabel}</div>
        <div
          className="tns-mono"
          style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', cursor: 'pointer' }}
          onClick={() => navigate('/block/readiness')}
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
          Working sets · weekly total
        </div>

        <div style={{ marginBottom: 28 }}>
          {setCountHasData ? (
            <>
              <ChartBars data={setCountData} w={300} h={100} mev={mev} mav={mav} mrv={mrv} />
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
                {setCountData.map((_, i) => (
                  <span key={i}>W{i + 1}</span>
                ))}
              </div>
            </>
          ) : (
            <ChartEmpty message="NO WORKING SETS LOGGED YET" h={100} />
          )}
        </div>

        {/* SFI / sRPE */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>
          Session Fatigue Index ·{' '}
          <span style={{ color: T.caution }}>HEURISTIC</span>
        </div>
        <div style={{ marginBottom: 22 }}>
          {sfiHasData ? (
            <Chart data={sfiData} color={T.caution} w={320} h={80} ticks={3} />
          ) : (
            <ChartEmpty message="NO SFI DATA YET" h={80} />
          )}
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
            ['Volume budget', String(weeklyBudget), 'SETS'],
            ['Total volume', totalVolume, 'K KG'],
            ['Total sRPE load', totalSrpeLoad, 'AU'],
            ['Peak ACLR' + (peakAclrWeek !== '—' ? ' · ' + peakAclrWeek : ''), peakAclr > 0 ? peakAclr.toFixed(2) : '—', '×'],
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
          {peakAclr > 0 ? (
            <>
              ACLR peaked at <span className="tns-mono">{peakAclr.toFixed(2)}</span> {peakAclrWeek !== '—' ? `in ${peakAclrWeek}` : ''} — {' '}
              {peakAclr >= 1.5 ? 'above' : 'below'} the <span className="tns-mono">1.5</span> warning threshold.
            </>
          ) : (
            <>No completed sessions yet to compute ACLR trends.</>
          )}
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
