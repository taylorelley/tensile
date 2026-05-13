import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Logo, PrimaryBtn, StepDots, T } from '../../shared';
import { useStore } from '../../store';

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

export default function History() {
  const navigate = useNavigate();
  const profile = useStore(s => s.profile);
  const setProfile = useStore(s => s.setProfile);

  // Derive TTP estimate from training age
  const ttpEstimate =
    profile.trainingAge === '1–2 years' ? 4 :
    profile.trainingAge === '2–5 years' ? 6 :
    profile.trainingAge === '5+ years' ? 8 :
    4; // default for 6–12 months or unknown

  const handleContinue = () => {
    setProfile({ ttpEstimate });
    navigate('/onboarding/schedule');
  };

  return (
    <OBShell
      step={4}
      eyebrow="Step 04 · Recent context"
      title="What does the last 8 weeks look like?"
      footer={<PrimaryBtn onClick={handleContinue}>Continue →</PrimaryBtn>}
    >
      <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Training age</div>
      <div style={{ padding: '12px 14px', border: `1px solid ${T.line}`, marginBottom: 18, fontSize: 14, fontWeight: 500 }}>
        {profile.trainingAge}
      </div>

      <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Most recent programme</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
        {['nSuns', 'Sheiko', '5/3/1', 'Custom RPE', 'Conjugate', 'Other / none'].map((l, i) => (
          <div key={l} style={{
            border: `1px solid ${i === 3 ? T.accent : T.line}`,
            background: i === 3 ? 'rgba(255,110,58,0.06)' : 'transparent',
            padding: '11px 14px', fontSize: 13, fontWeight: 500,
          }}>{l}</div>
        ))}
      </div>

      <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Weeks since last deload</div>
      <div style={{ border: `1px solid ${T.line}`, padding: '18px 16px 14px', marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <span className="tns-serif" style={{ fontSize: 54, lineHeight: 0.9 }}>7</span>
          <span className="tns-mono" style={{ fontSize: 10, color: T.caution, letterSpacing: '0.08em' }}>↑ ELEVATED LOAD</span>
        </div>
        <div style={{ height: 4, background: T.surface, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, width: '70%', background: T.accent }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: T.mono, fontSize: 9, color: T.textMute, letterSpacing: '0.08em' }}>
          <span>0 WK</span><span>10 WK +</span>
        </div>
      </div>

      <div style={{ background: T.surface, padding: '12px 14px', borderLeft: `2px solid ${T.caution}`, fontSize: 12, color: T.textDim, lineHeight: 1.55 }}>
        <span style={{ color: T.text }}>Recommendation —</span> a 1-week active deload before your first Development Block. We'll schedule it as week 0.
      </div>
    </OBShell>
  );
}
