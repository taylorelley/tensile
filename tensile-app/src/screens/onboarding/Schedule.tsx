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

export default function Schedule() {
  const navigate = useNavigate();
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const active = [true, false, true, false, true, true, false];

  return (
    <OBShell
      step={5}
      eyebrow="Step 05 · Schedule"
      title="When can you train?"
      footer={<PrimaryBtn onClick={() => navigate('/onboarding/first-block')}>Continue →</PrimaryBtn>}
    >
      <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Days available</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
        {days.map((d, i) => (
          <div key={i} style={{
            flex: 1, aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${active[i] ? T.accent : T.line}`,
            background: active[i] ? T.accent : 'transparent',
            color: active[i] ? '#1a0f08' : T.textDim,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{d}</span>
            <span className="tns-mono" style={{ fontSize: 8, marginTop: 2, opacity: 0.8 }}>{String(i + 13).padStart(2, '0')}</span>
          </div>
        ))}
      </div>

      <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Session length preference</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 22 }}>
        {['45', '60', '75', '90+'].map((l, i) => (
          <div key={l} style={{
            border: `1px solid ${i === 2 ? T.accent : T.line}`,
            background: i === 2 ? 'rgba(255,110,58,0.06)' : 'transparent',
            padding: '12px 0', textAlign: 'center', fontFamily: T.mono, fontSize: 14,
          }}>{l}<span style={{ fontSize: 9, color: T.textMute }}> MIN</span></div>
        ))}
      </div>

      <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Exclude exercises</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {([
          ['Conventional DL', true] as const,
          ['Overhead press', false] as const,
          ['Behind-neck press', true] as const,
          ['Box squat', false] as const,
          ['Snatch-grip DL', false] as const,
        ]).map(([l, x]) => (
          <div key={l} style={{
            border: `1px solid ${x ? T.bad : T.line}`,
            color: x ? T.bad : T.textDim,
            padding: '6px 12px', fontSize: 11.5,
            fontFamily: T.mono, letterSpacing: '0.02em',
            textDecoration: x ? 'line-through' : 'none',
          }}>{l}</div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: T.textMute, fontFamily: T.mono, letterSpacing: '0.04em' }}>
        + ADD EXCLUSION
      </div>
    </OBShell>
  );
}
