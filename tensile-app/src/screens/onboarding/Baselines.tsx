import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Logo, PrimaryBtn, StepDots, T } from '../../shared';

const OB_TOTAL = 6;

function OBShell({ step, title, eyebrow, children, footer }: {
  step?: number;
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Phone>
      <div style={{ padding: '4px 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={14} />
        {step !== undefined && <StepDots step={step} total={OB_TOTAL} />}
      </div>
      <div style={{ padding: '14px 22px 0', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {eyebrow && <div className="tns-eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</div>}
        {title && <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 22, color: T.text, maxWidth: 280 }}>{title}</div>}
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
      {footer && (
        <div style={{ padding: '18px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>{footer}</div>
      )}
    </Phone>
  );
}

export default function Baselines() {
  const navigate = useNavigate();
  const lifts = [
    { name: 'Back squat', weight: '180.0', reps: 3, rpe: '8.5', e1rm: '212' },
    { name: 'Bench press', weight: '125.0', reps: 4, rpe: '8.0', e1rm: '143' },
    { name: 'Deadlift', weight: '210.0', reps: 2, rpe: '9.0', e1rm: '233' },
  ];

  return (
    <OBShell
      step={2}
      eyebrow="Step 02 · Baselines"
      title="Best recent work sets — we'll estimate your 1RM."
      footer={<PrimaryBtn onClick={() => navigate('/onboarding/weak-point')}>Continue →</PrimaryBtn>}
    >
      <div style={{ marginBottom: 14, padding: '10px 12px', background: T.surface, fontSize: 11, color: T.textDim, lineHeight: 1.5, borderLeft: `2px solid ${T.accent}` }}>
        Enter a recent <span className="tns-mono" style={{ color: T.text }}>weight × reps × RPE</span> for each lift. We use an Epley/Brzycki/RPE ensemble to estimate your 1RM.
      </div>

      {lifts.map((l, i) => (
        <div key={i} style={{ border: `1px solid ${T.line}`, marginBottom: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>{l.name}</span>
            <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>e1RM</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: T.textMute, fontFamily: T.mono, letterSpacing: '0.1em', marginBottom: 4 }}>WEIGHT</div>
                <div className="tns-mono" style={{ fontSize: 16, padding: '6px 10px', border: `1px solid ${T.line}`, minWidth: 64 }}>{l.weight}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: T.textMute, fontFamily: T.mono, letterSpacing: '0.1em', marginBottom: 4 }}>REPS</div>
                <div className="tns-mono" style={{ fontSize: 16, padding: '6px 10px', border: `1px solid ${T.line}`, minWidth: 38, textAlign: 'center' }}>{l.reps}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: T.textMute, fontFamily: T.mono, letterSpacing: '0.1em', marginBottom: 4 }}>RPE</div>
                <div className="tns-mono" style={{ fontSize: 16, padding: '6px 10px', border: `1px solid ${T.line}`, minWidth: 44, textAlign: 'center' }}>{l.rpe}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="tns-serif" style={{ fontSize: 28 }}>{l.e1rm}</span>
              <span className="tns-mono" style={{ fontSize: 9, color: T.textMute, marginLeft: 3 }}>KG</span>
            </div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 8, fontSize: 11, color: T.textMute, fontFamily: T.mono, letterSpacing: '0.04em' }}>
        + ADD OVERHEAD PRESS (optional)
      </div>
    </OBShell>
  );
}
