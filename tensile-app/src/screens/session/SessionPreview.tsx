import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store';
import { T, Phone, AppHeader, PrimaryBtn } from '../../shared';
import { estimateSessionDuration } from '../../engine';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
}

function getDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function SessionPreview() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const block = useStore(s => s.currentBlock);
  const startSession = useStore(s => s.startSession);
  const isGeneratingBlock = useStore(s => s.isGeneratingBlock);

  if (!block || !sessionId) {
    return (
      <Phone>
        <AppHeader back onBack={() => navigate(-1)} title="Preview" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1, marginBottom: 12 }}>No session</div>
            <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55 }}>Session not found.</div>
          </div>
        </div>
      </Phone>
    );
  }

  const session = block.sessions.find(s => s.id === sessionId);
  if (!session) {
    return (
      <Phone>
        <AppHeader back onBack={() => navigate(-1)} title="Preview" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1, marginBottom: 12 }}>Not found</div>
            <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55 }}>That session does not exist in the current block.</div>
          </div>
        </div>
      </Phone>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const isToday = session.scheduledDate === today;
  const isPast = session.status === 'COMPLETE' || session.status === 'SKIPPED';
  const isInProgress = session.status === 'IN_PROGRESS';
  const canStart = !isPast && !isInProgress;
  const focus = session.exercises[0]?.name || 'Session';
  const exercises = session.exercises;

  const blockStart = new Date(block.startDate).getTime();
  const daysSince = Math.floor((new Date(session.scheduledDate).getTime() - blockStart) / (1000 * 60 * 60 * 24));
  const week = Math.floor(daysSince / 7) + 1;

  const handleStart = () => {
    if (!canStart) return;
    startSession(block.id, session.id);
    navigate('/session/wellness');
  };

  const handleResume = () => {
    if (!isInProgress) return;
    const exIdx = session.currentExerciseIndex ?? 0;
    const currentEx = session.exercises[exIdx];
    if (!currentEx) {
      navigate('/session/warmup');
      return;
    }
    const exSets = session.sets.filter(s => s.exerciseId === currentEx.id);
    const hasTopSet = exSets.some(s => s.setType === 'TOP_SET');
    const hasBackOff = exSets.some(s => s.setType === 'BACK_OFF');
    if (!hasTopSet) { navigate('/session/topset'); return; }
    if (hasBackOff) {
      const lastBackOff = [...exSets].reverse().find(s => s.setType === 'BACK_OFF');
      if (lastBackOff && lastBackOff.actualRpe >= lastBackOff.prescribedRpeTarget) {
        navigate('/session/summary');
      } else {
        navigate('/session/drop');
      }
    } else {
      navigate('/session/drop');
    }
  };

  return (
    <Phone>
      <AppHeader
        back
        onBack={() => navigate(-1)}
        eyebrow={`${formatDate(session.scheduledDate)} · Week ${week} · ${block.phase}`}
        title={focus}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Status + CTA header */}
        <div style={{
          border: `1px solid ${T.lineSoft}`,
          borderLeft: isInProgress ? `3px solid ${T.accent}` : `1px solid ${T.lineSoft}`,
          background: T.surface2,
          marginBottom: 14,
        }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.lineSoft}` }}>
            {session.status === 'COMPLETE' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="tns-mono" style={{ fontSize: 10, color: T.good, letterSpacing: '0.08em' }}>COMPLETED ✓</span>
                <span className="tns-mono" style={{ fontSize: 10, color: T.accent, letterSpacing: '0.08em', cursor: 'pointer', padding: '6px 8px' }} onClick={() => navigate('/session/summary')}>VIEW SUMMARY →</span>
              </div>
            ) : session.status === 'SKIPPED' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>SESSION SKIPPED</span>
              </div>
            ) : isInProgress ? (
              <PrimaryBtn onClick={handleResume}>Resume session →</PrimaryBtn>
            ) : (
              <PrimaryBtn onClick={handleStart} disabled={isGeneratingBlock || !canStart}>
                {isToday ? 'Start session →' : 'Start now →'}
              </PrimaryBtn>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: `1px solid ${T.lineSoft}` }}>
            <div>
              <div className="tns-eyebrow" style={{ marginBottom: 4 }}>{getDayName(session.scheduledDate)} · {exercises.length} EXERCISES</div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 28, lineHeight: 1, letterSpacing: '-0.02em' }}>{focus}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>EST · {estimateSessionDuration(exercises)} MIN</div>
              {session.durationTrimmed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: T.caution }} />
                  <span className="tns-mono" style={{ fontSize: 10, color: T.caution }}>TRIMMED FOR TIME</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '10px 16px 12px' }}>
            {exercises.map((e, i) => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < exercises.length - 1 ? `1px solid ${T.lineSoft}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, width: 16 }}>{i + 1}</span>
                  <div>
                    <div style={{ fontSize: 13 }}>{e.name}</div>
                    <div className="tns-mono" style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>
                      {e.tag}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="tns-mono" style={{ fontSize: 10, color: T.textDim, letterSpacing: '0.04em' }}>
                    {e.sets} × {e.reps} @ RPE {e.rpeTarget}
                  </span>
                  {e.prescribedLoad !== undefined && (
                    <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, marginTop: 2 }}>
                      {e.prescribedLoad.toFixed(1)} kg
                    </div>
                  )}
                  {e.backOffLoad !== undefined && e.dropPct !== undefined && (
                    <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, marginTop: 2 }}>
                      Back-off {e.backOffLoad.toFixed(1)} kg ({Math.round(e.dropPct * 100)}%)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Muscle groups */}
        {exercises.length > 0 && (
          <>
            <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Muscle groups</div>
            <div style={{ border: `1px solid ${T.line}`, padding: '12px 16px', marginBottom: 14 }}>
              {(() => {
                const muscles = new Set<string>();
                for (const e of exercises) {
                  for (const m of e.primaryMuscles) muscles.add(m);
                }
                const sorted = Array.from(muscles).sort();
                if (sorted.length === 0) {
                  return <div style={{ fontSize: 11.5, color: T.textDim, textAlign: 'center', padding: '8px 0' }}>No muscle group data</div>;
                }
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {sorted.map(m => (
                      <span key={m} className="tns-mono" style={{
                        fontSize: 10, color: T.textDim, letterSpacing: '0.04em',
                        padding: '4px 8px', border: `1px solid ${T.lineSoft}`, background: T.surface,
                      }}>
                        {m.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>
    </Phone>
  );
}
