import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Phone, TabBar, T, BlockSubNav } from '../../shared';

export default function Audit() {
  const navigate = useNavigate();
  const currentBlock = useStore((s) => s.currentBlock);

  const sessions = currentBlock?.sessions ?? [];
  const auditLog = currentBlock?.auditLog ?? [];

  // Collect audit events from sessions: overrides and notable status changes
  const entries: {
    wk: string;
    date: string;
    type: string;
    detail: string;
    evidenceTier?: string;
  }[] = [];

  // Engine audit log entries
  for (const entry of auditLog) {
    entries.push({
      wk: entry.timestamp.slice(0, 10),
      date: entry.timestamp,
      type: entry.ruleId,
      detail: `${entry.trigger} → ${entry.action}`,
      evidenceTier: entry.evidenceTier,
    });
  }

  for (const s of sessions) {
    // Session status changes
    if (s.status === 'COMPLETE') {
      entries.push({
        wk: s.scheduledDate,
        date: s.completedDate ?? s.scheduledDate,
        type: 'SESSION_COMPLETE',
        detail: `Session completed · RCS ${s.rcs}${s.srpe ? ` · sRPE ${s.srpe}` : ''}`,
      });
    } else if (s.status === 'SKIPPED') {
      entries.push({
        wk: s.scheduledDate,
        date: s.scheduledDate,
        type: 'SESSION_SKIPPED',
        detail: 'Session skipped',
      });
    }

    // Overrides
    if (s.overrides && s.overrides.length > 0) {
      for (const o of s.overrides) {
        entries.push({
          wk: s.scheduledDate,
          date: s.scheduledDate,
          type: 'OVERRIDE',
          detail: o,
        });
      }
    }
  }

  // Sort by date descending
  entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const autoCount = sessions.filter((s) => s.status === 'COMPLETE').length;
  const overrideCount = entries.filter((e) => e.type === 'OVERRIDE').length;
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(
    (s) => s.status === 'COMPLETE'
  ).length;
  const adherencePct =
    totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

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
          onClick={() => navigate('/block/weakpoint')}
        >
          ‹ 4 / 6
        </div>
        <div className="tns-eyebrow">{blockLabel}</div>
        <div
          className="tns-mono"
          style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', cursor: 'pointer' }}
          onClick={() => navigate('/block/next')}
        >
          5 / 6 ›
        </div>
      </div>
      <BlockSubNav active="audit" />
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
          Audit
        </div>
        <div className="tns-eyebrow" style={{ marginBottom: 18 }}>
          Engine decisions · {entries.length} entries
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 1,
            background: T.line,
            border: `1px solid ${T.line}`,
            marginBottom: 18,
          }}
        >
          {[
            ['Auto', String(autoCount)],
            ['Overrides', String(overrideCount)],
            ['Adherence', `${adherencePct}%`],
          ].map(([l, v], i) => (
            <div key={i} style={{ background: T.bg, padding: '12px 14px' }}>
              <div
                className="tns-eyebrow"
                style={{ fontSize: 8, marginBottom: 4 }}
              >
                {l}
              </div>
              <div className="tns-mono" style={{ fontSize: 16 }}>
                {v}
              </div>
            </div>
          ))}
        </div>

        {/* Log entries */}
        {entries.length === 0 ? (
          <div
            style={{
              padding: '16px 14px',
              border: `1px solid ${T.line}`,
              fontSize: 12,
              color: T.textDim,
              textAlign: 'center',
            }}
          >
            No audit events yet.
          </div>
        ) : (
          entries.map((e, i) => (
            <div
              key={i}
              style={{
                padding: '14px 0',
                borderBottom:
                  i < entries.length - 1
                    ? `1px solid ${T.lineSoft}`
                    : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    className="tns-mono"
                    style={{
                      fontSize: 9.5,
                      color: T.accent,
                      letterSpacing: '0.08em',
                      background: 'rgba(255,110,58,0.08)',
                      padding: '2px 6px',
                    }}
                  >
                    {e.type}
                  </span>
                  {e.evidenceTier && (
                    <span className="tns-mono" style={{
                      fontSize: 8,
                      color: e.evidenceTier === 'VALIDATED' ? T.good : e.evidenceTier === 'HEURISTIC' ? T.caution : T.textMute,
                      letterSpacing: '0.06em',
                    }}>
                      {e.evidenceTier}
                    </span>
                  )}
                </div>
                <span
                  className="tns-mono"
                  style={{
                    fontSize: 9,
                    color: T.textMute,
                    letterSpacing: '0.06em',
                  }}
                >
                  {e.date}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: T.text,
                  lineHeight: 1.5,
                  marginTop: 2,
                }}
              >
                {e.detail}
              </div>
            </div>
          ))
        )}
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
