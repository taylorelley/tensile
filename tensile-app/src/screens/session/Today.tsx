import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { T, Phone, AppHeader, PrimaryBtn, Spark, TabBar } from '../../shared';

export default function Today() {
  const navigate = useNavigate();
  const block = useStore(s => s.currentBlock);
  const profile = useStore(s => s.profile);

  const week = block?.week ?? 3;
  const phase = block?.phase ?? 'ACCUMULATION';

  const lifts = [
    { l: 'Squat', v: profile.e1rm.squat.toFixed(1), d: '+2.1%', s: [200, 204, 208, 206, 212, 215, 218] },
    { l: 'Bench', v: profile.e1rm.bench.toFixed(1), d: '+0.8%', s: [140, 141, 143, 142, 144, 144, 144] },
    { l: 'Deadlift', v: profile.e1rm.deadlift.toFixed(1), d: '+3.4%', s: [230, 232, 235, 234, 238, 240, 241] },
  ];

  const exercises = [
    { n: 'Back squat', set: '4 × 3 @ RPE 8.5', tag: 'PRIMARY' },
    { n: 'Paused squat', set: '3 × 4 @ RPE 8', tag: 'ASSIST' },
    { n: 'Romanian DL', set: '3 × 8 @ RPE 7.5', tag: 'SUPP' },
    { n: 'Leg curl', set: '3 × 12 @ RPE 8', tag: 'SUPP' },
    { n: 'Plank', set: '3 × 45s', tag: 'CORE' },
  ];

  return (
    <Phone>
      <AppHeader
        eyebrow="Wed · May 14"
        title="Today"
        right={<div style={{ width: 28, height: 28, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: 11 }}>MK</div>}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Session card */}
        <div style={{ border: `1px solid ${T.line}`, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: `1px solid ${T.lineSoft}` }}>
            <div>
              <div className="tns-eyebrow" style={{ marginBottom: 4 }}>Session · Week {week} · {phase}</div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1, letterSpacing: '-0.02em' }}>Squat day</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>EST · 62 MIN</div>
              <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', marginTop: 3 }}>5 EXERCISES</div>
            </div>
          </div>
          <div style={{ padding: '10px 16px 12px' }}>
            {exercises.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, width: 12 }}>{i + 1}</span>
                  <span style={{ fontSize: 13 }}>{e.n}</span>
                </div>
                <span className="tns-mono" style={{ fontSize: 10, color: T.textDim, letterSpacing: '0.04em' }}>{e.set}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.lineSoft}`, background: 'rgba(255,110,58,0.04)' }}>
            <PrimaryBtn onClick={() => navigate('/session/wellness')}>Begin wellness check →</PrimaryBtn>
          </div>
        </div>

        {/* Lift dashboard */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Rolling e1RM</div>
        <div style={{ border: `1px solid ${T.line}`, marginBottom: 14 }}>
          {lifts.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < 2 ? `1px solid ${T.lineSoft}` : 'none', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.l}</div>
                <div className="tns-mono" style={{ fontSize: 9.5, color: T.good, marginTop: 2, letterSpacing: '0.04em' }}>{r.d} · 4WK</div>
              </div>
              <Spark data={r.s} w={68} h={22} />
              <div style={{ textAlign: 'right', minWidth: 60 }}>
                <span className="tns-serif" style={{ fontSize: 24 }}>{r.v}</span>
                <span className="tns-mono" style={{ fontSize: 9, color: T.textMute, marginLeft: 3 }}>KG</span>
              </div>
            </div>
          ))}
        </div>

        {/* Block progress strip */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Block progress</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 28, background: i < 2 ? '#26221a' : i === 2 ? T.accent : T.surface, position: 'relative' }}>
              {i === 2 && <div style={{ position: 'absolute', inset: 0, background: T.accent, opacity: 0.4 }} />}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 9, color: T.textMute, letterSpacing: '0.06em' }}>
          <span>WK 1</span><span>WK {week} · NOW</span><span>WK 7 · EST PEAK</span>
        </div>
      </div>
      <TabBar active="today" />
    </Phone>
  );
}
