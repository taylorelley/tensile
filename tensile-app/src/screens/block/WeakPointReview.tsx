import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Phone, TabBar, T } from '../../shared';

export default function WeakPointReview() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);

  const weakPoints = profile.weakPoints;
  const accessoryResponsiveness = profile.accessoryResponsiveness;

  const entries = Object.entries(accessoryResponsiveness).filter(
    ([, v]) => v !== 0
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
        <div className="tns-eyebrow">{blockLabel}</div>
        <div
          className="tns-mono"
          style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}
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
            {entries.map(([name, v], i) => (
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
                      left: v >= 0 ? '50%' : `${50 + v * 50}%`,
                      width: Math.abs(v) * 50 + '%',
                      top: 0,
                      bottom: 0,
                      background: v >= 0 ? T.good : T.bad,
                    }}
                  />
                </div>
                <span
                  className="tns-mono"
                  style={{
                    fontSize: 12,
                    color: v >= 0 ? T.good : T.bad,
                    minWidth: 36,
                    textAlign: 'right',
                  }}
                >
                  {v > 0 ? '+' : ''}
                  {v.toFixed(2)}
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
          {weakPoints.squat
            ? ` Focus on squat "${weakPoints.squat}" with targeted variations.`
            : ''}
        </div>
      </div>
      <TabBar
        active="block"
        onNavigate={(id) => {
          if (id === 'today') navigate('/');
          else if (id === 'block') navigate('/block/performance');
          else if (id === 'meet') navigate('/meet/setup');
          else navigate('/');
        }}
      />
    </Phone>
  );
}
