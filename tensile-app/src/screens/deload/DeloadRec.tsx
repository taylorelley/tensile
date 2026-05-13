import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, AppHeader, PrimaryBtn, T } from '../../shared';
import { calculateDeloadScore, deloadRecommendation, type DeloadSignals } from '../../engine';

const defaultSignals: DeloadSignals = {
  peakDetected: true,
  wellnessSustainedLow: true,
  rpeDrift: true,
  hrvTrendLow: false,
  aclrFlag: false,
  jointPainFlag: false,
  ttpExceeded: false,
};

const signalLabels: { key: keyof DeloadSignals; label: string; weight: number }[] = [
  { key: 'peakDetected', label: 'Peak detected', weight: 5 },
  { key: 'wellnessSustainedLow', label: 'Wellness sustained < 60', weight: 4 },
  { key: 'rpeDrift', label: 'RPE drift > 0.3', weight: 3 },
  { key: 'hrvTrendLow', label: 'HRV trend < −10 %', weight: 2 },
  { key: 'aclrFlag', label: 'ACLR > 1.5', weight: 1 },
  { key: 'jointPainFlag', label: 'Joint pain flag', weight: 5 },
  { key: 'ttpExceeded', label: 'TTP exceeded × 1.3', weight: 4 },
];

export default function DeloadRec() {
  const navigate = useNavigate();

  const signals: (typeof signalLabels[number] & { on: boolean })[] = signalLabels.map((s) => ({
    ...s,
    on: defaultSignals[s.key],
  }));
  const score = calculateDeloadScore(defaultSignals);
  const rec = deloadRecommendation(score, defaultSignals);

  const barStrongStart = 5;
  const barModerateStart = 5;
  const barScoreEnd = Math.max(score - barModerateStart - barStrongStart, 0);

  return (
    <Phone>
      <AppHeader
        eyebrow="Block 04 · Wk 7"
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
            <div style={{ width: '0%', background: T.textMute }} />
            <div style={{ flex: 3, background: T.caution, opacity: 0.6 }} />
            <div style={{ flex: 3, background: T.caution }} />
            <div style={{ flex: barScoreEnd || 1, background: T.accent }} />
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
            <span>0</span>
            <span>3 · LIGHT</span>
            <span>5 · MOD.</span>
            <span>8 · STRONG</span>
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
          Rolling squat e1RM has declined for 2 weeks. Avg readiness 58/100 this week. We recommend a 1-week Active
          Deload before the next Development Block.
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
        <PrimaryBtn dim full={false}>
          Defer 1 wk
        </PrimaryBtn>
        <PrimaryBtn>Choose structure →</PrimaryBtn>
      </div>
    </Phone>
  );
}
