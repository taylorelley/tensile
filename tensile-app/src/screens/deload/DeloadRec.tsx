import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useStore } from '../../store';
import type { Block, UserProfile } from '../../store';
import { Phone, AppHeader, PrimaryBtn, T } from '../../shared';
import { calculateDeloadScore, deloadRecommendation, detectPeak, detectStall, type DeloadSignals } from '../../engine';

function computeDeloadSignals(currentBlock: Block | null, profile: UserProfile): DeloadSignals {
  const sessions = currentBlock?.sessions ?? [];
  const completed = sessions.filter((s) => s.status === 'COMPLETE');

  // peakDetected: check primary lift trends for peak/stall in current block
  const primaryIds = ['barbell_back_squat', 'bench_press', 'conventional_deadlift'];
  const blockWeek = currentBlock?.week ?? 1;
  const minimumTTP = profile.ttpEstimate;

  let peakDetected = false;
  let stallDetected = false;
  for (const exId of primaryIds) {
    const trend = completed
      .filter((s) => s.sets.some((set) => set.exerciseId === exId))
      .map((s) => {
        const exSets = s.sets.filter((set) => set.exerciseId === exId);
        return exSets.length > 0 ? Math.max(...exSets.map((set) => set.e1rm)) : 0;
      })
      .filter((v) => v > 0);
    if (trend.length >= 3 && detectPeak(trend, minimumTTP, blockWeek)) {
      peakDetected = true;
    }
    if (trend.length >= 3 && detectStall(trend, blockWeek)) {
      stallDetected = true;
    }
  }

  // wellnessSustainedLow: avg RCS of last 7 days < 60
  const now = new Date().getTime();
  const recentSessions = completed.filter(
    (s) => now - new Date(s.completedDate || s.scheduledDate).getTime() <= 7 * 24 * 60 * 60 * 1000
  );
  const avgRcs =
    recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + s.rcs, 0) / recentSessions.length
      : 70;
  const wellnessSustainedLow = avgRcs < 60;

  // rpeDrift: avg actualRPE of last 3 sessions > 0.3 above first 3 sessions of block
  const sorted = [...completed].sort(
    (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );
  let rpeDrift = false;
  if (sorted.length >= 6) {
    const first3 = sorted.slice(0, 3);
    const last3 = sorted.slice(-3);
    const avgFirst =
      first3.reduce((sum, s) => sum + (s.srpe ?? 0), 0) / first3.length;
    const avgLast =
      last3.reduce((sum, s) => sum + (s.srpe ?? 0), 0) / last3.length;
    rpeDrift = avgLast - avgFirst > 0.3;
  }

  // hrvTrendLow: proxy from wellness fatigue trend (no real HRV source)
  const hrvTrendLow =
    recentSessions.length >= 3 &&
    recentSessions.slice(-3).every((s) => s.wellness.overallFatigue <= 4);

  // aclrFlag: simplistic proxy from SFI spike
  const recentSfi = recentSessions.map((s) => s.sfi).filter((v) => v > 0);
  const avgSfi =
    recentSfi.length > 0 ? recentSfi.reduce((a, b) => a + b, 0) / recentSfi.length : 0;
  const earlierSfi = sorted
    .slice(0, Math.max(0, sorted.length - recentSfi.length))
    .map((s) => s.sfi)
    .filter((v) => v > 0);
  const avgEarlierSfi =
    earlierSfi.length > 0 ? earlierSfi.reduce((a, b) => a + b, 0) / earlierSfi.length : 0;
  const aclrFlag = avgEarlierSfi > 0 && avgSfi / avgEarlierSfi > 1.5;

  // jointPainFlag: proxy from sustained low muscle soreness (inverted scale)
  const jointPainFlag =
    recentSessions.length >= 2 &&
    recentSessions.slice(-2).every((s) => s.wellness.muscleSoreness <= 3);

  // ttpExceeded
  const ttpExceeded = blockWeek > minimumTTP;

  return {
    peakDetected,
    stallDetected,
    wellnessSustainedLow,
    rpeDrift,
    hrvTrendLow,
    aclrFlag,
    jointPainFlag,
    ttpExceeded,
  };
}

const signalLabels: { key: keyof DeloadSignals; label: string; weight: number }[] = [
  { key: 'peakDetected', label: 'Peak detected', weight: 5 },
  { key: 'stallDetected', label: 'Stall detected', weight: 4 },
  { key: 'wellnessSustainedLow', label: 'Wellness sustained < 60', weight: 4 },
  { key: 'rpeDrift', label: 'RPE drift > 0.3', weight: 3 },
  { key: 'hrvTrendLow', label: 'HRV trend < −10 %', weight: 2 },
  { key: 'aclrFlag', label: 'ACLR > 1.5', weight: 1 },
  { key: 'jointPainFlag', label: 'Joint pain flag', weight: 5 },
  { key: 'ttpExceeded', label: 'TTP exceeded × 1.3', weight: 4 },
];

export default function DeloadRec() {
  const navigate = useNavigate();
  const currentBlock = useStore((s) => s.currentBlock);
  const profile = useStore((s) => s.profile);
  const signalsRaw = computeDeloadSignals(currentBlock, profile);
  const signals: (typeof signalLabels[number] & { on: boolean })[] = signalLabels.map((s) => ({
    ...s,
    on: signalsRaw[s.key],
  }));
  const score = calculateDeloadScore(signalsRaw);
  const rec = deloadRecommendation(score, signalsRaw);

  const barScorePct = Math.min(100, (score / 24) * 100);

  return (
    <Phone>
      <AppHeader
        eyebrow={currentBlock ? `Block ${currentBlock.id.slice(-2)} · Wk ${currentBlock.week}` : 'Deload'}
        title="Deload"
        right={
          <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>
            SKIP
          </span>
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Score visualisation */}
        <div
          style={{
            border: `1px solid ${T.accent}`,
            padding: '20px 18px',
            marginBottom: 18,
            background: 'rgba(255,110,58,0.04)',
          }}
        >
          <div className="tns-eyebrow" style={{ marginBottom: 8, color: T.accent }}>
            Deload score
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <span className="tns-serif" style={{ fontSize: 76, color: T.accent, lineHeight: 0.85 }}>
              {score}
            </span>
            <span className="tns-mono" style={{ fontSize: 12, color: T.textDim, letterSpacing: '0.06em' }}>
              / 24
            </span>
            <span
              className="tns-mono"
              style={{ fontSize: 10, color: T.accent, letterSpacing: '0.1em', marginLeft: 'auto' }}
            >
              {rec.level.toUpperCase()} ▲
            </span>
          </div>
          <div style={{ display: 'flex', height: 4, background: T.surface }}>
            <div style={{ width: `${barScorePct}%`, background: T.accent }} />
            <div style={{ flex: 1, background: T.surface }} />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              fontFamily: T.mono,
              fontSize: 9,
              color: T.textMute,
              letterSpacing: '0.06em',
            }}
          >
            <span>0</span><span>3 · LIGHT</span><span>5 · MOD.</span><span>8 · STRONG</span><span>24 · MAX</span>
          </div>
        </div>

        {/* Signals */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Active signals
        </div>
        <div style={{ border: `1px solid ${T.line}`, marginBottom: 18 }}>
          {signals.map((s, i) => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '11px 14px',
                borderBottom: i < signals.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  background: s.on ? T.accent : 'transparent',
                  border: `1px solid ${s.on ? T.accent : T.line}`,
                }}
              />
              <span style={{ fontSize: 12.5, flex: 1, color: s.on ? T.text : T.textMute }}>
                {s.label}
              </span>
              <span className="tns-mono" style={{ fontSize: 10, color: s.on ? T.accent : T.textMute }}>
                w {s.weight}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '12px 14px',
            background: T.surface,
            fontSize: 11.5,
            color: T.textDim,
            lineHeight: 1.55,
            borderLeft: `2px solid ${T.accent}`,
          }}
        >
          {rec.message}
          {signalsRaw.peakDetected && ' Peak detected in primary lift trend.'}
          {signalsRaw.wellnessSustainedLow && ' Average readiness below threshold.'}
        </div>
      </div>
      <div
        style={{
          padding: '14px 22px 28px',
          borderTop: `1px solid ${T.lineSoft}`,
          display: 'flex',
          gap: 8,
        }}
      >
        <PrimaryBtn dim full={false} onClick={() => navigate('/')}>
          Defer 1 wk
        </PrimaryBtn>
        <PrimaryBtn onClick={() => navigate('/deload/structure')}>Choose structure →</PrimaryBtn>
      </div>
    </Phone>
  );
}
