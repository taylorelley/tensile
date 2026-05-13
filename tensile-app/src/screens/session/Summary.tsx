import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { T, Phone, AppHeader, PrimaryBtn, Stat } from '../../shared';

export default function Summary() {
  const navigate = useNavigate();
  const profile = useStore(s => s.profile);
  const [srpe, setSrpe] = useState(7);

  const squatE1rm = profile.e1rm.squat.toFixed(0);

  return (
    <Phone>
      <AppHeader eyebrow="Session complete · 64 min" title="Wrap" />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* sRPE prompt */}
        <div style={{ border: `1px solid ${T.line}`, padding: '14px 16px', marginBottom: 14 }}>
          <div className="tns-eyebrow" style={{ marginBottom: 8 }}>How hard was the overall session?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: 3, marginBottom: 6 }}>
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} onClick={() => setSrpe(i)} style={{
                padding: '10px 0', textAlign: 'center', cursor: 'pointer',
                border: `1px solid ${i === srpe ? T.accent : T.line}`,
                background: i === srpe ? T.accent : 'transparent',
                color: i === srpe ? '#1a0f08' : T.text,
                fontFamily: T.mono, fontSize: 11,
              }}>{i}</div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 9, color: T.textMute, letterSpacing: '0.06em' }}>
            <span>NOTHING</span><span>HARD</span><span>MAXIMAL</span>
          </div>
        </div>

        {/* Big metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: T.line, marginBottom: 14, border: `1px solid ${T.line}` }}>
          <div style={{ background: T.bg, padding: '16px 16px' }}>
            <Stat label="sRPE Load" value="448" unit="AU" size={40} />
          </div>
          <div style={{ background: T.bg, padding: '16px 16px' }}>
            <Stat label="SFI" value="84.2" unit="HEUR." size={40} delta="+8% vs avg" />
          </div>
          <div style={{ background: T.bg, padding: '16px 16px' }}>
            <Stat label="Volume" value="9.4" unit="K KG" size={40} />
          </div>
          <div style={{ background: T.bg, padding: '16px 16px' }}>
            <Stat label="Squat e1RM" value={squatE1rm} unit="KG" size={40} delta="+2.4%" />
          </div>
        </div>

        {/* Notable flags */}
        <div style={{ background: T.surface, padding: '12px 14px', borderLeft: `2px solid ${T.good}`, marginBottom: 14 }}>
          <span className="tns-mono" style={{ fontSize: 9, color: T.good, letterSpacing: '0.08em' }}>NOTABLE</span>
          <div style={{ marginTop: 4, fontSize: 12.5, color: T.text, lineHeight: 1.55 }}>
            Squat e1RM up <span className="tns-mono">2.4%</span> from last Wednesday's session. The benchmark set landed at RPE 7.5 vs projected 8 — readiness was elevated.
          </div>
        </div>

        {/* Set log preview */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Set log · Back squat</div>
        <div style={{ border: `1px solid ${T.line}`, fontFamily: T.mono, fontSize: 11.5 }}>
          {[
            ['SET 1', '185 × 3', 'RPE 8.0', 'TOP'],
            ['SET 2', '163 × 3', 'RPE 8.0', 'B-O'],
            ['SET 3', '163 × 3', 'RPE 8.5', 'B-O'],
            ['SET 4', '163 × 3', 'RPE 9.0', 'TERM'],
          ].map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 70px 50px', padding: '10px 12px', borderBottom: i < 3 ? `1px solid ${T.lineSoft}` : 'none', alignItems: 'center' }}>
              <span style={{ color: T.textMute, letterSpacing: '0.04em' }}>{r[0]}</span>
              <span>{r[1]}</span>
              <span style={{ color: T.textDim }}>{r[2]}</span>
              <span style={{ fontSize: 9, color: i === 3 ? T.accent : T.textMute, letterSpacing: '0.08em' }}>{r[3]}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn onClick={() => navigate('/')}>Log session →</PrimaryBtn>
      </div>
    </Phone>
  );
}
