import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, AppHeader, T } from '../../shared';

const options = [
  {
    tag: 'RECOMMENDED',
    tagC: T.accent,
    t: 'Active deload',
    d: '1 week · same movements · 50% volume · maintained intensity',
    body: 'Same exercises, half the sets, RPE 6–7 cap. Technique focus.',
    chartBars: [50, 50, 50],
    primary: true,
  },
  {
    tag: 'VARIATION',
    tagC: T.caution,
    t: 'Pivot block',
    d: '2 weeks · varied movements · higher reps · RPE 6–8',
    body: 'No competition lifts. Pause / tempo variations. Rep range 8–12. Use this if you want to target the out-of-the-hole weakness before block 05.',
    chartBars: [70, 70, 60, 50, 40, 40, 50, 50, 60, 60, 50, 40, 30, 30],
    primary: false,
  },
  {
    tag: 'NOT ADVISED',
    tagC: T.bad,
    t: 'Complete rest',
    d: '5–7 days · no training',
    body: 'Coleman (2024) RCT: complete cessation may impair subsequent strength vs active deloading. Only choose if dealing with acute injury.',
    chartBars: [0, 0, 0],
    primary: false,
  },
];

export default function DeloadStructure() {
  const navigate = useNavigate();

  return (
    <Phone>
      <AppHeader eyebrow="Deload · Structure" title="Pick a path" back />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {options.map((o, i) => (
          <div
            key={i}
            style={{
              border: `1px solid ${o.primary ? T.accent : T.line}`,
              background: o.primary ? 'rgba(255,110,58,0.04)' : 'transparent',
              padding: '14px 16px',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <span
                className="tns-mono"
                style={{
                  fontSize: 9,
                  color: o.tagC,
                  letterSpacing: '0.1em',
                  background: 'rgba(255,255,255,0.04)',
                  padding: '2px 6px',
                  border: `1px solid ${o.tagC}`,
                }}
              >
                {o.tag}
              </span>
              <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.06em' }}>
                {o.d.split(' · ')[0].toUpperCase()}
              </span>
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 26, marginBottom: 4 }}>
              {o.t}
            </div>
            <div
              className="tns-mono"
              style={{ fontSize: 10, color: T.textDim, letterSpacing: '0.04em', marginBottom: 8 }}
            >
              {o.d}
            </div>
            <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.55, marginBottom: 10 }}>
              {o.body}
            </div>
            {/* mini volume preview */}
            <div style={{ display: 'flex', gap: 2, height: 22, alignItems: 'flex-end' }}>
              {o.chartBars.map((b, j) => (
                <div
                  key={j}
                  style={{
                    flex: 1,
                    height: Math.max(2, b * 0.22) + 'px',
                    background: o.primary ? T.accent : T.surface3,
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Phone>
  );
}
