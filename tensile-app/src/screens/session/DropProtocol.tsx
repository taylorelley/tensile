import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, Phone, PrimaryBtn } from '../../shared';

function RPEPad({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const levels = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4 }}>
      {levels.map(l => (
        <div key={l} onClick={() => onChange(l)} style={{
          padding: '14px 0', textAlign: 'center', cursor: 'pointer',
          border: `1px solid ${l === value ? T.accent : T.line}`,
          background: l === value ? T.accent : 'transparent',
          color: l === value ? '#1a0f08' : T.text,
          fontFamily: T.mono, fontSize: 12, fontWeight: 500,
        }}>{l}</div>
      ))}
    </div>
  );
}

export default function DropProtocol() {
  const navigate = useNavigate();
  const [rpe, setRpe] = useState(8.5);

  const sets = [
    { rpe: 8.0, done: true },
    { rpe: 8.0, done: true },
    { rpe: 8.5, current: true },
    {}, {}, {}, {}, {},
  ];

  return (
    <Phone>
      <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="tns-eyebrow">Back squat · Back-off · Set 3</span>
        <span className="tns-mono" style={{ fontSize: 11, color: T.textMute, cursor: 'pointer' }} onClick={() => navigate('/session/summary')}>END SET ×</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Drop progress */}
        <div style={{ marginBottom: 18 }}>
          <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Load drop protocol · −12%</div>
          <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
            {sets.map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: '14px 0', textAlign: 'center',
                border: `1px solid ${s.current ? T.accent : s.done ? T.line : T.lineSoft}`,
                background: s.current ? T.accent : s.done ? '#26221a' : 'transparent',
                color: s.current ? '#1a0f08' : s.done ? T.text : T.textMute,
                fontFamily: T.mono, fontSize: 11, fontWeight: 500,
              }}>{s.rpe || '—'}</div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 9, color: T.textMute, letterSpacing: '0.06em' }}>
            <span>SET 1</span><span>STOP @ RPE 8.5</span><span>CAP 8</span>
          </div>
        </div>

        {/* Current prescription */}
        <div style={{ border: `1px solid ${T.line}`, padding: '16px 18px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
            <span className="tns-serif" style={{ fontSize: 76, lineHeight: 0.85, color: T.accent }}>163</span>
            <span className="tns-mono" style={{ fontSize: 12, color: T.textDim }}>KG</span>
            <span className="tns-serif" style={{ fontSize: 32, lineHeight: 0.85, marginLeft: 10 }}>× 3</span>
          </div>
          <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.06em' }}>
            BACK-OFF FROM 185 KG  ·  PREVIOUS RPE 8.0
          </div>
        </div>

        {/* RPE input */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Post-set RPE</div>
        <RPEPad value={rpe} onChange={setRpe} />

        <div style={{ marginTop: 16, padding: '12px 14px', background: T.surface, fontSize: 11.5, color: T.textDim, lineHeight: 1.55, borderLeft: `2px solid ${T.caution}` }}>
          <span className="tns-mono" style={{ fontSize: 9, color: T.caution, letterSpacing: '0.08em' }}>NEXT SET PREVIEW</span>
          <div style={{ marginTop: 4 }}>
            If you log RPE ≥ 8.5, the back-off terminates. Otherwise: <span className="tns-mono" style={{ color: T.text }}>163 kg × 3</span> again.
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}`, display: 'flex', gap: 8 }}>
        <PrimaryBtn dim full={false}>+ Set</PrimaryBtn>
        <PrimaryBtn onClick={() => navigate('/session/summary')}>Log set →</PrimaryBtn>
      </div>
    </Phone>
  );
}
