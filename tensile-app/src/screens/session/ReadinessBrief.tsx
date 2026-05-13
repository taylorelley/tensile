import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { rcsBand } from '../../engine';
import { T, Phone, AppHeader, PrimaryBtn } from '../../shared';

export default function ReadinessBrief() {
  const navigate = useNavigate();
  const block = useStore(s => s.currentBlock);
  const currentSession = useStore(s => s.currentSession);

  const rcs = currentSession?.rcs ?? 72;
  const { band, modifier } = rcsBand(rcs);

  const bands = [
    [0, 40, T.bad],
    [40, 55, '#a04030'],
    [55, 70, T.caution],
    [70, 85, T.good],
    [85, 100, T.accent],
  ] as const;

  const contributions = [
    { l: 'Wellness composite', v: '+74', c: T.good },
    { l: 'HRV trend modifier', v: '−2', c: T.caution },
    { l: 'RPE drift (3 sess.)', v: '−0', c: T.textDim },
    { l: 'Bench from 3 days ago', v: '+0', c: T.textDim },
  ];

  return (
    <Phone>
      <AppHeader eyebrow="Readiness composite" title="Session brief" back onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* RCS dial */}
        <div style={{ border: `1px solid ${T.line}`, padding: '24px 18px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Readiness composite score</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <span className="tns-serif" style={{ fontSize: 96, lineHeight: 0.85, color: T.accent }}>{rcs}</span>
            <span className="tns-mono" style={{ fontSize: 12, color: T.textDim, letterSpacing: '0.06em' }}>/ 100</span>
            <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.1em', marginLeft: 'auto' }}>{band.toUpperCase()}</span>
          </div>
          {/* Band scale */}
          <div style={{ display: 'flex', gap: 2, height: 6, marginBottom: 6 }}>
            {bands.map(([s, e, c], i) => (
              <div key={i} style={{ flex: e - s, background: c, opacity: rcs >= s && rcs < e ? 1 : 0.18 }} />
            ))}
          </div>
          <div style={{ position: 'relative', height: 14 }}>
            <div style={{ position: 'absolute', left: `${rcs}%`, transform: 'translateX(-50%)', top: 0, fontFamily: T.mono, fontSize: 9, color: T.text }}>▲ {rcs}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 9, color: T.textMute, letterSpacing: '0.06em' }}>
            <span>0</span><span>40</span><span>55</span><span>70</span><span>85</span><span>100</span>
          </div>
        </div>

        {/* Contributions */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Contributions</div>
        <div style={{ border: `1px solid ${T.line}`, marginBottom: 14 }}>
          {contributions.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderBottom: i < 3 ? `1px solid ${T.lineSoft}` : 'none' }}>
              <span style={{ fontSize: 12.5, color: T.textDim }}>{r.l}</span>
              <span className="tns-mono" style={{ fontSize: 13, color: r.c }}>{r.v}</span>
            </div>
          ))}
        </div>

        {/* Prescription modifier */}
        <div style={{ background: T.surface, padding: '14px 16px', borderLeft: `2px solid ${T.accent}` }}>
          <div className="tns-eyebrow" style={{ marginBottom: 8, color: T.accent }}>Prescription · {band}</div>
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.55, marginBottom: 8 }}>
            {modifier}
          </div>
          <div style={{ display: 'flex', gap: 14, paddingTop: 8, borderTop: `1px solid ${T.line}` }}>
            <div>
              <div className="tns-eyebrow" style={{ fontSize: 8, marginBottom: 3 }}>TOP SET</div>
              <span className="tns-mono" style={{ fontSize: 13 }}>185 kg × 3</span>
            </div>
            <div>
              <div className="tns-eyebrow" style={{ fontSize: 8, marginBottom: 3 }}>BACK-OFF</div>
              <span className="tns-mono" style={{ fontSize: 13 }}>163 kg × 3</span>
            </div>
            <div>
              <div className="tns-eyebrow" style={{ fontSize: 8, marginBottom: 3 }}>STOP @</div>
              <span className="tns-mono" style={{ fontSize: 13 }}>RPE 8.5</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn onClick={() => navigate('/session/warmup')}>Start warm-up →</PrimaryBtn>
      </div>
    </Phone>
  );
}
