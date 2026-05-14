import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { getRpePct } from '../../engine';
import { T, Phone, AppHeader, PrimaryBtn } from '../../shared';

export default function Warmup() {
  const navigate = useNavigate();
  const block = useStore(s => s.currentBlock);
  const currentSession = useStore(s => s.currentSession);
  const profile = useStore(s => s.profile);

  const [completedWarmups, setCompletedWarmups] = useState<number[]>([]);
  const [restSeconds, setRestSeconds] = useState(90);
  useEffect(() => {
    if (restSeconds <= 0) return;
    const t = setInterval(() => setRestSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [restSeconds]);

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const ex = currentSession?.exercises?.[currentSession?.currentExerciseIndex || 0];

  // Build warmup steps from the prescribed top-set load
  let warmupSets: { l: string; r: number; rpe?: string }[] = [
    { l: 'Bar', r: 10 },
    { l: '60 kg', r: 5 },
    { l: '80 kg', r: 3 },
    { l: '100 kg', r: 1 },
  ];

  if (ex && block) {
    const liftKey = ex.id === 'barbell_back_squat' ? 'squat' : ex.id === 'bench_press' ? 'bench' : ex.id === 'conventional_deadlift' ? 'deadlift' : 'squat';
    const pct = getRpePct(ex.reps, ex.rpeTarget);
    const e1rm = profile.e1rm[liftKey] || 200;
    const prescribedLoad = ex.prescribedLoad ?? Math.round(e1rm * pct / 2.5) * 2.5;

    warmupSets = [
      { l: 'Bar', r: 10 },
      { l: `${Math.round(prescribedLoad * 0.5 / 2.5) * 2.5} kg`, r: 5 },
      { l: `${Math.round(prescribedLoad * 0.7 / 2.5) * 2.5} kg`, r: 3 },
      { l: `${Math.round(prescribedLoad * 0.85 / 2.5) * 2.5} kg`, r: 2 },
      { l: `${Math.round(prescribedLoad * 0.95 / 2.5) * 2.5} kg`, r: 1 },
      { l: `${prescribedLoad} kg · BENCHMARK`, r: 1, rpe: `RPE ${ex.rpeTarget} target` },
    ];
  }

  const toggleWarmup = (i: number) => {
    setCompletedWarmups(prev =>
      prev.includes(i) ? prev.filter(j => j !== i) : [...prev, i]
    );
  };

  return (
    <Phone>
      <AppHeader eyebrow={`${ex?.name || 'Back squat'} · Warm-up`} title="Ramp" back onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Rest timer */}
        <div style={{ border: `1px solid ${T.line}`, padding: '16px 18px', marginBottom: 14, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div className="tns-eyebrow" style={{ marginBottom: 4 }}>Rest</div>
            <span className="tns-serif" style={{ fontSize: 46, lineHeight: 0.9 }}>{fmtTime(restSeconds)}</span>
          </div>
          <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.1em', cursor: 'pointer' }} onClick={() => navigate('/session/topset')}>SKIP →</div>
        </div>

        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Warm-up progression</div>
        <div style={{ border: `1px solid ${T.line}` }}>
          {warmupSets.map((s, i) => {
            const done = completedWarmups.includes(i);
            const firstIncomplete = warmupSets.findIndex((_, j) => !completedWarmups.includes(j));
            const current = firstIncomplete === i;
            return (
              <div key={i} onClick={() => toggleWarmup(i)} style={{
                display: 'flex', alignItems: 'center', padding: '14px 16px',
                borderBottom: i < warmupSets.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
                background: current ? 'rgba(255,110,58,0.06)' : 'transparent',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 16, height: 16, marginRight: 12,
                  border: `1.5px solid ${done ? T.accent : T.line}`,
                  background: done ? T.accent : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {done && (
                    <svg width="9" height="7" viewBox="0 0 9 7">
                      <path d="M1 3.5L3.5 6L8 1" stroke="#1a0f08" strokeWidth="1.5" fill="none" />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="tns-mono" style={{ fontSize: 13, fontWeight: current ? 600 : 400, color: current ? T.accent : T.text }}>{s.l}</div>
                  {s.rpe && <div style={{ fontSize: 10, color: T.caution, marginTop: 2, fontFamily: T.mono, letterSpacing: '0.04em' }}>{s.rpe}</div>}
                </div>
                <span className="tns-mono" style={{ fontSize: 13, color: T.textDim }}>× {s.r}</span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, padding: '12px 14px', background: T.surface, fontSize: 11.5, color: T.textDim, lineHeight: 1.55 }}>
          <span className="tns-mono" style={{ fontSize: 9, color: T.accent, letterSpacing: '0.08em' }}>BENCHMARK SET</span>
          <div style={{ marginTop: 4 }}>
            A single at RPE {ex?.rpeTarget ?? 8} calibrates today's readiness against projected load. If it's heavier or lighter than expected, the system rescales your back-offs.
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn onClick={() => navigate('/session/topset')}>Start top set →</PrimaryBtn>
      </div>
    </Phone>
  );
}
