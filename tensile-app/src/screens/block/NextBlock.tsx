import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, TabBar, T, PrimaryBtn } from '../../shared';

export default function NextBlock() {
  const navigate = useNavigate();

  const onNavigate = (id: string) => {
    navigate('/' + id);
  };

  return (
    <Phone>
      <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="tns-eyebrow">Block 05 · proposed</div>
        <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>6 / 6</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 34, lineHeight: 1, marginBottom: 4 }}>Next block</div>
        <div className="tns-eyebrow" style={{ marginBottom: 18 }}>Begins Mon · May 20 · after pivot</div>

        {/* Headline params */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: T.line, border: `1px solid ${T.line}`, marginBottom: 18 }}>
          {[
            ['Type', 'DEV.'],
            ['Phase', 'INTENS.'],
            ['TTP est.', '6 WK'],
          ].map(([l, v], i) => (
            <div key={i} style={{ background: T.bg, padding: '12px 14px' }}>
              <div className="tns-eyebrow" style={{ fontSize: 8, marginBottom: 4 }}>{l}</div>
              <div className="tns-mono" style={{ fontSize: 14 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Changes from current */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Changes from block 04</div>
        <div style={{ border: `1px solid ${T.line}`, marginBottom: 18 }}>
          {[
            { sym: '↑', l: 'Primary lift RPE band → 8.0–9.0', sub: 'Shift to intensification phase', c: T.accent },
            { sym: '↓', l: 'Drop-target → 6% (from 12%)', sub: 'Lower volume, higher quality', c: T.accent },
            { sym: '↔', l: 'Paused squat retained as Sat. assist', sub: 'r = 0.68 · 3-block correlation', c: T.good },
            { sym: '↓', l: 'Front squat removed', sub: 'r = 0.18 · no signal', c: T.textDim },
            { sym: '+', l: 'Hip thrust added · 2 sets / wk', sub: 'r = 0.55 · weak-point coverage', c: T.good },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: i < 4 ? `1px solid ${T.lineSoft}` : 'none', gap: 12 }}>
              <span className="tns-mono" style={{ fontSize: 18, color: c.c, width: 18 }}>{c.sym}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5 }}>{c.l}</div>
                <div style={{ fontSize: 10.5, color: T.textDim, marginTop: 2 }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Targets */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Targets · end of block</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { l: 'Squat', from: 218, to: 225 },
            { l: 'Bench', from: 146, to: 150 },
            { l: 'DL', from: 246, to: 252 },
          ].map((t, i) => (
            <div key={i} style={{ flex: 1, border: `1px solid ${T.line}`, padding: '10px 12px' }}>
              <div className="tns-eyebrow" style={{ fontSize: 8, marginBottom: 6 }}>{t.l}</div>
              <div className="tns-mono" style={{ fontSize: 10, color: T.textMute }}>{t.from} →</div>
              <div className="tns-serif" style={{ fontSize: 26, color: T.accent }}>{t.to}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.line}`, display: 'flex', gap: 8 }}>
        <PrimaryBtn dim full={false}>Customise</PrimaryBtn>
        <PrimaryBtn>Start block →</PrimaryBtn>
      </div>
    </Phone>
  );
}
