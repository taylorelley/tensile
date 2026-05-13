import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, TabBar, T } from '../../shared';

export default function Audit() {
  const navigate = useNavigate();
  const entries = [
    { wk: 'WK 7', t: '13 MAY · 09:14', rule: 'PEAK_DETECTED', trigger: 'Rolling e1RM ↓ 2 consecutive wk after rise', action: 'Block 04 marked complete · deload evaluation triggered', ref: '§6.6' },
    { wk: 'WK 7', t: '11 MAY · 07:02', rule: 'RCS_BAND_LOW', trigger: 'RCS 54 · band: poor', action: 'Volume −18%, RPE cap −1 pt, deload prompt shown', ref: '§6.3' },
    { wk: 'WK 6', t: '07 MAY · 18:33', rule: 'ACCESSORY_SWAP', trigger: 'User swapped front squat → paused squat', action: 'Logged to responsiveness tracker (3rd block)', ref: '§7.5' },
    { wk: 'WK 5', t: '03 MAY · 09:21', rule: 'BENCHMARK_ELEVATED', trigger: 'Benchmark RPE 7.0 vs projected 8.0', action: 'Back-off loads scaled +2.5%', ref: '§4.5.2' },
    { wk: 'WK 3', t: '23 APR · 09:10', rule: 'VOLUME_RAMP', trigger: 'Recovery signal 82 · excellent', action: 'Quad sets +1 to MAV target', ref: '§6.5' },
  ];

  const onNavigate = (id: string) => {
    navigate('/' + id);
  };

  return (
    <Phone>
      <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="tns-eyebrow">Block 04 · 7 weeks · closed</div>
        <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>5 / 6 ›</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 34, lineHeight: 1, marginBottom: 4 }}>Audit</div>
        <div className="tns-eyebrow" style={{ marginBottom: 18 }}>Every engine decision · 38 entries</div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: T.line, border: `1px solid ${T.line}`, marginBottom: 18 }}>
          {[
            ['Auto', '38'],
            ['Overrides', '11'],
            ['Adherence', '92%'],
          ].map(([l, v], i) => (
            <div key={i} style={{ background: T.bg, padding: '12px 14px' }}>
              <div className="tns-eyebrow" style={{ fontSize: 8, marginBottom: 4 }}>{l}</div>
              <div className="tns-mono" style={{ fontSize: 16 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Log entries */}
        {entries.map((e, i) => (
          <div key={i} style={{ padding: '14px 0', borderBottom: i < entries.length - 1 ? `1px solid ${T.lineSoft}` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
              <span className="tns-mono" style={{ fontSize: 9.5, color: T.accent, letterSpacing: '0.08em', background: 'rgba(255,110,58,0.08)', padding: '2px 6px' }}>{e.rule}</span>
              <span className="tns-mono" style={{ fontSize: 9, color: T.textMute, letterSpacing: '0.06em' }}>{e.t}</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.textDim, lineHeight: 1.5 }}>
              <span style={{ color: T.textMute }}>IF</span> {e.trigger}
            </div>
            <div style={{ fontSize: 11.5, color: T.text, lineHeight: 1.5, marginTop: 2 }}>
              <span style={{ color: T.textMute }}>THEN</span> {e.action}
            </div>
            <div className="tns-mono" style={{ fontSize: 9, color: T.textMute, marginTop: 4, letterSpacing: '0.06em' }}>PRD {e.ref}</div>
          </div>
        ))}
      </div>
      <TabBar active="block" onNavigate={onNavigate} />
    </Phone>
  );
}
