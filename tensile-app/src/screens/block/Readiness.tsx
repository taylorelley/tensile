import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import type { Session } from '../../store';
import { Phone, TabBar, T, Chart, ChartEmpty, Spark } from '../../shared';

function weeklyRcsTrend(
  sessions: Session[],
  startDate: string
): number[] {
  const start = new Date(startDate).getTime();
  const weekMap = new Map<number, number[]>();
  for (const s of sessions) {
    const daysSince = Math.floor(
      (new Date(s.scheduledDate).getTime() - start) / (1000 * 60 * 60 * 24)
    );
    const week = Math.floor(daysSince / 7);
    if (!weekMap.has(week)) weekMap.set(week, []);
    weekMap.get(week)!.push(s.rcs);
  }
  if (weekMap.size === 0) return [];
  const maxWeek = Math.max(...Array.from(weekMap.keys()));
  return Array.from(
    { length: maxWeek + 1 },
    (_, i) => {
      const vals = weekMap.get(i);
      return vals && vals.length > 0
        ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
        : 0;
    }
  );
}

export default function Readiness() {
  const navigate = useNavigate();
  const currentBlock = useStore((s) => s.currentBlock);

  const sessions = currentBlock?.sessions ?? [];
  const startDate = currentBlock?.startDate ?? '';

  const rcs = startDate ? weeklyRcsTrend(sessions, startDate) : [];
  const rcsHasData = rcs.some((v) => v > 0);

  const sortedSessions = [...sessions].sort(
    (a, b) =>
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  const rcsModSessions = sortedSessions.filter(
    (s) => s.overrides && s.overrides.length > 0
  );
  const rcsReductions = rcsModSessions.filter(
    (s) =>
      s.overrides.some(
        (o) => o.includes('Lower RPE cap') || o.includes('Drop next set') || o.includes('Reactive deload')
      )
  );
  const rcsBumps = rcsModSessions.filter(
    (s) => s.overrides.some((o) => o.includes('Add a set'))
  );

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
          onClick={() => navigate('/block/volume')}
        >
          ‹ 2 / 6
        </div>
        <div className="tns-eyebrow">{blockLabel}</div>
        <div
          className="tns-mono"
          style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', cursor: 'pointer' }}
          onClick={() => navigate('/block/weakpoint')}
        >
          3 / 6 ›
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
          Readiness
        </div>
        <div className="tns-eyebrow" style={{ marginBottom: 20 }}>
          Weekly composite trend
        </div>

        <div style={{ marginBottom: 20 }}>
          {rcsHasData ? (
            <>
              <Chart data={rcs} color={T.text} w={320} h={90} />
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
                <span>W1 · {rcs[0]}</span>
                <span>
                  W{Math.ceil(rcs.length / 2)} ·{' '}
                  {rcs[Math.floor(rcs.length / 2)]}
                </span>
                <span>
                  W{rcs.length} · {rcs[rcs.length - 1]}
                </span>
              </div>
            </>
          ) : (
            <ChartEmpty message="NO READINESS DATA YET" h={90} />
          )}
        </div>

        {/* Session readiness table */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>
          Session readiness
        </div>
        <div style={{ border: `1px solid ${T.line}`, marginBottom: 18 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 50px 50px',
              padding: '8px 12px',
              background: T.surface,
              fontFamily: T.mono,
              fontSize: 9,
              color: T.textMute,
              letterSpacing: '0.06em',
              borderBottom: `1px solid ${T.lineSoft}`,
            }}
          >
            <span>Date</span>
            <span style={{ textAlign: 'right' }}>RCS</span>
            <span style={{ textAlign: 'right' }}>sRPE</span>
          </div>
          {sortedSessions.length === 0 ? (
            <div
              style={{
                padding: '14px 12px',
                fontSize: 11.5,
                color: T.textDim,
                textAlign: 'center',
              }}
            >
              No sessions yet
            </div>
          ) : (
            sortedSessions.map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 50px 50px',
                  padding: '10px 12px',
                  borderBottom:
                    i < sortedSessions.length - 1
                      ? `1px solid ${T.lineSoft}`
                      : 'none',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 12 }}>
                  {s.scheduledDate}
                  {s.status === 'COMPLETE' ? (
                    <span
                      className="tns-mono"
                      style={{
                        fontSize: 8,
                        color: T.good,
                        marginLeft: 6,
                        letterSpacing: '0.08em',
                      }}
                    >
                      DONE
                    </span>
                  ) : s.status === 'SKIPPED' ? (
                    <span
                      className="tns-mono"
                      style={{
                        fontSize: 8,
                        color: T.bad,
                        marginLeft: 6,
                        letterSpacing: '0.08em',
                      }}
                    >
                      SKIP
                    </span>
                  ) : (
                    <span
                      className="tns-mono"
                      style={{
                        fontSize: 8,
                        color: T.textMute,
                        marginLeft: 6,
                        letterSpacing: '0.08em',
                      }}
                    >
                      {s.status === 'IN_PROGRESS' ? 'IN PROG' : 'SCHED'}
                    </span>
                  )}
                </span>
                <span
                  className="tns-mono"
                  style={{
                    fontSize: 12,
                    textAlign: 'right',
                    color:
                      s.rcs >= 70
                        ? T.good
                        : s.rcs >= 50
                          ? T.caution
                          : T.bad,
                  }}
                >
                  {s.rcs || '—'}
                </span>
                <span
                  className="tns-mono"
                  style={{ fontSize: 12, textAlign: 'right' }}
                >
                  {s.srpe ?? '—'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* RCS sparkline */}
        {rcsHasData && (
          <>
            <div className="tns-eyebrow" style={{ marginBottom: 8 }}>
              RCS trend
            </div>
            <div style={{ marginBottom: 18 }}>
              <Spark
                data={rcs}
                color={T.accent}
                w={320}
                h={32}
              />
            </div>
          </>
        )}

        {/* Modifier session count */}
        <div style={{ border: `1px solid ${T.line}`, padding: '12px 16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <div className="tns-eyebrow">
              Sessions with RCS prescription mod.
            </div>
            <span className="tns-serif" style={{ fontSize: 28 }}>
              {rcsModSessions.length}
            </span>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: T.textDim,
              lineHeight: 1.5,
            }}
          >
            {rcsReductions.length} reductions · {rcsBumps.length} elevated
            readiness bumps.
            {rcsModSessions.length === 0 && ' No overrides logged yet.'}
          </div>
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
