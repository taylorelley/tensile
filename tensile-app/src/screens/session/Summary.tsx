import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { T, Phone, AppHeader, PrimaryBtn, Stat } from '../../shared';

export default function Summary() {
  const navigate = useNavigate();
  const block = useStore(s => s.currentBlock);
  const currentSession = useStore(s => s.currentSession);
  const profile = useStore(s => s.profile);
  const completeSession = useStore(s => s.completeSession);
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

  // Determine primary lift
  const ex = currentSession.exercises?.[0];
  const liftKey = ex?.id === 'barbell_back_squat' ? 'squat' : ex?.id === 'bench_press' ? 'bench' : ex?.id === 'conventional_deadlift' ? 'deadlift' : 'squat';
  const primaryE1rm = profile.e1rm[liftKey];
  const liftName = ex?.name || 'Squat';

  const handleLogSession = () => {
    completeSession(block.id, currentSession.id, srpe);
    navigate('/');
  };

  return (
    <Phone>
      <AppHeader eyebrow="Session complete" title="Wrap" />
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
            <Stat label="Volume Load" value={String(volumeLoad)} unit="KG" size={40} />
          </div>
          <div style={{ background: T.bg, padding: '16px 16px' }}>
            <Stat label="SFI" value={sfi.toFixed(1)} unit="HEUR." size={40} />
          </div>
          <div style={{ background: T.bg, padding: '16px 16px' }}>
            <Stat label="Volume" value={(volumeLoad / 1000).toFixed(1)} unit="K KG" size={40} />
          </div>
          <div style={{ background: T.bg, padding: '16px 16px' }}>
            <Stat label={`${liftName} e1RM`} value={String(primaryE1rm?.toFixed(0) ?? '—')} unit="KG" size={40} />
          </div>
        </div>

        {/* Notable flags */}
        <div style={{ background: T.surface, padding: '12px 14px', borderLeft: `2px solid ${T.good}`, marginBottom: 14 }}>
          <span className="tns-mono" style={{ fontSize: 9, color: T.good, letterSpacing: '0.08em' }}>NOTABLE</span>
          <div style={{ marginTop: 4, fontSize: 12.5, color: T.text, lineHeight: 1.55 }}>
            Session completed with {sets.length} set{sets.length !== 1 ? 's' : ''} logged. SFI: {sfi.toFixed(1)} — Volume: {(volumeLoad / 1000).toFixed(1)}K KG.
          </div>
        </div>

        {/* Set log */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Set log · {liftName}</div>
        <div style={{ border: `1px solid ${T.line}`, fontFamily: T.mono, fontSize: 11.5 }}>
          {sets.length === 0 ? (
            <div style={{ padding: '12px', color: T.textMute, fontSize: 11 }}>No sets logged yet.</div>
          ) : (
            sets.map((s, i) => {
              const typeLabel = s.setType === 'TOP_SET' ? 'TOP' : s.setType === 'BACK_OFF' ? (s.actualRpe >= s.prescribedRpeTarget ? 'TERM' : 'B-O') : s.setType;
              return (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 70px 50px', padding: '10px 12px', borderBottom: i < sets.length - 1 ? `1px solid ${T.lineSoft}` : 'none', alignItems: 'center' }}>
                  <span style={{ color: T.textMute, letterSpacing: '0.04em' }}>SET {i + 1}</span>
                  <span>{s.actualLoad} × {s.actualReps}</span>
                  <span style={{ color: T.textDim }}>RPE {s.actualRpe}</span>
                  <span style={{ fontSize: 9, color: typeLabel === 'TERM' ? T.accent : T.textMute, letterSpacing: '0.08em' }}>{typeLabel}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn onClick={handleLogSession}>Log session →</PrimaryBtn>
      </div>
    </Phone>
  );
}
