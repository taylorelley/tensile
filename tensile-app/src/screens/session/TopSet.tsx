import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { ensembleE1RM, calculateE1RM, getRpePct, calculateSetSFI } from '../../engine';
import { T, Phone, PrimaryBtn } from '../../shared';
import type { SetLog } from '../../store';

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

export default function TopSet() {
  const navigate = useNavigate();
  const block = useStore(s => s.currentBlock);
  const currentSession = useStore(s => s.currentSession);
  const profile = useStore(s => s.profile);
  const logSet = useStore(s => s.logSet);

  const ex = currentSession?.exercises?.[currentSession?.currentExerciseIndex || 0];

  const [load, setLoad] = useState(() => {
    if (!ex) return 0;
    if (ex.prescribedLoad != null) return ex.prescribedLoad;
    const liftKey = ex.id === 'barbell_back_squat' ? 'squat' : ex.id === 'bench_press' ? 'bench' : ex.id === 'conventional_deadlift' ? 'deadlift' : 'squat';
    const pct = getRpePct(ex.reps, ex.rpeTarget);
    const e1rmVal = profile.e1rm[liftKey] || 200;
    return Math.round(e1rmVal * pct / 2.5) * 2.5;
  });
  const [reps, setReps] = useState(() => ex?.reps ?? 3);
  const [rpe, setRpe] = useState(() => ex?.rpeTarget ?? 8.5);
  const setCounterRef = useRef(0);

  if (!currentSession || !block) {
    return (
      <Phone>
        <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="tns-eyebrow">Top set</span>
          <span className="tns-mono" style={{ fontSize: 11, color: T.textMute, cursor: 'pointer' }} onClick={() => navigate('/')}>×  CLOSE</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1, marginBottom: 12 }}>No session</div>
            <div style={{ fontSize: 13, color: T.textDim }}>Start a session from Today first.</div>
          </div>
        </div>
      </Phone>
    );
  }

  if (!ex) {
    return (
      <Phone>
        <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="tns-eyebrow">Top set</span>
          <span className="tns-mono" style={{ fontSize: 11, color: T.textMute, cursor: 'pointer' }} onClick={() => navigate('/')}>×  CLOSE</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1, marginBottom: 12 }}>No exercise</div>
            <div style={{ fontSize: 13, color: T.textDim }}>This session has no prescribed exercises.</div>
          </div>
        </div>
      </Phone>
    );
  }

  const liftKey = ex.id === 'barbell_back_squat' ? 'squat' : ex.id === 'bench_press' ? 'bench' : ex.id === 'conventional_deadlift' ? 'deadlift' : 'squat';
  const pct = getRpePct(ex.reps, ex.rpeTarget);
  const e1rmVal = profile.e1rm[liftKey] || 200;
  const prescribedLoad = ex.prescribedLoad ?? Math.round(e1rmVal * pct / 2.5) * 2.5;

  const rolling = profile.rollingE1rm[liftKey] || 200;
  const e1rmResult = ensembleE1RM({ load, reps, rpe }, profile.rpeTable, profile.rpeCalibration, rolling, 0.3);
  const e1rmDiff = ((e1rmResult.session - rolling) / rolling * 100).toFixed(1);

  // Individual method breakdown for transparency
  const methodBreakdown = calculateE1RM({ load, reps, rpe }, profile.rpeTable, profile.rpeCalibration);

  const currentExId = currentSession.exercises[currentSession.currentExerciseIndex || 0]?.id;
  const topSetsDone = currentSession.sets.filter(s => s.setType === 'TOP_SET' && s.exerciseId === currentExId).length;
  const currentSetNum = topSetsDone + 1;

  const handleLogSet = () => {
    setCounterRef.current += 1;
    const setLog: SetLog = {
      id: `set-${setCounterRef.current}`,
      exerciseId: ex.id,
      setType: 'TOP_SET',
      prescribedLoad,
      actualLoad: load,
      prescribedReps: ex.reps,
      actualReps: reps,
      prescribedRpeTarget: ex.rpeTarget,
      actualRpe: rpe,
      e1rm: e1rmResult.session,
      sfi: calculateSetSFI(rpe, reps, ex.id, true),
    };
    logSet(block.id, currentSession.id, setLog);
    navigate('/session/drop');
  };

  return (
    <Phone>
      <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="tns-eyebrow">{ex.name} · Set {currentSetNum} of {ex.sets} · Top</span>
        <span className="tns-mono" style={{ fontSize: 11, color: T.textMute, cursor: 'pointer' }} onClick={() => navigate('/')}>×  CLOSE</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Big prescription */}
        <div style={{ marginBottom: 18 }}>
          <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Prescribed</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="tns-serif" style={{ fontSize: 96, lineHeight: 0.85 }}>{load}</span>
            <span className="tns-mono" style={{ fontSize: 14, color: T.textDim }}>KG</span>
            <span className="tns-serif" style={{ fontSize: 42, lineHeight: 0.85, color: T.accent, marginLeft: 14 }}>× {reps}</span>
          </div>
          <div className="tns-mono" style={{ fontSize: 11, color: T.textMute, letterSpacing: '0.06em', marginTop: 10 }}>
            TARGET · RPE {rpe}  ·  {Math.round((load / (e1rmVal || 212)) * 100)}% e1RM  ·  REST 3:30
          </div>
        </div>

        <div style={{ height: 1, background: T.line, marginBottom: 18 }} />

        {/* Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          <div>
            <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Load · kg</div>
            <div style={{ border: `1px solid ${T.line}`, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="tns-mono" style={{ fontSize: 22, fontWeight: 500 }}>{load.toFixed(1)}</span>
              <span className="tns-mono" style={{ fontSize: 14, color: T.textMute, display: 'flex', gap: 10 }}>
                <span style={{ cursor: 'pointer' }} onClick={() => setLoad(l => Math.max(0, l - 2.5))}>−</span>
                <span style={{ cursor: 'pointer' }} onClick={() => setLoad(l => l + 2.5)}>+</span>
              </span>
            </div>
          </div>
          <div>
            <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Reps</div>
            <div style={{ border: `1px solid ${T.line}`, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="tns-mono" style={{ fontSize: 22, fontWeight: 500 }}>{reps}</span>
              <span className="tns-mono" style={{ fontSize: 14, color: T.textMute, display: 'flex', gap: 10 }}>
                <span style={{ cursor: 'pointer' }} onClick={() => setReps(r => Math.max(1, r - 1))}>−</span>
                <span style={{ cursor: 'pointer' }} onClick={() => setReps(r => r + 1)}>+</span>
              </span>
            </div>
          </div>
        </div>

        <div className="tns-eyebrow" style={{ marginBottom: 6 }}>RPE · reps in reserve</div>
        <RPEPad value={rpe} onChange={setRpe} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: T.mono, fontSize: 9.5, color: T.textMute, letterSpacing: '0.06em' }}>
          <span>RIR 4+</span><span>RIR 1–2</span><span>RIR 0 · MAX</span>
        </div>

        {/* Inline calc preview */}
        <div style={{ marginTop: 18, border: `1px solid ${T.line}`, padding: '12px 14px' }}>
          <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Live e1RM update</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="tns-serif" style={{ fontSize: 28 }}>{e1rmResult.session.toFixed(1)}</span>
            <span className="tns-mono" style={{ fontSize: 10, color: T.textMute }}>±{e1rmResult.confidenceIntervalPct.toFixed(0)}% KG</span>
            <span className="tns-mono" style={{ fontSize: 10, color: Number(e1rmDiff) > 0 ? T.good : T.bad, marginLeft: 'auto' }}>
              {Number(e1rmDiff) > 0 ? '+' : ''}{e1rmDiff}%
            </span>
          </div>
          {/* Method breakdown */}
          <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${T.lineSoft}` }}>
            <div style={{ flex: 1 }}>
              <div className="tns-eyebrow" style={{ fontSize: 7.5, marginBottom: 2 }}>REP-BASED</div>
              <span className="tns-mono" style={{ fontSize: 12, color: T.textDim }}>{methodBreakdown.repE1RM.toFixed(1)}</span>
              <span className="tns-mono" style={{ fontSize: 8, color: T.textMute, marginLeft: 3 }}>· {(methodBreakdown.repConfidence * 100).toFixed(0)}%</span>
            </div>
            <div style={{ flex: 1 }}>
              <div className="tns-eyebrow" style={{ fontSize: 7.5, marginBottom: 2 }}>RPE-ADJ</div>
              <span className="tns-mono" style={{ fontSize: 12, color: T.textDim }}>{methodBreakdown.rpeE1RM.toFixed(1)}</span>
              <span className="tns-mono" style={{ fontSize: 8, color: T.textMute, marginLeft: 3 }}>· {(methodBreakdown.rpeConfidence * 100).toFixed(0)}%</span>
            </div>
            {methodBreakdown.vbtE1RM !== undefined && (
              <div style={{ flex: 1 }}>
                <div className="tns-eyebrow" style={{ fontSize: 7.5, marginBottom: 2 }}>VBT</div>
                <span className="tns-mono" style={{ fontSize: 12, color: T.textDim }}>{methodBreakdown.vbtE1RM.toFixed(1)}</span>
                <span className="tns-mono" style={{ fontSize: 8, color: T.textMute, marginLeft: 3 }}>· {((methodBreakdown.vbtConfidence ?? 0) * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}`, display: 'flex', gap: 8 }}>
        <PrimaryBtn dim full={false} onClick={() => navigate('/session/override')}>Override</PrimaryBtn>
        <PrimaryBtn onClick={handleLogSet}>Log & rest →</PrimaryBtn>
      </div>
    </Phone>
  );
}
