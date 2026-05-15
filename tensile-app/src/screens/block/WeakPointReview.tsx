import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Phone, TabBar, T } from '../../shared';

export default function WeakPointReview() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const blocks = useStore((s) => s.blocks);

  const weakPoints = profile.weakPoints;

  // Compute accessory responsiveness on-the-fly from all completed sessions
  function computeAccessoryResponsiveness(blocks: ReturnType<typeof useStore.getState>['blocks']): Record<string, { corr: number; lift: string }> {
    const allBlocks = blocks;
    const completedSessions = allBlocks.flatMap((b) => b.sessions).filter((s) => s.status === 'COMPLETE');
    if (completedSessions.length < 4) return {};

    const primaryMap: Record<string, string> = {
      barbell_back_squat: 'squat',
      bench_press: 'bench',
      conventional_deadlift: 'deadlift',
    };

    const accessoryVolumes: Record<string, number[]> = {};
    const primaryE1rms: Record<string, number[]> = {};
    const accessoryLiftMap: Record<string, string> = {};

    for (const sess of completedSessions) {
      const primarySet = sess.sets.find((set) => primaryMap[set.exerciseId]);
      if (!primarySet) continue;
      const primaryLift = primaryMap[primarySet.exerciseId];

      for (const set of sess.sets) {
        if (primaryMap[set.exerciseId]) continue; // skip primary
        const vol = set.actualLoad * set.actualReps;
        if (!accessoryVolumes[set.exerciseId]) {
          accessoryVolumes[set.exerciseId] = [];
          primaryE1rms[set.exerciseId] = [];
        }
        accessoryVolumes[set.exerciseId].push(vol);
        primaryE1rms[set.exerciseId].push(primarySet.e1rm);
        accessoryLiftMap[set.exerciseId] = primaryLift;
      }
    }

    const result: Record<string, { corr: number; lift: string }> = {};
    for (const exId of Object.keys(accessoryVolumes)) {
      const vols = accessoryVolumes[exId];
      const e1rms = primaryE1rms[exId];
      if (vols.length < 3) continue;

      // Simple correlation coefficient
      const n = vols.length;
      const sumV = vols.reduce((a, b) => a + b, 0);
      const sumE = e1rms.reduce((a, b) => a + b, 0);
      const sumVE = vols.reduce((sum, v, i) => sum + v * e1rms[i], 0);
      const sumV2 = vols.reduce((sum, v) => sum + v * v, 0);
      const sumE2 = e1rms.reduce((sum, e) => sum + e * e, 0);

      const denom = Math.sqrt((n * sumV2 - sumV * sumV) * (n * sumE2 - sumE * sumE));
      if (denom === 0) continue;
      const corr = (n * sumVE - sumV * sumE) / denom;
      result[exId] = { corr: Math.round(corr * 100) / 100, lift: accessoryLiftMap[exId] };
    }

    return result;
  }

  const accessoryResponsiveness = computeAccessoryResponsiveness(blocks);

  const entries = Object.entries(accessoryResponsiveness).filter(
    ([, v]) => v.corr !== 0
  );

  const blockLabel = 'Block review';

  return (
    <Phone>
      <div
        style={{
          padding: '8px 22px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          className="tns-mono"
          style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', cursor: 'pointer' }}
          onClick={() => navigate('/block/readiness')}
        >
          ‹ 3 / 6
        </div>
        <div className="tns-eyebrow">{blockLabel}</div>
        <div
          className="tns-mono"
          style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', cursor: 'pointer' }}
          onClick={() => navigate('/block/audit')}
        >
          4 / 6 ›
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div
          style={{
            fontFamily: T.serif,
            fontStyle: 'italic',
            fontSize: 34,
            lineHeight: 1,
            marginBottom: 4,
          }}
        >
          Weak point
        </div>

        {/* Weak point mapping */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Current weak-point mapping
        </div>
        <div
          style={{
            border: `1px solid ${T.line}`,
            marginBottom: 18,
          }}
        >
          {(['squat', 'bench', 'deadlift'] as const).map((lift) => (
            <div
              key={lift}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                borderBottom: `1px solid ${T.lineSoft}`,
              }}
            >
              <span style={{ fontSize: 13, textTransform: 'capitalize' }}>
                {lift}
              </span>
              <span className="tns-mono" style={{ fontSize: 11, color: T.accent }}>
                {weakPoints[lift] ?? '—'}
              </span>
            </div>
          ))}
        </div>

        {/* Accessory responsiveness */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Accessory ↔ e1RM correlations
        </div>
        {entries.length === 0 ? (
          <div
            style={{
              padding: '14px 16px',
              border: `1px solid ${T.line}`,
              fontSize: 11.5,
              color: T.textDim,
            }}
          >
            No accessory correlation data available yet. Complete more blocks
            to build responsiveness tracking.
          </div>
        ) : (
          <div style={{ border: `1px solid ${T.line}` }}>
            {entries.map(([name, item], i) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderBottom:
                    i < entries.length - 1
                      ? `1px solid ${T.lineSoft}`
                      : 'none',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 12.5, flex: 1, textTransform: 'capitalize' }}>
                  {name.replace(/_/g, ' ')}
                  <span className="tns-mono" style={{ fontSize: 9, color: T.textMute, marginLeft: 6, textTransform: 'uppercase' }}>
                    {item.lift}
                  </span>
                </span>
                {/* mini correlation bar */}
                <div
                  style={{
                    width: 90,
                    height: 4,
                    background: T.surface,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: -1,
                      bottom: -1,
                      width: 1,
                      background: T.line,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: item.corr >= 0 ? '50%' : `${50 + item.corr * 50}%`,
                      width: Math.abs(item.corr) * 50 + '%',
                      top: 0,
                      bottom: 0,
                      background: item.corr >= 0 ? T.good : T.bad,
                    }}
                  />
                </div>
                <span
                  className="tns-mono"
                  style={{
                    fontSize: 12,
                    color: item.corr >= 0 ? T.good : T.bad,
                    minWidth: 36,
                    textAlign: 'right',
                  }}
                >
                  {item.corr > 0 ? '+' : ''}
                  {item.corr.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            background: T.surface,
            fontSize: 11.5,
            color: T.textDim,
            lineHeight: 1.55,
            borderLeft: `2px solid ${T.accent}`,
          }}
        >
          Weak-point targeting drives accessory selection for the next block.
          {(['squat', 'bench', 'deadlift'] as const)
            .filter(lift => weakPoints[lift])
            .map(lift => ` ${lift.charAt(0).toUpperCase() + lift.slice(1)}: "${weakPoints[lift]}".`)
            .join('')}
        </div>
      </div>
      <TabBar
        active="block"
        onNavigate={(id) => {
          if (id === 'today') navigate('/');
          else if (id === 'block') navigate('/block/performance');
          else if (id === 'lifts') navigate('/lifts');
          else if (id === 'meet') navigate('/meet/setup');
          else navigate('/');
        }}
      />
    </Phone>
  );
}
