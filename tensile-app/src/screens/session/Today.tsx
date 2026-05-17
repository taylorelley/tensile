import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { T, Phone, AppHeader, PrimaryBtn, Spark, TabBar } from '../../shared';
import { estimateSessionDuration, volumeBudget } from '../../engine';

function NearFailureNudge({ lastAt, now }: { lastAt?: string; now: number }) {
  if (!lastAt) return null;
  const weeksSince = (now - new Date(lastAt).getTime()) / (7 * 24 * 60 * 60 * 1000);
  if (weeksSince < 8) return null;
  return (
    <div style={{ padding: '10px 12px', border: `1px solid ${T.caution}`, marginBottom: 14, fontSize: 11, color: T.caution }}>
      No near-failure set logged in {Math.floor(weeksSince)} weeks. Log a set at RPE 9.5+ to recalibrate RPE confidence.
    </div>
  );
}

function getDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Today() {
  const navigate = useNavigate();
  const block = useStore(s => s.currentBlock);
  const profile = useStore(s => s.profile);
  const startSession = useStore(s => s.startSession);
  const updateSession = useStore(s => s.updateSession);
  const generateFirstBlock = useStore(s => s.generateFirstBlock);
  const deloadRec = useStore(s => s.deloadRecommendation);
  const clearDeloadRec = useStore(s => s.clearDeloadRecommendation);
  const generateDeloadBlock = useStore(s => s.generateDeloadBlock);
  const isGeneratingBlock = useStore(s => s.isGeneratingBlock);

  const today = new Date().toISOString().split('T')[0];

  // No block yet — show fallback with generate button
  if (!block) {
    return (
      <Phone>
        <AppHeader eyebrow="Welcome to Tensile" title="Today" />
        <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 42, lineHeight: 1, marginBottom: 12 }}>No block yet</div>
            <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55 }}>
              Generate your first training block to get started.
            </div>
          </div>
          <PrimaryBtn onClick={generateFirstBlock}>Generate first block →</PrimaryBtn>
        </div>
        <TabBar active="today" onNavigate={(id) => navigate(id === 'today' ? '/' : id === 'block' ? '/block/performance' : id === 'lifts' ? '/lifts' : id === 'meet' ? '/meet/setup' : '/')} />
      </Phone>
    );
  }

  const week = block.week;
  const phase = block.phase;
  const session = block.sessions.find(s => s.scheduledDate === today);

  // No session scheduled for today
  if (!session) {
    return (
      <Phone>
        <AppHeader
          eyebrow={getDayName(today)}
          title="Today"
          right={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: 11 }}>{profile.sex ? profile.sex[0] : 'U'}</div>
              <button type="button" aria-label="Settings" onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09A1.65 1.65 0 0019.4 15z"/>
                </svg>
              </button>
            </div>
          }
        />
        <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 42, lineHeight: 1, marginBottom: 12 }}>Rest day</div>
            <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55, marginBottom: 20 }}>No session scheduled for today.</div>
            {block && block.sessions.filter(s => s.scheduledDate > today && s.status === 'SCHEDULED').length > 0 && (
              <div style={{ marginTop: 12, marginBottom: 16 }}>
                <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.06em', marginBottom: 6 }}>NEXT SESSION</div>
                <div style={{ fontSize: 14, color: T.text }}>
                  {(() => {
                    const next = block.sessions.filter(s => s.scheduledDate > today && s.status === 'SCHEDULED').sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];
                    if (!next) return null;
                    return `${next.exercises[0]?.name || 'Session'} · ${getDayName(next.scheduledDate)}`;
                  })()}
                </div>
                <button
                  type="button"
                  className="tns-mono"
                  style={{
                    fontSize: 10, color: T.accent, letterSpacing: '0.08em',
                    cursor: 'pointer', padding: '8px 12px', marginTop: 10,
                    background: 'none', border: `1px solid ${T.lineSoft}`, fontFamily: 'inherit',
                  }}
                  aria-label="Start next session early"
                  onClick={() => {
                    const next = block.sessions.filter(s => s.scheduledDate > today && s.status === 'SCHEDULED').sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];
                    if (next) {
                      startSession(block.id, next.id);
                      navigate('/session/wellness');
                    }
                  }}
                >
                  START NEXT SESSION EARLY →
                </button>
              </div>
            )}
            <button type="button"
              className="tns-mono"
              style={{ fontSize: 10, color: T.accent, letterSpacing: '0.08em', cursor: 'pointer', padding: '8px 12px', background: 'none', border: 'none', fontFamily: 'inherit' }}
              aria-label="View full schedule"
              onClick={() => navigate('/sessions')}
            >VIEW SCHEDULE →</button>
          </div>
        </div>
        <TabBar active="today" onNavigate={(id) => navigate(id === 'today' ? '/' : id === 'block' ? '/block/performance' : id === 'lifts' ? '/lifts' : id === 'meet' ? '/meet/setup' : '/')} />
      </Phone>
    );
  }

  const focus = session.exercises[0]?.name || 'Session';
  const exercises = session.exercises;

  // Determine where to resume based on session state
  function getResumeTarget(s: NonNullable<typeof session>): { label: string; path: string } {
    // Wellness check not done yet
    if (!s.wellnessCompleted && s.sets.length === 0) return { label: 'Begin wellness check →', path: '/session/wellness' };
    // RCS done but no sets logged → start warmup
    if (s.sets.length === 0) return { label: 'Resume warm-up →', path: '/session/warmup' };
    // Has sets — find current exercise and its progress
    const exIdx = s.currentExerciseIndex ?? 0;
    const currentEx = s.exercises[exIdx];
    if (!currentEx) return { label: 'Resume session →', path: '/session/warmup' };
    const exSets = s.sets.filter(set => set.exerciseId === currentEx.id);
    const hasTopSet = exSets.some(set => set.setType === 'TOP_SET');
    const hasBackOff = exSets.some(set => set.setType === 'BACK_OFF');
    if (!hasTopSet) return { label: 'Resume top set →', path: '/session/topset' };
    if (hasBackOff) {
      const lastBackOff = [...exSets].reverse().find(set => set.setType === 'BACK_OFF');
      if (lastBackOff && lastBackOff.actualRpe >= lastBackOff.prescribedRpeTarget) {
        // Back-off terminated — go to Summary which handles index advancement
        return { label: 'Continue session →', path: '/session/summary' };
      }
      return { label: 'Continue back-off →', path: '/session/drop' };
    }
    // Top set done, no back-off yet
    return { label: 'Start back-off →', path: '/session/drop' };
  }

  const resumeTarget = (
    session.status !== 'COMPLETE' &&
    session.status !== 'SKIPPED' &&
    (session.status === 'IN_PROGRESS' || session.wellnessCompleted)
  ) ? getResumeTarget(session) : null;

  function weeklyBestE1rm(exerciseIds: string[]): number[] {
    if (!block) return [];
    const start = new Date(block.startDate).getTime();
    const weekMap = new Map<number, number[]>();
    for (const s of block.sessions) {
      const daysSince = Math.floor(
        (new Date(s.scheduledDate).getTime() - start) / (1000 * 60 * 60 * 24)
      );
      const week = Math.floor(daysSince / 7);
      const matching = s.sets.filter((set) => exerciseIds.includes(set.exerciseId));
      if (matching.length > 0) {
        if (!weekMap.has(week)) weekMap.set(week, []);
        weekMap.get(week)!.push(Math.max(...matching.map((set) => set.e1rm)));
      }
    }
    if (weekMap.size === 0) return [];
    const maxWeek = Math.max(...Array.from(weekMap.keys()));
    return Array.from({ length: maxWeek + 1 }, (_, i) => {
      const vals = weekMap.get(i);
      return vals && vals.length > 0 ? Math.max(...vals) : 0;
    });
  }

  const squatTrend = weeklyBestE1rm(['barbell_back_squat']);
  const benchTrend = weeklyBestE1rm(['bench_press']);
  const deadliftTrend = weeklyBestE1rm(['conventional_deadlift']);

  const handleSkip = () => {
    if (block && session) {
      updateSession(block.id, session.id, { status: 'SKIPPED' as const });
    }
  };

  const fmtDelta = (trend: number[]) => {
    if (trend.length < 2) return '—';
    const first = trend[0] || 1;
    const last = trend[trend.length - 1] || first;
    const delta = ((last - first) / first) * 100;
    return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
  };

  const lifts = [
    { l: 'Squat', v: profile.e1rm.squat.toFixed(1), d: fmtDelta(squatTrend), s: squatTrend },
    { l: 'Bench', v: profile.e1rm.bench.toFixed(1), d: fmtDelta(benchTrend), s: benchTrend },
    { l: 'Deadlift', v: profile.e1rm.deadlift.toFixed(1), d: fmtDelta(deadliftTrend), s: deadliftTrend },
  ];

  return (
    <Phone>
      <AppHeader
        eyebrow={`${getDayName(today)} · Week ${week} · ${phase}`}
        title="Today"
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: 11 }}>{profile.sex ? profile.sex[0] : 'U'}</div>
            <button type="button" aria-label="Settings" onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09A1.65 1.65 0 0019.4 15z"/>
              </svg>
            </button>
          </div>
        }
      />
      <div className="route-enter" style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Deload recommendation banner */}
        {deloadRec && (
          <div style={{
            border: `1px solid ${deloadRec.level === 'urgent' ? T.bad : deloadRec.level === 'strong' ? T.caution : T.line}`,
            borderLeft: `3px solid ${deloadRec.level === 'urgent' ? T.bad : deloadRec.level === 'strong' ? T.caution : T.textMute}`,
            background: deloadRec.level === 'urgent' ? 'rgba(213,106,85,0.08)' : deloadRec.level === 'strong' ? 'rgba(232,193,78,0.08)' : T.surface,
            padding: '12px 14px', marginBottom: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="tns-mono" style={{
                  fontSize: 9,
                  color: deloadRec.level === 'urgent' ? T.bad : deloadRec.level === 'strong' ? T.caution : T.textMute,
                  letterSpacing: '0.08em',
                }}>
                  {deloadRec.level === 'urgent' ? '● URGENT' : deloadRec.level === 'strong' ? '▲ DELOAD RECOMMENDED' : '◆ ADVISORY'}
                </span>
                <div style={{ fontSize: 12.5, color: T.text, marginTop: 4, lineHeight: 1.5 }}>{deloadRec.message}</div>
              </div>
              <button type="button" aria-label="Dismiss deload recommendation" style={{ fontSize: 18, color: T.textMute, cursor: 'pointer', lineHeight: 1, padding: '8px 10px', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', fontFamily: 'inherit' }} onClick={clearDeloadRec}>×</button>
            </div>
            {(deloadRec.level === 'strong' || deloadRec.level === 'urgent') && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button type="button" className="tns-mono" style={{ fontSize: 10, color: T.accent, letterSpacing: '0.06em', cursor: 'pointer', padding: '6px 0', background: 'none', border: 'none', fontFamily: 'inherit' }} aria-label="Accept deload recommendation" onClick={() => { generateDeloadBlock(); clearDeloadRec(); }}>ACCEPT DELOAD →</button>
                <button type="button" className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.06em', cursor: 'pointer', padding: '6px 0', background: 'none', border: 'none', fontFamily: 'inherit' }} aria-label="Dismiss deload recommendation" onClick={clearDeloadRec}>DISMISS</button>
              </div>
            )}
          </div>
        )}
        {/* Session card */}
        <div style={{
          border: `1px solid ${T.lineSoft}`,
          borderLeft: session.status === 'IN_PROGRESS' ? `3px solid ${T.accent}` : `1px solid ${T.lineSoft}`,
          background: T.surface2,
          marginBottom: 14,
        }}>
          {/* CTA HEADER — always visible at top */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.lineSoft}` }}>
            {session.status === 'COMPLETE' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="tns-mono" style={{ fontSize: 10, color: T.good, letterSpacing: '0.08em' }}>COMPLETED ✓</span>
                <span className="tns-mono" style={{ fontSize: 10, color: T.accent, letterSpacing: '0.08em', cursor: 'pointer', padding: '6px 8px' }} onClick={() => navigate('/session/summary')}>VIEW →</span>
              </div>
            ) : session.status === 'SKIPPED' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>SESSION SKIPPED</span>
                <span className="tns-mono" style={{ fontSize: 10, color: T.accent, letterSpacing: '0.08em', cursor: 'pointer', padding: '6px 8px' }} onClick={() => updateSession(block.id, session.id, { status: 'SCHEDULED' as const })}>UNDO →</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <PrimaryBtn dim full={false} onClick={handleSkip}>Skip →</PrimaryBtn>
                  <PrimaryBtn onClick={() => {
                    startSession(block.id, session.id);
                    navigate(resumeTarget?.path ?? '/session/wellness');
                  }} disabled={isGeneratingBlock}>{resumeTarget?.label ?? 'Begin wellness check →'}</PrimaryBtn>
                </div>
                {block.sessions.filter(s => s.status === 'COMPLETE').length >= 3 && (
                  <div style={{ marginTop: 10, textAlign: 'center' }}>
                    <button type="button" className="tns-mono" style={{ fontSize: 11, color: T.textMute, letterSpacing: '0.08em', cursor: 'pointer', padding: '6px 8px', background: 'none', border: 'none', fontFamily: 'inherit' }} aria-label="Trigger deload" onClick={() => navigate('/deload/rec')}>TRIGGER DELOAD →</button>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: `1px solid ${T.lineSoft}` }}>
            <div>
              <div className="tns-eyebrow" style={{ marginBottom: 4 }}>Session · Week {week} · {phase}</div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1, letterSpacing: '-0.02em' }}>{focus}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>EST · {estimateSessionDuration(exercises)} MIN</div>
              <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', marginTop: 3 }}>{exercises.length} EXERCISES</div>
              {session.durationTrimmed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: T.caution }} />
                  <span className="tns-mono" style={{ fontSize: 10, color: T.caution }}>TRIMMED FOR TIME</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ padding: '10px 16px 12px' }}>
            {exercises.map((e, i) => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, width: 12 }}>{i + 1}</span>
                  <span style={{ fontSize: 13 }}>{e.name}</span>
                </div>
                <span className="tns-mono" style={{ fontSize: 10, color: T.textDim, letterSpacing: '0.04em' }}>{e.sets} × {e.reps} @ RPE {e.rpeTarget}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Volume budget card */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Volume budget · this week</div>
        <div style={{ border: `1px solid ${T.line}`, padding: '12px 16px', marginBottom: 14 }}>
          {(() => {
            const weekIndex = (block?.week ?? 1) - 1;
            const weeklyVol = block?.weeklyMuscleVolume?.[weekIndex] ?? {};
            const sessionMuscles = new Set<string>();
            for (const e of exercises) {
              for (const m of e.primaryMuscles) sessionMuscles.add(m);
            }
            const musclesToShow = Array.from(sessionMuscles).filter(m => profile.mevEstimates[m] !== undefined);
            if (musclesToShow.length === 0) {
              return <div style={{ fontSize: 11.5, color: T.textDim, textAlign: 'center', padding: '8px 0' }}>No muscle group data for this session</div>;
            }
            const recoverySignal = session.rcs ?? 70;
            return (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {musclesToShow.map(mg => {
                  const mev = profile.mevEstimates[mg] ?? 8;
                  const mrv = profile.mrvEstimates[mg] ?? 20;
                  const current = weeklyVol[mg] || 0;
                  const budget = volumeBudget(mev, mrv, block?.week ?? 1, profile.ttpEstimate || 7, recoverySignal);
                  const isLow = current < mev * 0.8;
                  const isHigh = current > mrv;
                  const statusColor = isHigh ? T.bad : isLow ? T.bad : T.good;
                  const statusText = isHigh
                    ? 'Approaching maximum recoverable volume'
                    : isLow
                    ? 'Below minimum effective volume'
                    : 'In optimal range';
                  return (
                    <div key={mg} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.lineSoft}` }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: statusColor, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12.5, textTransform: 'capitalize' }}>{mg.replace('_', ' ')}</span>
                        <span className="tns-mono" style={{ fontSize: 11, color: T.textMute, marginLeft: 8 }}>
                          {statusText}
                        </span>
                      </div>
                      <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, flexShrink: 0 }}>
                        {current} / {budget}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Lift dashboard with confidence band */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Rolling e1RM</div>
        <div style={{ border: `1px solid ${T.lineSoft}`, background: T.surface2, marginBottom: 14 }}>
          {lifts.map((r, i) => {
            const hasData = r.s.length > 0;
            const conf = r.s.length >= 8 ? 'HIGH' : r.s.length >= 3 ? 'MED' : 'LOW';
            const confColor = conf === 'HIGH' ? T.good : conf === 'MED' ? T.caution : T.textMute;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: i < 2 ? `1px solid ${T.lineSoft}` : 'none', gap: 12 }}>
                <Spark data={r.s} w={50} h={18} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.l}</div>
                  <div className="tns-mono" style={{ fontSize: 11, color: hasData ? T.good : T.textMute, marginTop: 2, letterSpacing: '0.04em' }}>
                    {hasData ? `${r.d} · ${r.s.length}WK` : 'NO DATA YET'}
                    <span style={{ color: confColor, marginLeft: 8 }}>CONF {conf}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 60 }}>
                  <span className="tns-serif" style={{ fontSize: 22 }}>{r.v}</span>
                  <span className="tns-mono" style={{ fontSize: 11, color: T.textMute, marginLeft: 3 }}>KG</span>
                </div>
              </div>
            );
          })}
        </div>
        <NearFailureNudge lastAt={profile.rpeCalibration?.lastNearFailureSetAt} now={new Date().getTime()} />

        {/* Block progress strip */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Block progress</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {Array.from({ length: profile.ttpEstimate || 7 }).map((_, i) => {
            const totalWeeks = profile.ttpEstimate || 7;
            const currentIdx = Math.min(week - 1, totalWeeks - 1);
            return (
              <div key={i} style={{ flex: 1, height: 32, background: i < currentIdx ? T.surface3 : i === currentIdx ? T.accent : T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {i === currentIdx && <div style={{ position: 'absolute', inset: 0, background: T.accent, opacity: 0.4 }} />}
                <span className="tns-mono" style={{ fontSize: 11, color: i === currentIdx ? '#1a0f08' : T.textMute, position: 'relative', zIndex: 1 }}>{i + 1}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 11, color: T.textMute, letterSpacing: '0.06em' }}>
          <span>WK 1</span><span>WK {week} · NOW</span><span>WK {profile.ttpEstimate || 7} · EST PEAK</span>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button type="button"
            className="tns-mono"
            style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', cursor: 'pointer', padding: '8px 12px', background: 'none', border: 'none', fontFamily: 'inherit' }}
            aria-label="View full schedule"
            onClick={() => navigate('/sessions')}
          >VIEW SCHEDULE →</button>
        </div>
      </div>
      <TabBar active="today" onNavigate={(id) => navigate(id === 'today' ? '/' : id === 'block' ? '/block/performance' : id === 'lifts' ? '/lifts' : id === 'meet' ? '/meet/setup' : '/')} />
    </Phone>
  );
}
