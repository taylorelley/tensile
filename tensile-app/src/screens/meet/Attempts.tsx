import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Phone, AppHeader, PrimaryBtn, TabBar, T } from '../../shared';

function roundTo25(n: number): number {
  return Math.round(n / 2.5) * 2.5;
}

export default function Attempts() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);

  const meetDateStr = profile.meetDate || '2026-09-14';
  const meetDate = new Date(meetDateStr);
  const daysOut = Math.max(0, Math.ceil((meetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  const formattedDate = meetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const lifts = [
    { l: 'Squat', key: 'squat' as const, e1: profile.e1rm.squat || 200 },
    { l: 'Bench', key: 'bench' as const, e1: profile.e1rm.bench || 140 },
    { l: 'Deadlift', key: 'deadlift' as const, e1: profile.e1rm.deadlift || 230 },
  ].map((l) => ({
    ...l,
    opener: roundTo25(l.e1 * 0.93),
    second: roundTo25(l.e1 * 0.98),
    third: roundTo25(l.e1 * 1.02),
  }));

  const total = lifts.reduce((a, l) => a + l.third, 0);
  const previousTotal =
    (profile.rollingE1rm.squat || 0) +
    (profile.rollingE1rm.bench || 0) +
    (profile.rollingE1rm.deadlift || 0);
  const prDelta = Math.round((total - previousTotal) * 10) / 10;
  const prSign = prDelta >= 0 ? '+' : '';
  const prColor = prDelta >= 0 ? T.good : T.bad;

  return (
    <Phone>
      <AppHeader eyebrow={`Meet day · ${daysOut} days out · ${formattedDate}`} title="Attempts" back onBack={() => navigate('/meet/setup')} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Headline total */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <span className="tns-eyebrow">Projected total · all 3rds</span>
            <span className="tns-mono" style={{ fontSize: 11, color: prColor }}>
            {prSign} {prDelta.toFixed(1)} KG {prDelta >= 0 ? 'PR' : ''}
          </span>
        </div>
        <div
          className="tns-serif"
          style={{ fontSize: 88, lineHeight: 0.85, marginBottom: 22 }}
        >
          {total}
          <span className="tns-mono" style={{ fontSize: 14, color: T.textDim, marginLeft: 6 }}>
            KG
          </span>
        </div>

        {lifts.map((l, i) => (
          <div key={i} style={{ border: `1px solid ${T.line}`, marginBottom: 10 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderBottom: `1px solid ${T.lineSoft}`,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500 }}>{l.l}</span>
              <span className="tns-mono" style={{ fontSize: 10, color: T.textMute }}>
                e1RM · <span style={{ color: T.text }}>{l.e1}</span>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
              {[
                { tag: 'OPENER', v: l.opener, pct: `${Math.round((l.opener / l.e1) * 100)}%` },
                { tag: '2ND', v: l.second, pct: `${Math.round((l.second / l.e1) * 100)}%` },
                { tag: '3RD', v: l.third, pct: 'PR', third: true },
              ].map((a, j) => (
                <div
                  key={j}
                  style={{
                    padding: '12px 14px',
                    borderRight: j < 2 ? `1px solid ${T.lineSoft}` : 'none',
                    background: a.third ? 'rgba(255,110,58,0.06)' : 'transparent',
                  }}
                >
                  <div
                    className="tns-mono"
                    style={{
                      fontSize: 8.5,
                      color: a.third ? T.accent : T.textMute,
                      letterSpacing: '0.1em',
                      marginBottom: 4,
                    }}
                  >
                    {a.tag}
                  </div>
                  <span className="tns-serif" style={{ fontSize: 28, color: a.third ? T.accent : T.text }}>
                    {a.v}
                  </span>
                  <div
                    className="tns-mono"
                    style={{ fontSize: 9, color: T.textMute, marginTop: 2, letterSpacing: '0.06em' }}
                  >
                    {a.pct}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            background: T.surface,
            fontSize: 11.5,
            color: T.textDim,
            lineHeight: 1.55,
          }}
        >
          <span className="tns-mono" style={{ fontSize: 9, color: T.accent, letterSpacing: '0.08em' }}>
            RULES
          </span>
          <div style={{ marginTop: 4 }}>
            IPF · 83 kg raw · 1 min between attempts. Squat/bench/DL openers locked in by warm-up call.
          </div>
        </div>
      </div>
      <div
        style={{
          padding: '14px 22px 0',
          borderTop: `1px solid ${T.lineSoft}`,
          display: 'flex',
          gap: 8,
        }}
      >
        <PrimaryBtn dim full={false} onClick={() => navigate('/meet/setup')}>
          Edit
        </PrimaryBtn>
        <PrimaryBtn onClick={() => navigate('/')}>Back to today →</PrimaryBtn>
      </div>
      <TabBar
        active="meet"
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
