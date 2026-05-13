import { useNavigate } from 'react-router-dom';
import { T, Phone, AppHeader, PrimaryBtn } from '../../shared';

interface WarmupSet {
  l: string;
  r: number;
  done: boolean;
  current?: boolean;
  rpe?: string;
}

export default function Warmup() {
  const navigate = useNavigate();

  const sets: WarmupSet[] = [
    { l: 'Bar', r: 10, done: true },
    { l: '85 kg', r: 5, done: true },
    { l: '115 kg', r: 3, done: true },
    { l: '145 kg', r: 2, done: true, current: false },
    { l: '170 kg', r: 1, done: false, current: true },
    { l: '185 kg · BENCHMARK', r: 1, done: false, rpe: 'RPE 8 target' },
  ];

  return (
    <Phone>
      <AppHeader eyebrow="Back squat · Warm-up" title="Ramp" back onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Rest timer */}
        <div style={{ border: `1px solid ${T.line}`, padding: '16px 18px', marginBottom: 14, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div className="tns-eyebrow" style={{ marginBottom: 4 }}>Rest</div>
            <span className="tns-serif" style={{ fontSize: 46, lineHeight: 0.9 }}>1:24</span>
          </div>
          <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.1em' }}>SKIP →</div>
        </div>

        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Warm-up progression</div>
        <div style={{ border: `1px solid ${T.line}` }}>
          {sets.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '14px 16px',
              borderBottom: i < sets.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
              background: s.current ? 'rgba(255,110,58,0.06)' : 'transparent',
            }}>
              <div style={{
                width: 16, height: 16, marginRight: 12,
                border: `1.5px solid ${s.done ? T.accent : T.line}`,
                background: s.done ? T.accent : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.done && (
                  <svg width="9" height="7" viewBox="0 0 9 7">
                    <path d="M1 3.5L3.5 6L8 1" stroke="#1a0f08" strokeWidth="1.5" fill="none" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div className="tns-mono" style={{ fontSize: 13, fontWeight: s.current ? 600 : 400, color: s.current ? T.accent : T.text }}>{s.l}</div>
                {s.rpe && <div style={{ fontSize: 10, color: T.caution, marginTop: 2, fontFamily: T.mono, letterSpacing: '0.04em' }}>{s.rpe}</div>}
              </div>
              <span className="tns-mono" style={{ fontSize: 13, color: T.textDim }}>× {s.r}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, padding: '12px 14px', background: T.surface, fontSize: 11.5, color: T.textDim, lineHeight: 1.55 }}>
          <span className="tns-mono" style={{ fontSize: 9, color: T.accent, letterSpacing: '0.08em' }}>BENCHMARK SET</span>
          <div style={{ marginTop: 4 }}>
            A single at RPE 8 calibrates today's readiness against projected load. If it's heavier or lighter than expected, the system rescales your back-offs.
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn onClick={() => navigate('/session/topset')}>Log set →</PrimaryBtn>
      </div>
    </Phone>
  );
}
