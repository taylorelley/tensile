import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import type { Session } from '../../store';
import { Phone, TabBar, T, Chart, ChartBars, ChartEmpty, BlockSubNav } from '../../shared';
import { volumeBudget, ewmaAclrSeries } from '../../engine';

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

/** Build per-muscle-group weekly set totals from block.weeklyMuscleVolume */
function weeklyMuscleVolumeData(
  weeklyMuscleVolume: Record<number, Record<string, number>>,
  muscleGroup: string
): number[] {
  const weeks = Object.keys(weeklyMuscleVolume).map(Number).sort((a, b) => a - b);
  if (weeks.length === 0) return [];
  const maxWeek = Math.max(...weeks);
  return Array.from({ length: maxWeek + 1 }, (_, i) => {
    return weeklyMuscleVolume[i]?.[muscleGroup] || 0;
  });
}

export default function Volume() {
  const navigate = useNavigate();
  const currentBlock = useStore((s) => s.currentBlock);
  const profile = useStore((s) => s.profile);

  const sessions = currentBlock?.sessions ?? [];
  const startDate = currentBlock?.startDate ?? '';
  const weeklyMuscleVolume = currentBlock?.weeklyMuscleVolume ?? {};

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

  const blockWeek = currentBlock?.week ?? 1;
  const totalBlockWeeks = profile.ttpEstimate || 7;
  const recoverySignal = currentBlock?.sessions?.[currentBlock.sessions.length - 1]?.rcs ?? 70;

  const totalVolume = sessions.length > 0
    ? (sessions.reduce((sum, s) => sum + s.volumeLoad, 0) / 1000).toFixed(1)
    : '—';
  const totalSrpeLoad = sessions.length > 0
    ? String(Math.round(sessions.reduce((sum, s) => sum + (s.srpe ?? 0) * (s.sfi || 1), 0)))
    : '—';
  const sessionsLogged = sessions.filter((s) => s.status === 'COMPLETE').length;
  const totalSessions = sessions.length;

  // EWMA-based ACLR (Williams et al. 2017): per-day acute/chronic ratio from sRPE-load,
  // falling back to SFI when sRPE wasn't logged. Sampled once per week for the trend chart.
  const sortedCompleted = [...sessions]
    .filter((s) => s.status === 'COMPLETE')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  function computeAclr(): { values: number[]; peak: number; peakWeek: string; calibrating: boolean } {
    if (sortedCompleted.length === 0) return { values: [], peak: 0, peakWeek: '—', calibrating: true };
    const aclrInput = sortedCompleted.map(s => ({
      date: s.scheduledDate,
      load: s.srpeLoad ?? s.sfi ?? 0,
    }));
    const lastDate = new Date(sortedCompleted[sortedCompleted.length - 1].scheduledDate);
    const { ratios, calibratingDays } = ewmaAclrSeries(aclrInput, lastDate);
    if (ratios.length === 0) return { values: [], peak: 0, peakWeek: '—', calibrating: true };

    // Sample one ratio per week: take the last day of each week's window
    const blockStart = new Date(currentBlock?.startDate ?? sortedCompleted[0].scheduledDate).getTime();
    const firstSessionDay = new Date(sortedCompleted[0].scheduledDate).getTime();
    const weekValues: number[] = [];
    const lastWeekIdx = Math.floor((lastDate.getTime() - blockStart) / (1000 * 60 * 60 * 24 * 7));
    for (let w = 0; w <= lastWeekIdx; w++) {
      const endOfWeekTs = blockStart + (w * 7 + 6) * 24 * 60 * 60 * 1000;
      const dayIdx = Math.floor((endOfWeekTs - firstSessionDay) / (1000 * 60 * 60 * 24));
      const clamped = Math.max(0, Math.min(ratios.length - 1, dayIdx));
      weekValues.push(Math.round(ratios[clamped] * 100) / 100);
    }

    let peak = 0;
    let peakWeek = '—';
    for (let i = 0; i < weekValues.length; i++) {
      if (weekValues[i] > peak) {
        peak = weekValues[i];
        peakWeek = `wk ${i + 1}`;
      }
    }
    const calibrating = calibratingDays < 14;
    return { values: weekValues, peak, peakWeek, calibrating };
  }

  const { values: aclrTrend, peak: peakAclr, peakWeek: peakAclrWeek, calibrating: aclrCalibrating } = computeAclr();
  const aclrHasData = aclrTrend.length > 0 && !aclrCalibrating;

  const blockLabel = currentBlock
    ? `Block ${currentBlock.id.slice(-2)} · ${currentBlock.phase}`
    : 'No active block';

  // Muscle groups to display (from profile MEV/MRV estimates)
  const muscleGroups = [
    { key: 'quads', label: 'Quads' },
    { key: 'hamstrings', label: 'Hamstrings' },
    { key: 'pecs', label: 'Pecs' },
    { key: 'lats', label: 'Lats' },
    { key: 'anterior_deltoid', label: 'Delts' },
    { key: 'triceps', label: 'Triceps' },
    { key: 'biceps', label: 'Biceps' },
    { key: 'core', label: 'Core' },
  ].filter(mg => profile.mevEstimates[mg.key] !== undefined || profile.mrvEstimates[mg.key] !== undefined);

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
      <BlockSubNav active="volume" />
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

        {/* Muscle-group volume charts */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Weekly sets per muscle group
        </div>
        {muscleGroups.length === 0 ? (
          <ChartEmpty message="NO MUSCLE GROUP DATA" h={80} />
        ) : (
          muscleGroups.map((mg) => {
            const data = weeklyMuscleVolumeData(weeklyMuscleVolume, mg.key);
            const hasData = data.some((v) => v > 0);
            const mev = profile.mevEstimates[mg.key] ?? 8;
            const mrv = profile.mrvEstimates[mg.key] ?? 20;
            const mav = Math.round((mev + mrv) / 2);
            const budget = volumeBudget(mev, mrv, blockWeek, totalBlockWeeks, recoverySignal);
            return (
              <div key={mg.key} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{mg.label}</span>
                  <span className="tns-mono" style={{ fontSize: 11, color: T.textMute, letterSpacing: '0.06em' }}>
                    BUDGET {budget} · MEV {mev} · MRV {mrv}
                  </span>
                </div>
                {hasData ? (
                  <>
                    <ChartBars data={data} w={300} h={70} mev={mev} mav={mav} mrv={mrv} />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 4,
                        fontFamily: T.mono,
                        fontSize: 11,
                        color: T.textMute,
                        letterSpacing: '0.06em',
                      }}
                    >
                      {data.map((_, i) => (
                        <span key={i}>W{i + 1}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <ChartEmpty message={`NO ${mg.label.toUpperCase()} DATA YET`} h={70} />
                )}
              </div>
            );
          })
        )}

        {/* Overall working-set count */}
        <div className="tns-eyebrow" style={{ marginTop: 10, marginBottom: 10 }}>
          Overall working sets
        </div>
        <div style={{ marginBottom: 28 }}>
          {setCountHasData ? (
            <>
              <ChartBars data={setCountData} w={300} h={80} />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 4,
                    fontFamily: T.mono,
                    fontSize: 11,
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
            <ChartEmpty message="Complete sessions to see volume data" h={80} />
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

        {/* ACLR trend */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>
          ACLR trend ·{' '}
          <span style={{ color: T.caution }}>EWMA · λa 0.25 · λc 0.069</span>
        </div>
        <div style={{ marginBottom: 22 }}>
          {aclrHasData ? (
            <>
              <Chart data={aclrTrend} color={T.caution} w={320} h={80} ticks={3} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 4,
                  fontFamily: T.mono,
                  fontSize: 11,
                  color: T.textMute,
                  letterSpacing: '0.06em',
                }}
              >
                {aclrTrend.map((_, i) => (
                  <span key={i}>W{i + 1}</span>
                ))}
              </div>
              {aclrTrend.some(v => v > 1.5) && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(232,193,78,0.08)', borderLeft: `2px solid ${T.caution}`, fontSize: 11, color: T.textDim }}>
                  <span className="tns-mono" style={{ color: T.caution }}>WARNING</span>{' '}
                  ACLR exceeded 1.5 in {aclrTrend.filter(v => v > 1.5).length} week(s) — consider reducing volume spike.
                </div>
              )}
            </>
          ) : aclrCalibrating ? (
            <ChartEmpty message="ACLR CALIBRATING · 14-DAY BASELINE" h={80} />
          ) : (
            <ChartEmpty message="NO ACLR DATA YET" h={80} />
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
