import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, type SetLog } from '../../store';
import { T, Phone, AppHeader, PrimaryBtn, Stat, StepDots } from '../../shared';

export default function Summary() {
  const navigate = useNavigate();
  const block = useStore(s => s.currentBlock);
  const currentSession = useStore(s => s.currentSession);
  const profile = useStore(s => s.profile);
  const completeSession = useStore(s => s.completeSession);
  const updateSession = useStore(s => s.updateSession);
  const [srpe, setSrpe] = useState(7);

  if (!currentSession || !block) {
    return (
      <Phone>
        <AppHeader eyebrow="Session complete" title="Wrap" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1, marginBottom: 12 }}>No session data</div>
            <div style={{ fontSize: 13, color: T.textDim }}>Complete a session first.</div>
          </div>
        </div>
        <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
          <PrimaryBtn onClick={() => navigate('/')}>Back to Today →</PrimaryBtn>
        </div>
      </Phone>
    );
  }

  const volumeLoad = currentSession.volumeLoad || 0;
  const sfi = currentSession.sfi || 0;
  const sets = currentSession.sets || [];

  // Determine current exercise
  const currentIdx = currentSession.currentExerciseIndex || 0;
  const ex = currentSession.exercises?.[currentIdx];
  const PRIMARY_IDS = ['barbell_back_squat', 'bench_press', 'conventional_deadlift'];
  const isPrimaryLift = PRIMARY_IDS.includes(ex?.id ?? '');
  const liftKey = ex?.id === 'barbell_back_squat' ? 'squat' : ex?.id === 'bench_press' ? 'bench' : ex?.id === 'conventional_deadlift' ? 'deadlift' : 'squat';
  const primaryE1rm = isPrimaryLift ? profile.e1rm[liftKey] : null;
  const liftName = ex?.name || 'Primary';

  // Find pre-session baseline: best e1RM from most recent completed session of same lift, or rolling e1RM
  const preSessionBaseline = (() => {
    if (!block || !isPrimaryLift) return profile.rollingE1rm[liftKey] || 0;
    const priorSessions = block.sessions
      .filter(s => s.status === 'COMPLETE' && s.id !== currentSession.id)
      .sort((a, b) => new Date(b.completedDate || b.scheduledDate).getTime() - new Date(a.completedDate || a.scheduledDate).getTime());
    for (const s of priorSessions) {
      const liftSets = s.sets.filter(set => set.exerciseId === ex?.id && set.setType === 'TOP_SET');
      if (liftSets.length > 0) return Math.max(...liftSets.map(set => set.e1rm));
    }
    return profile.rollingE1rm[liftKey] || 0;
  })();

  const hasMoreExercises = currentIdx < (currentSession.exercises?.length || 0) - 1;

  const handleLogSession = () => {
    if (hasMoreExercises) {
      updateSession(block.id, currentSession.id, { currentExerciseIndex: currentIdx + 1 });
      navigate('/session/warmup');
    } else {
      completeSession(block.id, currentSession.id, srpe);
      navigate('/');
    }
  };

  return (
    <Phone>
      <AppHeader eyebrow={hasMoreExercises ? 'Exercise complete' : 'Session complete'} title="Wrap" />
      <div style={{ padding: '0 22px 8px' }}>
        <StepDots step={6} total={6} />
      </div>
      <div className="route-enter" style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* sRPE prompt — 5-point scale */}
        <div style={{ border: `1px solid ${T.line}`, padding: '14px 16px', marginBottom: 14 }}>
          <div className="tns-eyebrow" style={{ marginBottom: 8 }}>How hard was the overall session?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 6 }}>
            {([
              { label: 'Easy', val: 3 },
              { label: 'Moderate', val: 5 },
              { label: 'Hard', val: 7 },
              { label: 'Very Hard', val: 9 },
              { label: 'Maximal', val: 10 },
            ] as const).map((opt) => (
              <button type="button" key={opt.val} aria-pressed={srpe === opt.val} aria-label={`Session RPE ${opt.val} - ${opt.label}`} onClick={() => setSrpe(opt.val)} style={{
                padding: '12px 0', textAlign: 'center', cursor: 'pointer',
                border: `1px solid ${srpe === opt.val ? T.accent : T.line}`,
                background: srpe === opt.val ? T.accent : 'transparent',
                color: srpe === opt.val ? '#1a0f08' : T.text,
                fontFamily: T.mono, fontSize: 10, minHeight: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 11, fontWeight: 500 }}>{opt.label}</span>
                <span style={{ fontSize: 9, color: srpe === opt.val ? '#1a0f08' : T.textMute }}>sRPE {opt.val}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Big metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: T.line, marginBottom: 14, border: `1px solid ${T.line}` }}>
          <div style={{ background: T.bg, padding: '16px 16px' }}>
            <Stat label="Volume Load" value={String(volumeLoad)} unit="KG" size={40} />
          </div>
          <div style={{ background: T.bg, padding: '16px 16px' }}>
            <Stat label="SFI" value={sfi.toFixed(1)} unit="HEUR." size={40} />
          </div>
          <div style={{ background: T.bg, padding: '16px 16px' }}>
            <Stat label="Volume" value={(volumeLoad / 1000).toFixed(1)} unit="K KG" size={40} />
          </div>
          <div style={{ background: T.bg, padding: '16px 16px' }}>
            <Stat label={isPrimaryLift ? `${liftName} e1RM` : 'e1RM'} value={primaryE1rm != null ? primaryE1rm.toFixed(0) : '—'} unit={primaryE1rm != null ? 'KG' : ''} size={40} />
          </div>
        </div>

        {/* Notable flags — dynamic analysis */}
        {(() => {
          const flags: { color: string; label: string; message: string }[] = [];

          // e1RM gain on primary lift (compare to pre-session baseline, not already-updated rolling)
          const topSets = sets.filter(s => s.setType === 'TOP_SET');
          if (topSets.length > 0 && preSessionBaseline > 0) {
            const bestE1rm = Math.max(...topSets.map(s => s.e1rm));
            const gain = ((bestE1rm - preSessionBaseline) / preSessionBaseline) * 100;
            if (gain >= 1.0) {
              flags.push({ color: T.good, label: 'GAIN', message: `${liftName} e1RM up ${gain.toFixed(1)}% — strong session.` });
            } else if (gain <= -1.0) {
              flags.push({ color: T.bad, label: 'DIP', message: `${liftName} e1RM down ${Math.abs(gain).toFixed(1)}% — monitor fatigue.` });
            }
          }

          // High SFI warning
          if (sfi > 50) {
            flags.push({ color: T.caution, label: 'HIGH SFI', message: `Session fatigue index ${sfi.toFixed(0)} — elevated systemic load.` });
          }

          // Back-off termination efficiency
          const backOffSets = sets.filter(s => s.setType === 'BACK_OFF');
          if (backOffSets.length > 0) {
            const terminated = backOffSets.filter(s => s.actualRpe >= s.prescribedRpeTarget);
            if (terminated.length > 0 && backOffSets.length <= 2) {
              flags.push({ color: T.good, label: 'EFFICIENT', message: `Back-off terminated in ${backOffSets.length} set${backOffSets.length > 1 ? 's' : ''} — low residual fatigue.` });
            } else if (backOffSets.length >= 6) {
              flags.push({ color: T.caution, label: 'HIGH VOLUME', message: `${backOffSets.length} back-off sets completed — high work capacity today.` });
            }
          }

          // Overrides used
          if (currentSession.overrides && currentSession.overrides.length > 0) {
            flags.push({ color: T.accent, label: 'OVERRIDE', message: `${currentSession.overrides.length} adjustment${currentSession.overrides.length > 1 ? 's' : ''} logged this session.` });
          }

          // Fallback if no flags
          if (flags.length === 0) {
            flags.push({ color: T.textDim, label: 'SESSION', message: `${sets.length} set${sets.length !== 1 ? 's' : ''} logged · SFI ${sfi.toFixed(1)} · ${(volumeLoad / 1000).toFixed(1)}K KG volume.` });
          }

          return flags.map((f, i) => (
            <div key={i} style={{ background: T.surface, padding: '12px 14px', borderLeft: `2px solid ${f.color}`, marginBottom: i < flags.length - 1 ? 8 : 14 }}>
              <span className="tns-mono" style={{ fontSize: 9, color: f.color, letterSpacing: '0.08em' }}>{f.label}</span>
              <div style={{ marginTop: 4, fontSize: 12.5, color: T.text, lineHeight: 1.55 }}>{f.message}</div>
            </div>
          ));
        })()}

        {/* Set log — grouped by exercise */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Set log</div>
        {sets.length === 0 ? (
          <div style={{ border: `1px solid ${T.line}`, padding: '12px', color: T.textMute, fontFamily: T.mono, fontSize: 11 }}>No sets logged yet.</div>
        ) : (
          (() => {
            const grouped: Record<string, SetLog[]> = {};
            sets.forEach(s => {
              if (!grouped[s.exerciseId]) grouped[s.exerciseId] = [];
              grouped[s.exerciseId].push(s);
            });
            const exMap = Object.fromEntries((currentSession.exercises || []).map(e => [e.id, e.name]));
            return Object.entries(grouped).map(([exId, exSets], gi) => (
              <div key={exId} style={{ marginBottom: gi < Object.keys(grouped).length - 1 ? 8 : 0 }}>
                <div className="tns-eyebrow" style={{ fontSize: 9, marginBottom: 4, color: T.textDim }}>{exMap[exId] || exId}</div>
                <div style={{ border: `1px solid ${T.line}`, fontFamily: T.mono, fontSize: 11.5 }}>
                  {exSets.map((s, i) => {
                    const typeLabel = s.setType === 'TOP_SET' ? 'TOP' : s.setType === 'BACK_OFF' ? (s.actualRpe >= s.prescribedRpeTarget ? 'TERM' : 'B-O') : s.setType;
                    return (
                      <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 70px 50px', padding: '10px 12px', borderBottom: i < exSets.length - 1 ? `1px solid ${T.lineSoft}` : 'none', alignItems: 'center' }}>
                        <span style={{ color: T.textMute, letterSpacing: '0.04em' }}>SET {i + 1}</span>
                        <span>{s.actualLoad} × {s.actualReps}</span>
                        <span style={{ color: T.textDim }}>RPE {s.actualRpe}</span>
                        <span style={{ fontSize: 9, color: typeLabel === 'TERM' ? T.accent : T.textMute, letterSpacing: '0.08em' }}>{typeLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()
        )}
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn onClick={handleLogSession}>{hasMoreExercises ? 'Next exercise →' : 'Log session →'}</PrimaryBtn>
      </div>
    </Phone>
  );
}
