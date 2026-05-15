import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { T, Phone, PrimaryBtn } from '../../shared';
import { calculateSetSFI } from '../../engine';
import type { SetLog, SessionExercise } from '../../store';

interface OverrideOption {
  icon: string;
  label: string;
  sub: string;
}

const options: OverrideOption[] = [
  { icon: '✎', label: 'RPE correction', sub: 'Edit post-set RPE — recalculates e1RM' },
  { icon: '⚖', label: 'Load modification', sub: 'Train at different load than prescribed' },
  { icon: '−', label: 'Drop next set', sub: 'Terminate back-off early — feeling cooked' },
  { icon: '+', label: 'Add a set', sub: 'Feeling strong; extend back-off' },
  { icon: '↻', label: 'Swap exercise', sub: 'Replace squat with low-bar variation' },
  { icon: '↓', label: 'Lower RPE cap', sub: 'Cap session at RPE 8 — joint flag' },
  { icon: '◐', label: 'Reactive deload', sub: 'End block and begin 1-week deload' },
  { icon: '✕', label: 'End session', sub: 'Save partial; log what was completed' },
];

export default function Override() {
  const navigate = useNavigate();
  const block = useStore(s => s.currentBlock);
  const currentSession = useStore(s => s.currentSession);
  const updateSession = useStore(s => s.updateSession);
  const completeSession = useStore(s => s.completeSession);
  const updateBlock = useStore(s => s.updateBlock);
  const logSet = useStore(s => s.logSet);
  const updateE1rm = useStore(s => s.updateE1rm);
  const [loadModMode, setLoadModMode] = useState(false);
  const [actualLoad, setActualLoad] = useState(0);
  const [swapMode, setSwapMode] = useState(false);
  const [rpeCorrectMode, setRpeCorrectMode] = useState(false);
  const [correctedRpe, setCorrectedRpe] = useState(8);

  const handleOverride = (reason: string) => {
    if (!block || !currentSession) {
      navigate(-1);
      return;
    }
    if (reason === 'End session') {
      completeSession(block.id, currentSession.id, currentSession.srpe ?? 0);
      navigate('/');
      return;
    }
    if (reason === 'Reactive deload') {
      updateSession(block.id, currentSession.id, {
        overrides: [...(currentSession.overrides || []), reason],
      });
      updateBlock(block.id, { phase: 'DELOAD' as const });
      navigate('/deload/rec');
      return;
    }
    if (reason === 'Drop next set') {
      updateSession(block.id, currentSession.id, {
        overrides: [...(currentSession.overrides || []), reason],
      });
      navigate('/session/summary');
      return;
    }
    if (reason === 'Add a set') {
      const sets = currentSession.sets;
      const currentExId = currentSession.exercises[currentSession.currentExerciseIndex || 0]?.id;
      if (sets.length > 0) {
        const lastBackOff = [...sets].reverse().find(s => s.setType === 'BACK_OFF' && s.exerciseId === currentExId);
        const lastTopSet = [...sets].reverse().find(s => s.setType === 'TOP_SET' && s.exerciseId === currentExId);
        const source = lastBackOff || lastTopSet || sets[sets.length - 1];
        const newSet: SetLog = {
          id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          exerciseId: source.exerciseId,
          setType: 'BACK_OFF',
          prescribedLoad: source.prescribedLoad,
          actualLoad: source.actualLoad,
          prescribedReps: source.prescribedReps,
          actualReps: source.actualReps,
          prescribedRpeTarget: source.prescribedRpeTarget,
          actualRpe: source.actualRpe,
          e1rm: source.e1rm,
          sfi: Math.round(calculateSetSFI(source.actualRpe, source.actualReps, source.exerciseId, false) * 10) / 10,
        };
        logSet(block.id, currentSession.id, newSet);
      }
      updateSession(block.id, currentSession.id, {
        overrides: [...(currentSession.overrides || []), reason],
      });
      navigate(-1);
      return;
    }
    if (reason === 'Swap exercise') {
      if (!swapMode) {
        setSwapMode(true);
        return;
      }
      // For now, just log the override with the selected variation
      // A full implementation would show a list of alternative exercises
      updateSession(block.id, currentSession.id, {
        overrides: [...(currentSession.overrides || []), 'Exercise swap: user selected variation'],
      });
      setSwapMode(false);
      navigate(-1);
      return;
    }
    if (reason === 'RPE correction') {
      const lastSet = currentSession.sets.length > 0
        ? currentSession.sets[currentSession.sets.length - 1]
        : null;
      if (!rpeCorrectMode) {
        // Enter RPE correction mode — pre-fill with current logged RPE
        setCorrectedRpe(lastSet?.actualRpe ?? 8);
        setRpeCorrectMode(true);
        return;
      }
      // Apply the corrected RPE
      if (lastSet) {
        const liftMap: Record<string, string> = {
          barbell_back_squat: 'squat',
          bench_press: 'bench',
          conventional_deadlift: 'deadlift',
        };
        const lift = liftMap[lastSet.exerciseId];
        if (lift) {
          updateE1rm(lift, { load: lastSet.actualLoad, reps: lastSet.actualReps, rpe: correctedRpe });
        }
      }
      updateSession(block.id, currentSession.id, {
        overrides: [...(currentSession.overrides || []), `RPE correction: ${lastSet?.actualRpe ?? '?'} → ${correctedRpe}`],
      });
      setRpeCorrectMode(false);
      navigate(-1);
      return;
    }
    if (reason === 'Load modification') {
      if (actualLoad <= 0) {
        setLoadModMode(true);
        // Pre-fill with the last set's actual load or prescribed load
        const lastSet = currentSession.sets.length > 0
          ? currentSession.sets[currentSession.sets.length - 1]
          : null;
        setActualLoad(lastSet?.actualLoad ?? currentSession.exercises[currentSession.currentExerciseIndex || 0]?.prescribedLoad ?? 0);
        return;
      }
      // Log a correction set with the actual load
      const lastSet = currentSession.sets.length > 0
        ? currentSession.sets[currentSession.sets.length - 1]
        : null;
      if (lastSet) {
        const correctedSet: SetLog = {
          id: `set-${Date.now()}-load-mod`,
          exerciseId: lastSet.exerciseId,
          setType: lastSet.setType,
          prescribedLoad: lastSet.prescribedLoad,
          actualLoad,
          prescribedReps: lastSet.prescribedReps,
          actualReps: lastSet.actualReps,
          prescribedRpeTarget: lastSet.prescribedRpeTarget,
          actualRpe: lastSet.actualRpe,
          e1rm: lastSet.e1rm,
          sfi: lastSet.sfi,
        };
        logSet(block.id, currentSession.id, correctedSet);
      }
      updateSession(block.id, currentSession.id, {
        overrides: [...(currentSession.overrides || []), `Load mod: ${actualLoad} kg (was ${lastSet?.prescribedLoad ?? '?'} kg)`],
      });
      navigate(-1);
      return;
    }
    if (reason === 'Lower RPE cap') {
      const lowered = currentSession.exercises.map(ex => ({
        ...ex,
        rpeTarget: ex.rpeTarget - 0.5,
      }));
      updateSession(block.id, currentSession.id, {
        exercises: lowered,
        overrides: [...(currentSession.overrides || []), reason],
      });
      navigate(-1);
      return;
    }
    // Fallback — shouldn't reach here for defined options
    updateSession(block.id, currentSession.id, {
      overrides: [...(currentSession.overrides || []), reason],
    });
    navigate(-1);
  };

  return (
    <Phone>
      {/* Dimmed underlying screen — reflects current session state */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }}>
        <div style={{ padding: '20px 22px' }}>
          {(() => {
            const exIdx = currentSession?.currentExerciseIndex ?? 0;
            const curEx = currentSession?.exercises?.[exIdx];
            const backOffSets = currentSession?.sets.filter(s => s.setType === 'BACK_OFF' && s.exerciseId === curEx?.id) ?? [];
            const topSets = currentSession?.sets.filter(s => s.setType === 'TOP_SET' && s.exerciseId === curEx?.id) ?? [];
            const setNum = backOffSets.length > 0 ? backOffSets.length : topSets.length;
            const label = backOffSets.length > 0 ? 'Back-off' : 'Top set';
            const lastSet = currentSession?.sets.slice(-1)[0];
            const displayLoad = lastSet?.actualLoad ?? curEx?.prescribedLoad ?? 0;
            return (
              <>
                <div className="tns-eyebrow">{curEx?.name ?? '—'} · Set {setNum} · {label}</div>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 80, lineHeight: 0.9, marginTop: 30 }}>{displayLoad > 0 ? `${displayLoad} kg` : '—'}</div>
              </>
            );
          })()}
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,12,10,0.7)', backdropFilter: 'blur(4px)' }} />

      {/* Sheet */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: T.bg, borderTop: `1px solid ${T.line}`, paddingBottom: 24 }}>
        <div style={{ height: 4, width: 36, background: T.line, margin: '10px auto 18px' }} />
        <div style={{ padding: '0 22px' }}>
          {rpeCorrectMode ? (
            <>
              <div className="tns-eyebrow" style={{ marginBottom: 4 }}>RPE correction</div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 28, marginBottom: 18 }}>Correct last set RPE</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 18 }}>
                <span className="tns-serif" style={{ fontSize: 64, lineHeight: 0.85 }}>{correctedRpe}</span>
                <span className="tns-mono" style={{ fontSize: 14, color: T.textDim }}>RPE</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 18 }}>
                {[7, 7.5, 8, 8.5, 9, 9.5, 10].map(v => (
                  <div key={v} onClick={() => setCorrectedRpe(v)} style={{
                    padding: '10px 0', textAlign: 'center', cursor: 'pointer',
                    border: `1px solid ${v === correctedRpe ? T.accent : T.line}`,
                    background: v === correctedRpe ? T.accent : 'transparent',
                    color: v === correctedRpe ? '#1a0f08' : T.text,
                    fontFamily: T.mono, fontSize: 11,
                  }}>{v}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <PrimaryBtn dim full={false} onClick={() => setRpeCorrectMode(false)}>Cancel</PrimaryBtn>
                <PrimaryBtn onClick={() => handleOverride('RPE correction')}>Apply →</PrimaryBtn>
              </div>
            </>
          ) : loadModMode ? (
            <>
              <div className="tns-eyebrow" style={{ marginBottom: 4 }}>Load modification</div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 28, marginBottom: 18 }}>Adjust load</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 18 }}>
                <span className="tns-serif" style={{ fontSize: 64, lineHeight: 0.85 }}>{actualLoad}</span>
                <span className="tns-mono" style={{ fontSize: 14, color: T.textDim }}>KG</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                {[-5, -2.5, 2.5, 5].map(delta => (
                  <div key={delta} onClick={() => setActualLoad(l => Math.max(0, l + delta))} style={{
                    flex: 1, padding: '12px 0', textAlign: 'center', cursor: 'pointer',
                    border: `1px solid ${T.line}`, fontFamily: T.mono, fontSize: 13,
                    color: delta < 0 ? T.bad : T.good,
                  }}>{delta > 0 ? '+' : ''}{delta}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <PrimaryBtn dim full={false} onClick={() => { setLoadModMode(false); }}>Cancel</PrimaryBtn>
                <PrimaryBtn onClick={() => handleOverride('Load modification')}>Confirm →</PrimaryBtn>
              </div>
            </>
          ) : swapMode ? (
            <>
              <div className="tns-eyebrow" style={{ marginBottom: 4 }}>Swap exercise</div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 28, marginBottom: 18 }}>Select variation</div>
              {(() => {
                const currentEx = currentSession?.exercises?.[currentSession?.currentExerciseIndex || 0];
                const variations: Record<string, string[]> = {
                  barbell_back_squat: ['Paused squat', 'Front squat', 'Low-bar squat', 'Tempo squat'],
                  bench_press: ['Close-grip bench', 'Paused bench', 'Spoto press', 'Incline press'],
                  conventional_deadlift: ['Sumo deadlift', 'Deficit DL', 'Snatch-grip DL', 'Block pull'],
                };
                const opts = currentEx ? (variations[currentEx.id] || ['Alternative movement']) : [];
                return (
                  <>
                    <div style={{ fontSize: 12, color: T.textDim, marginBottom: 12 }}>Replacing: <span style={{ color: T.text }}>{currentEx?.name ?? '—'}</span></div>
                    {opts.map((v, i) => {
                      const variationMap: Record<string, Pick<SessionExercise, 'id' | 'name' | 'tag'>> = {
                        'Paused squat': { id: 'paused_squat', name: 'Paused squat', tag: 'ASSIST' },
                        'Front squat': { id: 'front_squat', name: 'Front squat', tag: 'ASSIST' },
                        'Low-bar squat': { id: 'barbell_back_squat', name: 'Low-bar squat', tag: 'PRIMARY' },
                        'Tempo squat': { id: 'tempo_squat', name: 'Tempo squat', tag: 'ASSIST' },
                        'Close-grip bench': { id: 'close_grip_bench', name: 'Close-grip bench', tag: 'ASSIST' },
                        'Paused bench': { id: 'paused_bench', name: 'Paused bench', tag: 'ASSIST' },
                        'Spoto press': { id: 'spoto_press', name: 'Spoto press', tag: 'ASSIST' },
                        'Incline press': { id: 'incline_press', name: 'Incline press', tag: 'ASSIST' },
                        'Sumo deadlift': { id: 'sumo_deadlift', name: 'Sumo deadlift', tag: 'PRIMARY' },
                        'Deficit DL': { id: 'deficit_deadlift', name: 'Deficit DL', tag: 'ASSIST' },
                        'Snatch-grip DL': { id: 'snatch_grip_deadlift', name: 'Snatch-grip DL', tag: 'ASSIST' },
                        'Block pull': { id: 'block_pull', name: 'Block pull', tag: 'ASSIST' },
                        'Alternative movement': { id: 'alternative', name: 'Alternative movement', tag: 'ASSIST' },
                      };
                      return (
                        <div key={i} onClick={() => {
                          const mapped = variationMap[v];
                          const exIdx = currentSession!.currentExerciseIndex || 0;
                          const newExercises = currentSession!.exercises.map((ex, idx) =>
                            idx === exIdx ? { ...ex, ...(mapped ?? { id: v.toLowerCase().replace(/\s+/g, '_'), name: v }) } : ex
                          );
                          updateSession(block!.id, currentSession!.id, {
                            exercises: newExercises,
                            overrides: [...(currentSession!.overrides || []), `Swap: ${currentEx?.name} → ${v}`],
                          });
                          setSwapMode(false);
                          navigate(-1);
                        }} style={{
                          padding: '12px 14px', border: `1px solid ${T.line}`, marginBottom: 6, cursor: 'pointer',
                          fontSize: 13,
                        }}>{v}</div>
                      );
                    })}
                    <div style={{ marginTop: 12 }}>
                      <PrimaryBtn dim full={false} onClick={() => setSwapMode(false)}>Cancel</PrimaryBtn>
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <>
              <div className="tns-eyebrow" style={{ marginBottom: 4 }}>Adjust this set</div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 28, marginBottom: 18 }}>Override</div>

              {options.map((o, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < options.length - 1 ? `1px solid ${T.lineSoft}` : 'none', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleOverride(o.label)}>
                  <div style={{ width: 32, height: 32, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: 14, color: T.accent }}>{o.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{o.label}</div>
                    <div style={{ fontSize: 11.5, color: T.textDim, marginTop: 2 }}>{o.sub}</div>
                  </div>
                  <span style={{ color: T.textMute, fontSize: 18 }}>›</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </Phone>
  );
}
