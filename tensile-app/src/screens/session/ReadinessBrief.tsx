import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { rcsBand, getRpePct, getBackOffDrop } from '../../engine';
import { T, Phone, AppHeader, PrimaryBtn, MetricRow, StepDots } from '../../shared';

export default function ReadinessBrief() {
  const [showContributions, setShowContributions] = useState(false);
  const navigate = useNavigate();
  const block = useStore(s => s.currentBlock);
  const currentSession = useStore(s => s.currentSession);
  const profile = useStore(s => s.profile);
  const updateSession = useStore(s => s.updateSession);

  // Compute with null-safe access — must happen before any early return so hooks stay unconditional
  const rcs = currentSession?.rcs || 72;
  const { band, modifier } = rcsBand(rcs);
  const ex = currentSession?.exercises?.[currentSession?.currentExerciseIndex || 0];
  const liftKey = (ex?.id?.includes('bench') || ex?.id?.includes('press')) ? 'bench'
    : ex?.id?.includes('deadlift') ? 'deadlift'
    : 'squat';
  const liftName = liftKey.charAt(0).toUpperCase() + liftKey.slice(1);
  let topLoad = 185;
  let backOffLoad = 163;
  let stopRpe = 8.5;
  let reps = 3;
  let rcsModifierNote = '';
  if (ex && block) {
    reps = ex.reps;
    stopRpe = ex.rpeTarget;
    const pct = getRpePct(ex.reps, ex.rpeTarget);
    const e1rm = profile.e1rm[liftKey] || 200;
    topLoad = Math.round(e1rm * pct / 2.5) * 2.5;
    backOffLoad = Math.round(topLoad * (1 - getBackOffDrop(block.phase, block.week, profile.ttpEstimate || 6)) / 2.5) * 2.5;

    if (rcs >= 85) {
      topLoad = Math.round(topLoad * 1.03 / 2.5) * 2.5;
      backOffLoad = Math.round(backOffLoad * 1.03 / 2.5) * 2.5;
      rcsModifierNote = '+3% load bump';
    } else if (rcs >= 70) {
      rcsModifierNote = 'no change';
    } else if (rcs >= 55) {
      backOffLoad = Math.round(backOffLoad * 0.98 / 2.5) * 2.5;
      rcsModifierNote = '-2% back-off drop';
    } else if (rcs >= 40) {
      backOffLoad = Math.round(backOffLoad * 0.95 / 2.5) * 2.5;
      stopRpe = Math.max(5, stopRpe - 1.0);
      rcsModifierNote = '-5% back-off, −1 RPE cap';
    } else {
      backOffLoad = Math.round(backOffLoad * 0.90 / 2.5) * 2.5;
      stopRpe = Math.max(5, stopRpe - 1.0);
      rcsModifierNote = '-10% back-off, −1 RPE cap';
    }
  }

  // Persist RCS-modified loads to session exercise so downstream screens can read them.
  // Depends on currentSession.id so it re-runs if the session changes (e.g. after App.tsx
  // restores currentSession asynchronously from the persisted block on mount).
  useEffect(() => {
    if (!ex || !block || !currentSession) return;
    if (ex.prescribedLoad != null) return;
    const exIdx = currentSession.currentExerciseIndex ?? 0;
    updateSession(block.id, currentSession.id, {
      exercises: currentSession.exercises.map((e, i) =>
        i === exIdx ? { ...e, prescribedLoad: topLoad, backOffLoad, rpeTarget: stopRpe } : e
      ),
    });
  // topLoad/backOffLoad/stopRpe are derived from currentSession.id + profile; tracking
  // currentSession.id is enough to detect a new session without causing a loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession?.id]);

  if (!currentSession || !block) {
    return (
      <Phone>
        <AppHeader eyebrow="Readiness composite" title="Session brief" back onBack={() => navigate(-1)} />
        <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1, marginBottom: 12 }}>No session data</div>
            <div style={{ fontSize: 13, color: T.textDim }}>Complete the wellness check first.</div>
          </div>
        </div>
        <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
          <PrimaryBtn onClick={() => navigate('/session/wellness')}>Back to wellness →</PrimaryBtn>
        </div>
      </Phone>
    );
  }

  // Compute actual contributions from session history
  const allCompleted = (block?.sessions ?? [])
    .filter((s) => s.status === 'COMPLETE')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  // HRV trend modifier: proxy from wellness fatigue trend
  const recentWellness = allCompleted.slice(-3);
  const avgFatigue =
    recentWellness.length > 0
      ? recentWellness.reduce((sum, s) => sum + s.wellness.overallFatigue, 0) / recentWellness.length
      : 6;
  const hrvMod = Math.round((avgFatigue - 6) * -1.5);

  // RPE drift: difference between last 3 and first 3 completed session sRPEs
  let rpeDrift = 0;
  if (allCompleted.length >= 6) {
    const first3 = allCompleted.slice(0, 3);
    const last3 = allCompleted.slice(-3);
    const avgFirst = first3.reduce((sum, s) => sum + (s.srpe ?? 0), 0) / first3.length;
    const avgLast = last3.reduce((sum, s) => sum + (s.srpe ?? 0), 0) / last3.length;
    rpeDrift = Math.round((avgLast - avgFirst) * 10) / 10;
  }

  // Recent same-lift e1RM: compare current e1RM to most recent session of the same lift
  let benchDelta = 0;
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const recentLiftSession = [...allCompleted]
    .reverse()
    .find(
      (s) =>
        new Date(s.scheduledDate) >= threeDaysAgo &&
        s.sets.some((set) => set.exerciseId === (ex?.id || 'bench_press'))
    );
  if (recentLiftSession) {
    const liftSets = recentLiftSession.sets.filter((set) => set.exerciseId === (ex?.id || 'bench_press'));
    const recentE1rm = liftSets.length > 0 ? Math.max(...liftSets.map((s) => s.e1rm)) : profile.e1rm[liftKey];
    benchDelta = Math.round((profile.e1rm[liftKey] - recentE1rm) * 10) / 10;
  }

  const contributions = [
    { l: 'Wellness composite', v: `+${rcs}`, c: rcs >= 70 ? T.good : rcs >= 55 ? T.caution : T.bad },
    { l: 'HRV trend modifier', v: `${hrvMod >= 0 ? '+' : ''}${hrvMod}`, c: hrvMod >= 0 ? T.good : T.caution },
    { l: 'RPE drift (3 sess.)', v: `${rpeDrift >= 0 ? '+' : ''}${rpeDrift.toFixed(1)}`, c: rpeDrift > 0.3 ? T.bad : rpeDrift > 0 ? T.caution : T.good },
    { l: `${liftName} from 3 days ago`, v: `${benchDelta >= 0 ? '+' : ''}${benchDelta.toFixed(1)}`, c: benchDelta >= 0 ? T.good : T.bad },
  ];

  return (
    <Phone>
      <AppHeader eyebrow="Readiness composite" title="Session brief" back onBack={() => navigate(-1)} />
      <div style={{ padding: '0 22px 8px' }}>
        <StepDots step={2} total={6} />
      </div>
      <div className="route-enter" style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Prescription modifier */}
        <div style={{ background: T.surface, padding: '14px 16px', borderLeft: `2px solid ${T.accent}`, marginBottom: 14 }}>
          <div className="tns-eyebrow" style={{ marginBottom: 8, color: T.accent }}>Prescription</div>
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.55, marginBottom: 4 }}>
            {modifier}
          </div>
          <div className="tns-mono" style={{ fontSize: 10, color: T.caution, marginBottom: 10, letterSpacing: '0.03em' }}>
            RCS modifier: {rcsModifierNote}
          </div>
          <MetricRow items={[
            { label: 'TOP SET', value: `${topLoad} kg × ${reps}` },
            { label: 'BACK-OFF', value: `${backOffLoad} kg × ${reps}` },
            { label: 'STOP @', value: `RPE ${stopRpe}` },
          ]} />
        </div>

        {/* RCS dial - simplified */}
        <div style={{ border: `1px solid ${T.line}`, padding: '18px 18px', marginBottom: 14 }}>
          <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Readiness composite score</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="tns-serif" style={{ fontSize: 48, lineHeight: 0.85, color: T.accent }}>{rcs}</span>
            <span className="tns-mono" style={{ fontSize: 12, color: T.textDim }}>/ 100</span>
            <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.1em', marginLeft: 'auto' }}>{band.toUpperCase()}</span>
          </div>
        </div>

        {/* Contributions — collapsible */}
        <div style={{ border: `1px solid ${T.line}`, marginBottom: 14 }}>
          <div
            onClick={() => setShowContributions(!showContributions)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 14px', cursor: 'pointer',
            }}
          >
            <span className="tns-eyebrow" style={{ marginBottom: 0 }}>Why this score?</span>
            <span className="tns-mono" style={{ fontSize: 10, color: T.textMute }}>{showContributions ? '▲' : '▼'}</span>
          </div>
          {showContributions && contributions.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderTop: i === 0 ? `1px solid ${T.lineSoft}` : 'none', borderBottom: i < 3 ? `1px solid ${T.lineSoft}` : 'none' }}>
              <span style={{ fontSize: 12.5, color: T.textDim }}>{r.l}</span>
              <span className="tns-mono" style={{ fontSize: 13, color: r.c }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn onClick={() => navigate('/session/warmup')}>Start warm-up →</PrimaryBtn>
      </div>
    </Phone>
  );
}
