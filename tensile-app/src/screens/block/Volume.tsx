import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, TabBar, T, Chart, ChartBars } from '../../shared';

export default function Volume() {
  const navigate = useNavigate();
  const quads = [12, 13, 14, 15, 16, 17, 14];
  const sfi = [320, 360, 410, 440, 480, 510, 420];

  const onNavigate = (id: string) => {
    navigate('/' + id);
  };

  return (
    <Phone>
      <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="tns-eyebrow">Block 04 · 7 weeks · closed</div>
        <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>2 / 6 ›</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 34, lineHeight: 1, marginBottom: 4 }}>Volume & load</div>
        <div className="tns-eyebrow" style={{ marginBottom: 20 }}>Quads · weekly hard sets</div>

        <div style={{ marginBottom: 28 }}>
          <ChartBars data={quads} w={300} h={100} mev={10} mav={15} mrv={20} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: T.mono, fontSize: 9, color: T.textMute, letterSpacing: '0.06em' }}>
            <span>W1</span><span>W2</span><span>W3</span><span>W4</span><span>W5</span><span>W6</span><span>W7</span>
          </div>
        </div>

        {/* SFI / sRPE */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Session Fatigue Index · <span style={{ color: T.caution }}>HEURISTIC</span></div>
        <div style={{ marginBottom: 22 }}>
          <Chart data={sfi} color={T.caution} w={320} h={80} ticks={3} />
        </div>

        {/* Summary grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: T.line, border: `1px solid ${T.line}`, marginBottom: 12 }}>
          {[
            ['Total volume', '64.2', 'K KG'],
            ['Total sRPE load', '2 856', 'AU'],
            ['Peak ACLR · wk 5', '1.32', '×'],
            ['Sessions logged', '26', '/ 28'],
          ].map(([l, v, u], i) => (
            <div key={i} style={{ background: T.bg, padding: '14px 16px' }}>
              <div className="tns-eyebrow" style={{ fontSize: 8.5, marginBottom: 6 }}>{l}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="tns-serif" style={{ fontSize: 30 }}>{v}</span>
                <span className="tns-mono" style={{ fontSize: 10, color: T.textMute }}>{u}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 14px', background: T.surface, fontSize: 11.5, color: T.textDim, lineHeight: 1.55, borderLeft: `2px solid ${T.caution}` }}>
          ACLR peaked at <span className="tns-mono">1.32</span> in week 5 — below the <span className="tns-mono">1.5</span> warning threshold. Quad volume crossed MAV in week 6; performance regressed week 7 — consistent with MRV-adjacent loading.
        </div>
      </div>
      <TabBar active="block" onNavigate={onNavigate} />
    </Phone>
  );
}
