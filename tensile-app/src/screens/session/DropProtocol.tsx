import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { getBackOffDrop, calculateSetSFI } from '../../engine';
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

export default function DropProtocol() {
  const navigate = useNavigate();
  const block = useStore(s => s.currentBlock);
  const currentSession = useStore(s => s.currentSession);
  const logSet = useStore(s => s.logSet);
  const [rpe, setRpe] = useState(8);

  if (!currentSession || !block) {
    return (
      <Phone>
        <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="tns-eyebrow">Back-off</span>
          <span className="tns-mono" style={{ fontSize: 11, color: T.textMute, cursor: 'pointer' }} onClick={() => navigate('/session/summary')}>× CLOSE</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1, marginBottom: 12 }}>No session</div>
            <div style={{ fontSize: 13, color: T.textDim }}>Complete the top set first.</div>
          </div>
        </div>
      </Phone>
    );
  }

  const currentExId = currentSession.exercises[currentSession.currentExerciseIndex || 0]?.id;
  const topSets = currentSession.sets.filter(s => s.setType === 'TOP_SET' && s.exerciseId === currentExId);
  const topSet = topSets[topSets.length - 1];

  if (!topSet) {
    return (
      <Phone>
        <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="tns-eyebrow">Back-off</span>
          <span className="tns-mono" style={{ fontSize: 11, color: T.textMute, cursor: 'pointer' }} onClick={() => navigate('/session/summary')}>× CLOSE</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1, marginBottom: 12 }}>No top set</div>
            <div style={{ fontSize: 13, color: T.textDim }}>Complete the top set first.</div>
            <div style={{ marginTop: 16 }}>
              <PrimaryBtn onClick={() => navigate('/session/topset')}>Go to top set →</PrimaryBtn>
            </div>
          </div>
        </div>
      </Phone>
    );
  }

  const backOffLoad = Math.round(topSet.actualLoad * (1 - getBackOffDrop(block.phase)) / 2.5) * 2.5;
  const stopRpe = topSet.prescribedRpeTarget;
  const backOffSetsDone = currentSession.sets.filter(s => s.setType === 'BACK_OFF' && s.exerciseId === currentExId).length;
  const currentSetNum = backOffSetsDone + 1;

  const isTerminating = rpe >= stopRpe;

  const lastBackOff = currentSession.sets.filter(s => s.setType === 'BACK_OFF' && s.exerciseId === currentExId).slice(-1)[0];
  const previousRpe = lastBackOff?.actualRpe;

  const exerciseLabel = topSet.exerciseId === 'barbell_back_squat' ? 'Back squat' : topSet.exerciseId === 'bench_press' ? 'Bench press' : 'Deadlift';

  const handleLogSet = () => {
    const setLog: SetLog = {
      id: `set-${Date.now()}`,
      exerciseId: topSet.exerciseId,
      setType: 'BACK_OFF',
      prescribedLoad: backOffLoad,
      actualLoad: backOffLoad,
      prescribedReps: topSet.prescribedReps,
      actualReps: topSet.prescribedReps,
      prescribedRpeTarget: stopRpe,
      actualRpe: rpe,
      e1rm: 0,
      sfi: calculateSetSFI(rpe, topSet.prescribedReps, topSet.exerciseId, false),
    };
    logSet(block.id, currentSession.id, setLog);
    if (rpe >= stopRpe) {
      navigate('/session/summary');
    }
  };

  return (
    <Phone>
      <div style={{ padding: '8px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="tns-eyebrow">{exerciseLabel} · Back-off · Set {currentSetNum}</span>
        <span className="tns-mono" style={{ fontSize: 11, color: T.textMute, cursor: 'pointer' }} onClick={() => navigate('/session/summary')}>END SET ×</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Drop progress */}
        <div style={{ marginBottom: 18 }}>
          <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Load drop protocol · −{Math.round(getBackOffDrop(block.phase) * 100)}%</div>
          <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const isDone = i < backOffSetsDone;
              const isCurrent = i === backOffSetsDone;
              return (
                <div key={i} style={{
                  flex: 1, padding: '14px 0', textAlign: 'center',
                  border: `1px solid ${isCurrent ? T.accent : isDone ? T.line : T.lineSoft}`,
                  background: isCurrent ? T.accent : isDone ? '#26221a' : 'transparent',
                  color: isCurrent ? '#1a0f08' : isDone ? T.text : T.textMute,
                  fontFamily: T.mono, fontSize: 11, fontWeight: 500,
                }}>{i === 7 ? 'END' : isDone ? '✓' : isCurrent ? '?' : '—'}</div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 9, color: T.textMute, letterSpacing: '0.06em' }}>
            <span>SET 1</span><span>STOP @ RPE {stopRpe}</span><span>CAP 8</span>
          </div>
        </div>

        {/* Current prescription */}
        <div style={{ border: `1px solid ${T.line}`, padding: '16px 18px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
            <span className="tns-serif" style={{ fontSize: 76, lineHeight: 0.85, color: T.accent }}>{backOffLoad}</span>
            <span className="tns-mono" style={{ fontSize: 12, color: T.textDim }}>KG</span>
            <span className="tns-serif" style={{ fontSize: 32, lineHeight: 0.85, marginLeft: 10 }}>× {topSet.prescribedReps}</span>
          </div>
          <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.06em' }}>
            BACK-OFF FROM {topSet.actualLoad} KG  ·  {previousRpe !== undefined ? `PREVIOUS RPE ${previousRpe}` : 'FIRST BACK-OFF SET'}
          </div>
        </div>

        {/* RPE input */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Post-set RPE</div>
        <RPEPad value={rpe} onChange={setRpe} />

        <div style={{ marginTop: 16, padding: '12px 14px', background: T.surface, fontSize: 11.5, color: T.textDim, lineHeight: 1.55, borderLeft: `2px solid ${T.caution}` }}>
          <span className="tns-mono" style={{ fontSize: 9, color: T.caution, letterSpacing: '0.08em' }}>NEXT SET PREVIEW</span>
          <div style={{ marginTop: 4 }}>
            If you log RPE ≥ {stopRpe}, the back-off terminates. Otherwise: <span className="tns-mono" style={{ color: T.text }}>{backOffLoad} kg × {topSet.prescribedReps}</span> again.
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}`, display: 'flex', gap: 8 }}>
        <PrimaryBtn dim full={false} onClick={handleLogSet}>+ Set</PrimaryBtn>
        <PrimaryBtn onClick={handleLogSet}>{isTerminating ? 'Finish →' : 'Log set →'}</PrimaryBtn>
      </div>
    </Phone>
  );
}
