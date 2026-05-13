import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, TabBar, T } from '../../shared';

export default function WeakPointReview() {
  const navigate = useNavigate();
  const corr = [
    { ex: 'Paused squat', v: 0.68, n: 3, good: true },
    { ex: 'Romanian DL', v: 0.42, n: 3, good: true },
    { ex: 'Front squat', v: 0.18, n: 2, good: false },
    { ex: 'Leg extension', v: -0.21, n: 3, good: false },
    { ex: 'Hip thrust', v: 0.55, n: 2, good: true },
  ];

  const onNavigate = (id: string) => {
    navigate('/' + id);
  };

  return (
    <Phone>
      <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="tns-eyebrow">Block 04 · 7 weeks · closed</div>
        <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>4 / 6 ›</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 34, lineHeight: 1, marginBottom: 4 }}>Weak point</div>
        <div className="tns-eyebrow" style={{ marginBottom: 18 }}>Squat · out-of-the-hole</div>

        {/* Variation responsiveness */}
        <div style={{ border: `1px solid ${T.line}`, padding: '14px 16px', marginBottom: 18 }}>
          <div style={{ fontSize: 13, marginBottom: 10, color: T.text }}>
            Variation test: <span style={{ color: T.accent }}>paused squat block</span> produced <span className="tns-mono">+3.1%</span> e1RM vs <span className="tns-mono">+1.8%</span> in your no-pause block.
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, paddingTop: 10, borderTop: `1px solid ${T.lineSoft}` }}>
            <div style={{ flex: 1 }}>
              <div className="tns-eyebrow" style={{ marginBottom: 6, fontSize: 8 }}>WITH PAUSE</div>
              <div style={{ height: 70, background: T.accent, position: 'relative' }}>
                <span className="tns-mono" style={{ position: 'absolute', top: 6, left: 8, fontSize: 11, color: '#1a0f08' }}>+3.1%</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="tns-eyebrow" style={{ marginBottom: 6, fontSize: 8 }}>WITHOUT</div>
              <div style={{ height: 40, background: T.surface3, position: 'relative' }}>
                <span className="tns-mono" style={{ position: 'absolute', top: 6, left: 8, fontSize: 11 }}>+1.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accessory correlations */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Accessory ↔ squat e1RM</div>
        <div style={{ border: `1px solid ${T.line}` }}>
          {corr.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: i < corr.length - 1 ? `1px solid ${T.lineSoft}` : 'none', gap: 12 }}>
              <span style={{ fontSize: 12.5, flex: 1 }}>{c.ex}</span>
              <span className="tns-mono" style={{ fontSize: 9, color: T.textMute }}>n={c.n}</span>
              {/* mini correlation bar */}
              <div style={{ width: 90, height: 4, background: T.surface, position: 'relative' }}>
                <div style={{ position: 'absolute', left: '50%', top: -1, bottom: -1, width: 1, background: T.line }} />
                <div style={{
                  position: 'absolute',
                  left: c.v >= 0 ? '50%' : `${50 + c.v * 50}%`,
                  width: Math.abs(c.v) * 50 + '%',
                  top: 0, bottom: 0,
                  background: c.v >= 0 ? T.good : T.bad,
                }} />
              </div>
              <span className="tns-mono" style={{ fontSize: 12, color: c.v >= 0 ? T.good : T.bad, minWidth: 36, textAlign: 'right' }}>
                {c.v > 0 ? '+' : ''}{c.v.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, padding: '12px 14px', background: T.surface, fontSize: 11.5, color: T.textDim, lineHeight: 1.55, borderLeft: `2px solid ${T.accent}` }}>
          Paused squats have correlated positively with your squat gains across 3 consecutive blocks. They've been pre-selected as the primary squat assistance in block 05.
        </div>
      </div>
      <TabBar active="block" onNavigate={onNavigate} />
    </Phone>
  );
}
