import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, AppHeader, T } from '../../shared';

const phases = [
  { l: 'Development', wk: '8 wk', start: 'NOW', col: T.accent, w: 40 },
  { l: 'Pivot', wk: '3 wk', col: T.caution, w: 15 },
  { l: 'Realisation', wk: '2 wk', col: T.text, w: 10 },
  { l: 'Taper', wk: '3 d', col: T.textDim, w: 5 },
  { l: 'MEET', wk: 'Sep 14', col: T.accent, w: 4, terminal: true },
];

const phaseColors = [T.accent, T.caution, T.text, T.textDim, T.accent];
const phaseLabels = ['DEV', 'PIV', 'REAL', 'TPR', '★'];

export default function Peaking() {
  const navigate = useNavigate();

  return (
    <Phone>
      <AppHeader eyebrow="Peaking · 18 weeks out" title="Path to Sep 14" back />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Countdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 22,
            borderBottom: `1px solid ${T.line}`,
            paddingBottom: 18,
          }}
        >
          <div>
            <div className="tns-eyebrow" style={{ marginBottom: 4 }}>
              Days to meet
            </div>
            <span className="tns-serif" style={{ fontSize: 72, lineHeight: 0.85 }}>
              123
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="tns-eyebrow" style={{ marginBottom: 4 }}>
              Projected total
            </div>
            <span className="tns-serif" style={{ fontSize: 32, color: T.accent }}>
              620
            </span>
            <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, marginLeft: 4 }}>
              KG
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Phase timeline
        </div>
        <div style={{ display: 'flex', height: 36, marginBottom: 6 }}>
          {phases.map((p, i) => (
            <div
              key={i}
              style={{
                flex: p.w,
                background: p.col,
                opacity: p.terminal ? 1 : 0.85,
                borderRight: i < phases.length - 1 ? `1px solid ${T.bg}` : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a0f08',
                fontFamily: T.mono,
                fontSize: 9,
                letterSpacing: '0.08em',
                fontWeight: 600,
              }}
            >
              {p.terminal ? '▼' : p.wk}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', marginBottom: 22 }}>
          {phases.map((p, i) => (
            <div
              key={i}
              style={{
                flex: p.w,
                fontFamily: T.mono,
                fontSize: 9,
                color: p.col,
                letterSpacing: '0.06em',
                textAlign: 'left',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {p.l.toUpperCase()}
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Week-by-week
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3, marginBottom: 14 }}>
          {Array.from({ length: 18 }).map((_, i) => {
            const phase =
              i < 8 ? 0 : i < 13 ? 1 : i < 15 ? 2 : i < 17 ? 3 : 4;
            return (
              <div
                key={i}
                style={{
                  aspectRatio: '1',
                  border: `1px solid ${T.line}`,
                  background: phase === 0 ? T.surface : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <div className="tns-mono" style={{ fontSize: 9, color: T.textMute }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div
                  className="tns-mono"
                  style={{ fontSize: 8, color: phaseColors[phase], letterSpacing: '0.04em', marginTop: 2 }}
                >
                  {phaseLabels[phase]}
                </div>
                {i === 0 && (
                  <div
                    className="tns-mono"
                    style={{ position: 'absolute', top: -10, right: -2, fontSize: 8, color: T.accent }}
                  >
                    NOW
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Phase descriptions */}
        <div
          style={{
            padding: '12px 14px',
            background: T.surface,
            fontSize: 11.5,
            color: T.textDim,
            lineHeight: 1.55,
            borderLeft: `2px solid ${T.accent}`,
          }}
        >
          <span style={{ color: T.text }}>Now · Development.</span> Push your squat e1RM ≥ 230 kg over 8 weeks (TTP
          est. 6 wk). Pivot begins automatically after peak detection.
        </div>
      </div>
    </Phone>
  );
}
