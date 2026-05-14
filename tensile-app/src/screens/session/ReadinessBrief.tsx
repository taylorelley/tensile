import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { rcsBand, getRpePct, getBackOffDrop } from '../../engine';
import { T, Phone, AppHeader, PrimaryBtn, MetricRow } from '../../shared';

export default function ReadinessBrief() {
  const navigate = useNavigate();
  const block = useStore(s => s.currentBlock);
  const currentSession = useStore(s => s.currentSession);
  const profile = useStore(s => s.profile);
  const updateSession = useStore(s => s.updateSession);

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

  const rcs = currentSession.rcs || 72;
  const { band, modifier } = rcsBand(rcs);

  const ex = currentSession.exercises?.[currentSession?.currentExerciseIndex || 0];
  const liftKey = ex?.id === 'barbell_back_squat' ? 'squat' : ex?.id === 'bench_press' ? 'bench' : ex?.id === 'conventional_deadlift' ? 'deadlift' : 'bench';
  const liftName = liftKey.charAt(0).toUpperCase() + liftKey.slice(1);
  let topLoad = 185;
  let backOffLoad = 163;
  let stopRpe = 8.5;
  let reps = 3;
  let rcsModifierNote = '';
  if (ex) {
    reps = ex.reps;
    stopRpe = ex.rpeTarget;
    const liftKey = ex.id === 'barbell_back_squat' ? 'squat' : ex.id === 'bench_press' ? 'bench' : ex.id === 'conventional_deadlift' ? 'deadlift' : 'squat';
    const pct = getRpePct(ex.reps, ex.rpeTarget);
    const e1rm = profile.e1rm[liftKey] || 200;
    topLoad = Math.round(e1rm * pct / 2.5) * 2.5;
    backOffLoad = Math.round(topLoad * (1 - getBackOffDrop(block.phase)) / 2.5) * 2.5;

    // Apply RCS band modifier to loads
    if (rcs >= 85) {
      topLoad = Math.round(topLoad * 1.03 / 2.5) * 2.5;
      backOffLoad = Math.round(backOffLoad * 1.03 / 2.5) * 2.5;
      rcsModifierNote = '+3% load bump';
    } else if (rcs >= 70) {
      // No change
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

  // Persist RCS-modified loads to session exercise so downstream screens can read them
  useEffect(() => {
    if (!ex || !block) return;
    if (ex.prescribedLoad != null) return; // already persisted
    updateSession(block.id, currentSession.id, {
      exercises: currentSession.exercises.map((e, i) =>
        i === 0 ? { ...e, prescribedLoad: topLoad, backOffLoad, rpeTarget: stopRpe } : e
      ),
    });
    // Run once on mount — inputs are stable throughout this screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bands = [
    [0, 40, T.bad],
    [40, 55, '#a04030'],
    [55, 70, T.caution],
    [70, 85, T.good],
    [85, 100, T.accent],
  ] as const;

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
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* RCS dial */}
        <div style={{ border: `1px solid ${T.line}`, padding: '24px 18px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Readiness composite score</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <span className="tns-serif" style={{ fontSize: 96, lineHeight: 0.85, color: T.accent }}>{rcs}</span>
            <span className="tns-mono" style={{ fontSize: 12, color: T.textDim, letterSpacing: '0.06em' }}>/ 100</span>
            <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.1em', marginLeft: 'auto' }}>{band.toUpperCase()}</span>
          </div>
          {/* Band scale */}
          <div style={{ display: 'flex', gap: 2, height: 6, marginBottom: 6 }}>
            {bands.map(([s, e, c], i) => (
              <div key={i} style={{ flex: e - s, background: c, opacity: rcs >= s && rcs < e ? 1 : 0.18 }} />
            ))}
          </div>
          <div style={{ position: 'relative', height: 14 }}>
            <div style={{ position: 'absolute', left: `${rcs}%`, transform: 'translateX(-50%)', top: 0, fontFamily: T.mono, fontSize: 9, color: T.text }}>▲ {rcs}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 9, color: T.textMute, letterSpacing: '0.06em' }}>
            <span>0</span><span>40</span><span>55</span><span>70</span><span>85</span><span>100</span>
          </div>
        </div>

        {/* Contributions */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Contributions</div>
        <div style={{ border: `1px solid ${T.line}`, marginBottom: 14 }}>
          {contributions.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderBottom: i < 3 ? `1px solid ${T.lineSoft}` : 'none' }}>
              <span style={{ fontSize: 12.5, color: T.textDim }}>{r.l}</span>
              <span className="tns-mono" style={{ fontSize: 13, color: r.c }}>{r.v}</span>
            </div>
          ))}
        </div>

        {/* Prescription modifier */}
        <div style={{ background: T.surface, padding: '14px 16px', borderLeft: `2px solid ${T.accent}` }}>
          <div className="tns-eyebrow" style={{ marginBottom: 8, color: T.accent }}>Prescription · {band}</div>
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
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn onClick={() => navigate('/session/warmup')}>Start warm-up →</PrimaryBtn>
      </div>
    </Phone>
  );
}
