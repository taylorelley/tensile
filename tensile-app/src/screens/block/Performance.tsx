import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, TabBar, T, Chart, Spark } from '../../shared';

export default function Performance() {
  const navigate = useNavigate();
  const squat = [205, 209, 212, 215, 218, 217, 215];

  const onNavigate = (id: string) => {
    navigate('/' + id);
  };

  return (
    <Phone>
      <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="tns-eyebrow">Block 04 · 7 weeks · closed</div>
        <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>1 / 6 ›</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 34, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 4 }}>
          Performance
        </div>
        <div className="tns-eyebrow" style={{ marginBottom: 20 }}>Apr 02 – May 13 · Development</div>

        {/* Headline e1RM */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Squat · rolling e1RM</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="tns-serif" style={{ fontSize: 64, lineHeight: 0.85 }}>218.4</span>
              <span className="tns-mono" style={{ fontSize: 11, color: T.textDim }}>KG</span>
            </div>
            <div className="tns-mono" style={{ fontSize: 11, color: T.good, marginTop: 6, letterSpacing: '0.06em' }}>
              + 6.5 KG  ·  + 3.1 %  ·  CONFIRMED PEAK WK 5
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <Chart data={squat} peak={4} w={320} h={110} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: T.mono, fontSize: 9, color: T.textMute, letterSpacing: '0.06em' }}>
            <span>WK 1</span><span>WK 3</span><span>WK 5</span><span>WK 7</span>
          </div>
        </div>

        {/* Other lifts */}
        <div className="tns-eyebrow" style={{ marginTop: 26, marginBottom: 10 }}>Other primary lifts</div>
        <div style={{ border: `1px solid ${T.line}` }}>
          {[
            { l: 'Bench press', v: '146.0', d: '+ 2.4 %', s: [140, 141, 143, 144, 146, 145, 144] },
            { l: 'Deadlift', v: '245.5', d: '+ 4.7 %', s: [232, 236, 240, 243, 246, 244, 240] },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < 1 ? `1px solid ${T.lineSoft}` : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{r.l}</div>
                <div className="tns-mono" style={{ fontSize: 10, color: T.good, marginTop: 2 }}>{r.d}</div>
              </div>
              <Spark data={r.s} w={70} h={22} />
              <div style={{ textAlign: 'right', minWidth: 70 }}>
                <span className="tns-serif" style={{ fontSize: 22 }}>{r.v}</span>
                <span className="tns-mono" style={{ fontSize: 9, color: T.textMute, marginLeft: 3 }}>KG</span>
              </div>
            </div>
          ))}
        </div>

        {/* TTP */}
        <div className="tns-eyebrow" style={{ marginTop: 24, marginBottom: 10 }}>Time-to-peak</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: T.line, border: `1px solid ${T.line}` }}>
          {[
            ['This block', '5', 'WK', T.accent],
            ['Last 3 avg', '5.7', 'WK', T.text],
            ['Pattern', 'Dip→', 'PROG', T.text],
          ].map(([l, v, u, c], i) => (
            <div key={i} style={{ background: T.bg, padding: '12px 14px' }}>
              <div className="tns-eyebrow" style={{ fontSize: 8.5, marginBottom: 4 }}>{l}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span className="tns-serif" style={{ fontSize: 26, color: c as string }}>{v}</span>
                <span className="tns-mono" style={{ fontSize: 9, color: T.textMute }}>{u}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="block" onNavigate={onNavigate} />
    </Phone>
  );
}
