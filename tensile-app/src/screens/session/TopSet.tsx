import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { ensembleE1RM, calculateE1RM, getRpePct, calculateSetSFI, expectedLastRepVelocity, inferLiftKey, resolveLvProfile } from '../../engine';
import { T, Phone, AppHeader, PrimaryBtn, StepDots } from '../../shared';
import type { SetLog } from '../../store';

function makeSetId(): string {
  return `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function RPEPad({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const rows = [
    [6, 6.5, 7],
    [7.5, 8, 8.5],
    [9, 9.5, 10],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      {rows.flat().map(l => (
        <button key={l} type="button"
          aria-pressed={l === value}
          aria-label={`RPE ${l}`}
          onClick={() => onChange(l)} style={{
            padding: '14px 0', textAlign: 'center', cursor: 'pointer',
            border: `1px solid ${l === value ? T.accent : T.line}`,
            background: l === value ? T.accent : 'transparent',
            color: l === value ? '#1a0f08' : T.text,
            fontFamily: T.mono, fontSize: 13, fontWeight: 500,
            minHeight: 48,
          }}>{l}</button>
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
    // Map each exercise to its appropriate e1RM base
    const liftKey = (ex.id.includes('bench') || ex.id.includes('press')) ? 'bench'
      : ex.id.includes('deadlift') || ex.id === 'romanian_deadlift' ? 'deadlift'
      : ex.id.includes('squat') || ex.id === 'front_squat' || ex.id === 'paused_squat' ? 'squat'
      : 'squat';
    const pct = getRpePct(ex.reps, ex.rpeTarget);
    const e1rmVal = profile.e1rm[liftKey] || 200;
    // Assistance/supplemental exercises use a percentage of the primary lift e1RM
    const assistanceMultiplier = ex.tag === 'PRIMARY' ? 1.0 : ex.tag === 'ASSIST' ? 0.75 : 0.60;
    return Math.round(e1rmVal * pct * assistanceMultiplier / 2.5) * 2.5;
  });
  const [reps, setReps] = useState(() => ex?.reps ?? 3);
  const [rpe, setRpe] = useState(() => ex?.rpeTarget ?? 8.5);
  const [velocity, setVelocity] = useState<number | undefined>(undefined);
  const [lastRepVelocity, setLastRepVelocity] = useState<number | undefined>(undefined);
  const [showVelocity, setShowVelocity] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  if (!currentSession || !block) {
    return (
      <Phone>
        <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="tns-eyebrow">Top set</span>
          <button type="button" aria-label="Close" className="tns-mono" style={{ fontSize: 11, color: T.textMute, cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }} onClick={() => navigate('/')}>×  CLOSE</button>
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
          <button type="button" aria-label="Close" className="tns-mono" style={{ fontSize: 11, color: T.textMute, cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }} onClick={() => navigate('/')}>×  CLOSE</button>
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

  const liftKey = inferLiftKey(ex.id) ?? 'squat';
  const pct = getRpePct(ex.reps, ex.rpeTarget);
  const e1rmVal = profile.e1rm[liftKey] || 200;
  const assistanceMultiplier = ex.tag === 'PRIMARY' ? 1.0 : ex.tag === 'ASSIST' ? 0.75 : 0.60;
  const prescribedLoad = ex.prescribedLoad ?? Math.round(e1rmVal * pct * assistanceMultiplier / 2.5) * 2.5;

  const liftLvProfile = resolveLvProfile(profile, liftKey);
  const rolling = profile.rollingE1rm[liftKey] || 200;
  const e1rmResult = ensembleE1RM({ load, reps, rpe, velocity, lastRepVelocity }, profile.rpeTable, profile.rpeCalibration, rolling, 0.3, liftLvProfile);
  const e1rmDiff = ((e1rmResult.session - rolling) / rolling * 100).toFixed(1);

  // Individual method breakdown for transparency
  const methodBreakdown = calculateE1RM({ load, reps, rpe, velocity, lastRepVelocity }, profile.rpeTable, profile.rpeCalibration, liftLvProfile);

  // VBT/LRV-vs-RPE divergence flag — prefer LRV when both are provided (more diagnostic for RPE
  // miscalibration than mean velocity, which is biased by warm-up reps in the set).
  const rpeDivergenceWarning = (() => {
    if (!liftLvProfile || liftLvProfile.n < 10) return null;
    if (lastRepVelocity !== undefined && lastRepVelocity > 0) {
      const expectedV = expectedLastRepVelocity(reps, rpe, profile.rpeTable, liftLvProfile);
      if (expectedV <= 0) return null;
      const deviation = Math.abs(lastRepVelocity - expectedV) / expectedV;
      if (deviation > 0.10) {
        const direction = lastRepVelocity > expectedV ? -0.5 : 0.5;
        const impliedRpe = Math.max(5, Math.min(10, rpe + direction));
        return `Last-rep velocity ${lastRepVelocity.toFixed(2)} m/s suggests RPE ~${impliedRpe.toFixed(1)}, not ${rpe}`;
      }
      return null;
    }
    if (velocity === undefined || methodBreakdown.vbtE1RM === undefined) return null;
    const rpeBasedE1rm = methodBreakdown.rpeE1RM;
    const vbtBasedE1rm = methodBreakdown.vbtE1RM;
    const divergence = Math.abs(vbtBasedE1rm - rpeBasedE1rm) / rpeBasedE1rm;
    if (divergence > 0.10) {
      const impliedRpe = vbtBasedE1rm > rpeBasedE1rm ? Math.max(5, rpe - 0.5) : Math.min(10, rpe + 0.5);
      return `Velocity suggests RPE ~${impliedRpe.toFixed(1)}, not ${rpe}`;
    }
    return null;
  })();

  const currentExId = ex.id;
  const topSetsDone = currentSession.sets.filter(s => s.setType === 'TOP_SET' && s.exerciseId === currentExId).length;
  const currentSetNum = topSetsDone + 1;

  const handleLogSet = () => {
    const setLog: SetLog = {
      id: makeSetId(),
      exerciseId: ex.id,
      setType: 'TOP_SET',
      prescribedLoad,
      actualLoad: load,
      prescribedReps: ex.reps,
      actualReps: reps,
      prescribedRpeTarget: ex.rpeTarget,
      actualRpe: rpe,
      velocity,
      lastRepVelocity,
      e1rm: e1rmResult.session,
      sfi: calculateSetSFI(rpe, reps, ex.id, true),
    };
    logSet(block.id, currentSession.id, setLog);
    navigate('/session/drop');
  };

  return (
    <Phone>
      <AppHeader eyebrow={`${ex.name} · Set ${currentSetNum} of ${ex.sets} · Top`} title="Top set" close onClose={() => navigate('/')} />
      <div style={{ padding: '0 22px 8px' }}>
        <StepDots step={4} total={6} />
      </div>
      <div className="route-enter" style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Prescribed — static reference */}
        <div style={{ marginBottom: 14 }}>
          <div className="tns-eyebrow" style={{ marginBottom: 8, color: T.textMute }}>Prescribed</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
            <span className="tns-serif" style={{ fontSize: 28, lineHeight: 0.85, color: T.textDim }}>{prescribedLoad}</span>
            <span className="tns-mono" style={{ fontSize: 14, color: T.textDim }}>KG</span>
            <span className="tns-serif" style={{ fontSize: 20, lineHeight: 0.85, color: T.textDim, marginLeft: 10 }}>× {ex.reps}</span>
            <span className="tns-mono" style={{ fontSize: 11, color: T.textMute, marginLeft: 'auto' }}>RPE {ex.rpeTarget}</span>
          </div>
        </div>

        {/* Actual load — editable */}
        <div style={{ marginBottom: 14 }}>
          <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Actual load</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
            <span className="tns-serif" style={{ fontSize: 72, lineHeight: 0.85 }}>{load}</span>
            <span className="tns-mono" style={{ fontSize: 14, color: T.textDim }}>KG</span>
          </div>
          {load !== prescribedLoad && (
            <button type="button" onClick={() => setLoad(prescribedLoad)} style={{ fontFamily: T.mono, fontSize: 10, color: T.accent, letterSpacing: '0.06em', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}>
              USE PRESCRIBED →
            </button>
          )}
          <div className="tns-mono" style={{ fontSize: 11, color: T.textMute, letterSpacing: '0.06em', marginTop: 6 }}>
            TARGET · RPE {rpe}  ·  {Math.round((load / (e1rmVal || 212)) * 100)}% e1RM  ·  REST 3:30
          </div>
          <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.04em', marginTop: 4 }}>
            {(() => {
              const priorSessions = block.sessions
                .filter(s => s.status === 'COMPLETE' && s.id !== currentSession.id)
                .sort((a, b) => new Date(b.completedDate || b.scheduledDate).getTime() - new Date(a.completedDate || a.scheduledDate).getTime());
              for (const s of priorSessions) {
                const liftSets = s.sets.filter(set => set.exerciseId === ex.id && set.setType === 'TOP_SET');
                if (liftSets.length > 0) {
                  const last = liftSets[liftSets.length - 1];
                  return `LAST WEEK · ${last.actualLoad} KG × ${last.actualReps} @ ${last.actualRpe}`;
                }
              }
              return null;
            })()}
          </div>
        </div>

        <div style={{ height: 1, background: T.line, marginBottom: 18 }} />

        {/* Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          <div>
            <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Load · kg</div>
            <div style={{ border: `1px solid ${T.line}`, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 4, background: T.surface2 }}>
              <span className="tns-mono" style={{ fontSize: 22, fontWeight: 500 }}>{load.toFixed(1)}</span>
              <span className="tns-mono" style={{ fontSize: 14, color: T.textMute, display: 'flex', gap: 4 }}>
                <button type="button" aria-label="Decrease load by 2.5 kg" style={{ cursor: 'pointer', padding: '14px 18px', minWidth: 44, minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit' }} onClick={() => setLoad(l => Math.max(0, l - 2.5))}>−</button>
                <button type="button" aria-label="Increase load by 2.5 kg" style={{ cursor: 'pointer', padding: '14px 18px', minWidth: 44, minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit' }} onClick={() => setLoad(l => l + 2.5)}>+</button>
              </span>
            </div>
          </div>
          <div>
            <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Reps</div>
            <div style={{ border: `1px solid ${T.line}`, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 4, background: T.surface2 }}>
              <span className="tns-mono" style={{ fontSize: 22, fontWeight: 500 }}>{reps}</span>
              <span className="tns-mono" style={{ fontSize: 14, color: T.textMute, display: 'flex', gap: 4 }}>
                <button type="button" aria-label="Decrease reps" style={{ cursor: 'pointer', padding: '14px 18px', minWidth: 44, minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit' }} onClick={() => setReps(r => Math.max(1, r - 1))}>−</button>
                <button type="button" aria-label="Increase reps" style={{ cursor: 'pointer', padding: '14px 18px', minWidth: 44, minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit' }} onClick={() => setReps(r => r + 1)}>+</button>
              </span>
            </div>
          </div>
        </div>

        <div className="tns-eyebrow" style={{ marginBottom: 6 }}>RPE · reps in reserve</div>
        <RPEPad value={rpe} onChange={setRpe} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: T.mono, fontSize: 9.5, color: T.textMute, letterSpacing: '0.06em' }}>
          <span>RIR 4+</span><span>RIR 1–2</span><span>RIR 0 · MAX</span>
        </div>
        <div style={{ marginTop: 8, fontFamily: T.mono, fontSize: 9, color: profile.rpeTablePersonalised ? T.good : T.textMute, letterSpacing: '0.06em' }}>
          {profile.rpeTablePersonalised ? 'TABLE · PERSONALISED' : 'TABLE · POPULATION AVERAGE'}
        </div>

        {/* Optional velocity input */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tns-eyebrow">Velocity (optional)</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button type="button" aria-label="Calibrate velocity profile" className="tns-mono" style={{ fontSize: 9, color: T.textMute, letterSpacing: '0.08em', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }} onClick={() => navigate('/session/vbt-calibration')}>
                CALIBRATE →
              </button>
              <button type="button" aria-expanded={showVelocity} aria-label={showVelocity ? 'Hide velocity inputs' : 'Add velocity inputs'} className="tns-mono" style={{ fontSize: 9, color: T.accent, letterSpacing: '0.08em', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }} onClick={() => setShowVelocity(!showVelocity)}>
                {showVelocity ? 'HIDE' : 'ADD VBT →'}
              </button>
            </div>
          </div>
          {showVelocity && (
            <>
              <label htmlFor="velocity-mean" style={{fontSize: 11, color: T.textDim, marginBottom: 4, display: 'block'}}>Mean propulsive velocity (m/s)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input id="velocity-mean"
                  type="number"
                  step={0.01}
                  value={velocity ?? ''}
                  onChange={e => setVelocity(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="m/s"
                  style={{
                    fontFamily: T.mono, fontSize: 14, fontWeight: 500,
                    background: 'transparent', border: `1px solid ${T.line}`,
                    color: T.text, padding: '8px 10px', outline: 'none', width: 100,
                  }}
                />
              </div>
              <label htmlFor="velocity-last" style={{fontSize: 11, color: T.textDim, marginBottom: 4, display: 'block'}}>Last-rep velocity (m/s)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input id="velocity-last"
                  type="number"
                  step={0.01}
                  value={lastRepVelocity ?? ''}
                  onChange={e => setLastRepVelocity(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="m/s"
                  style={{
                    fontFamily: T.mono, fontSize: 14, fontWeight: 500,
                    background: 'transparent', border: `1px solid ${T.line}`,
                    color: T.text, padding: '8px 10px', outline: 'none', width: 100,
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* RPE divergence warning */}
        {rpeDivergenceWarning && (
          <div style={{ marginTop: 14, padding: '8px 12px', background: 'rgba(232,193,78,0.08)', borderLeft: `2px solid ${T.caution}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="tns-mono" style={{ fontSize: 9, color: T.caution, letterSpacing: '0.08em' }}>RPE CHECK</span>
            <span style={{ fontSize: 12, color: T.textDim }}>{rpeDivergenceWarning}</span>
          </div>
        )}

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
          {/* Method breakdown toggle */}
          <button type="button" onClick={() => setShowBreakdown(!showBreakdown)} style={{ fontFamily: T.mono, fontSize: 10, color: T.textMute, letterSpacing: '0.06em', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginTop: 8 }}>
            {showBreakdown ? 'HIDE BREAKDOWN' : 'SHOW METHOD BREAKDOWN →'}
          </button>
          {showBreakdown && (
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
          )}
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}`, display: 'flex', gap: 8 }}>
        <PrimaryBtn dim full={false} onClick={() => navigate('/session/override')}>Override</PrimaryBtn>
        <PrimaryBtn onClick={handleLogSet}>Log & rest →</PrimaryBtn>
      </div>
    </Phone>
  );
}
