import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, TabBar, T, Chart } from '../../shared';

export default function Readiness() {
  const navigate = useNavigate();
  const rcs = [76, 74, 72, 70, 68, 64, 58];
  const hrv = [0, -1, -2, -3, -4, -6, -8];

  const onNavigate = (id: string) => {
    navigate('/' + id);
  };

  return (
    <Phone>
      <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="tns-eyebrow">Block 04 · 7 weeks · closed</div>
        <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>3 / 6 ›</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 34, lineHeight: 1, marginBottom: 4 }}>Readiness</div>
        <div className="tns-eyebrow" style={{ marginBottom: 20 }}>Weekly composite trend</div>

        <div style={{ marginBottom: 20 }}>
          <Chart data={rcs} color={T.text} w={320} h={90} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: T.mono, fontSize: 9, color: T.textMute, letterSpacing: '0.06em' }}>
            <span>W1 · 76</span><span>W4 · 70</span><span>W7 · 58</span>
          </div>
        </div>

        {/* Soreness heatmap */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Soreness · agonist-group dot grid</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 8 }}>
          {[
            ...[6,7,6,7,5,8,6],
            ...[7,6,5,6,4,7,5],
            ...[6,5,4,5,3,6,4],
            ...[5,4,3,4,3,5,3],
          ].map((v, i) => (
            <div key={i} style={{
              aspectRatio: '1', background: T.surface,
              borderLeft: `3px solid ${v >= 6 ? T.good : v >= 4 ? T.caution : T.bad}`,
              fontFamily: T.mono, fontSize: 10, padding: '3px 4px',
            }}>{v}</div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 9, color: T.textMute, letterSpacing: '0.06em', marginBottom: 22 }}>
          <span>QUAD</span><span>HAM</span><span>CHEST</span><span>BACK</span>
        </div>

        {/* HRV trend */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>HRV · 7-day deviation from 28-day baseline</div>
        <div style={{ marginBottom: 22 }}>
          <Chart data={hrv} color={T.caution} w={320} h={70} ticks={3} />
        </div>

        {/* Modifier session count */}
        <div style={{ border: `1px solid ${T.line}`, padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="tns-eyebrow">Sessions with RCS prescription mod.</div>
            <span className="tns-serif" style={{ fontSize: 28 }}>9</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>
            7 reductions · 2 elevated readiness bumps. Clustered in weeks 6–7 — supports peak detection.
          </div>
        </div>
      </div>
      <TabBar active="block" onNavigate={onNavigate} />
    </Phone>
  );
}
