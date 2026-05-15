import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { T, Phone, AppHeader, PrimaryBtn, Spark, TabBar } from '../../shared';

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
          right={<div style={{ width: 28, height: 28, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: 11 }}>{profile.sex ? profile.sex[0] : 'U'}</div>}
        />
        <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 42, lineHeight: 1, marginBottom: 12 }}>Rest day</div>
            <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55, marginBottom: 20 }}>No session scheduled for today.</div>
            <span
              className="tns-mono"
              style={{ fontSize: 10, color: T.accent, letterSpacing: '0.08em', cursor: 'pointer' }}
              onClick={() => navigate('/sessions')}
            >VIEW SCHEDULE →</span>
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
    // No RCS yet → wellness check not done
    if (!s.rcs || s.rcs === 0) return { label: 'Begin wellness check →', path: '/session/wellness' };
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
    (session.status === 'IN_PROGRESS' || session.rcs > 0)
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
        right={<div style={{ width: 28, height: 28, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: 11 }}>{profile.sex ? profile.sex[0] : 'U'}</div>}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Session card */}
        <div style={{ border: `1px solid ${T.line}`, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: `1px solid ${T.lineSoft}` }}>
            <div>
              <div className="tns-eyebrow" style={{ marginBottom: 4 }}>Session · Week {week} · {phase}</div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1, letterSpacing: '-0.02em' }}>{focus}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>EST · {Math.round(exercises.reduce((sum, ex) => sum + ex.sets * 3.5, 0))} MIN</div>
              <div className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', marginTop: 3 }}>{exercises.length} EXERCISES</div>
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
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.lineSoft}`, background: session.status === 'IN_PROGRESS' ? 'rgba(255,110,58,0.08)' : 'rgba(255,110,58,0.04)' }}>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <PrimaryBtn dim full={false} onClick={handleSkip}>Skip →</PrimaryBtn>
              <PrimaryBtn onClick={() => {
                startSession(block.id, session.id);
                navigate(resumeTarget?.path ?? '/session/wellness');
              }}>{resumeTarget?.label ?? 'Begin wellness check →'}</PrimaryBtn>
            </div>
            <div style={{ marginTop: 10, textAlign: 'center' }}>
              <span className="tns-mono" style={{ fontSize: 9, color: T.textMute, letterSpacing: '0.08em', cursor: 'pointer' }} onClick={() => navigate('/deload/rec')}>TRIGGER DELOAD →</span>
            </div>
          </div>
        </div>

        {/* Lift dashboard */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Rolling e1RM</div>
        <div style={{ border: `1px solid ${T.line}`, marginBottom: 14 }}>
          {lifts.map((r, i) => {
            const hasData = r.s.length > 0;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < 2 ? `1px solid ${T.lineSoft}` : 'none', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.l}</div>
                  <div className="tns-mono" style={{ fontSize: 9.5, color: hasData ? T.good : T.textMute, marginTop: 2, letterSpacing: '0.04em' }}>
                    {hasData ? `${r.d} · ${r.s.length}WK` : 'NO DATA YET'}
                  </div>
                </div>
                <Spark data={r.s} w={68} h={22} />
                <div style={{ textAlign: 'right', minWidth: 60 }}>
                  <span className="tns-serif" style={{ fontSize: 24 }}>{r.v}</span>
                  <span className="tns-mono" style={{ fontSize: 9, color: T.textMute, marginLeft: 3 }}>KG</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Block progress strip */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Block progress</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {Array.from({ length: profile.ttpEstimate || 7 }).map((_, i) => {
            const totalWeeks = profile.ttpEstimate || 7;
            const currentIdx = Math.min(week - 1, totalWeeks - 1);
            return (
              <div key={i} style={{ flex: 1, height: 28, background: i < currentIdx ? '#26221a' : i === currentIdx ? T.accent : T.surface, position: 'relative' }}>
                {i === currentIdx && <div style={{ position: 'absolute', inset: 0, background: T.accent, opacity: 0.4 }} />}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 9, color: T.textMute, letterSpacing: '0.06em' }}>
          <span>WK 1</span><span>WK {week} · NOW</span><span>WK {profile.ttpEstimate || 7} · EST PEAK</span>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <span
            className="tns-mono"
            style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', cursor: 'pointer' }}
            onClick={() => navigate('/sessions')}
          >VIEW SCHEDULE →</span>
        </div>
      </div>
      <TabBar active="today" onNavigate={(id) => navigate(id === 'today' ? '/' : id === 'block' ? '/block/performance' : id === 'lifts' ? '/lifts' : id === 'meet' ? '/meet/setup' : '/')} />
    </Phone>
  );
}
