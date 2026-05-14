import React, { useState } from 'react';
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

const programmes = ['nSuns', 'Sheiko', '5/3/1', 'Custom RPE', 'Conjugate', 'Other / none'];

export default function History() {
  const navigate = useNavigate();
  const profile = useStore(s => s.profile);
  const setProfile = useStore(s => s.setProfile);

  const [selectedProgramme, setSelectedProgramme] = useState('Custom RPE');

  // Derive TTP estimate from training age
  const ttpEstimate =
    profile.trainingAge === '1–2 years' ? 4 :
    profile.trainingAge === '2–5 years' ? 6 :
    profile.trainingAge === '5+ years' ? 8 :
    4; // default for 6–12 months or unknown

  // Derive weeks since last deload from profile data
  // For new users (completedBlocks === 0), show a neutral "fresh start" state
  const isNewUser = profile.completedBlocks === 0;
  const lastDeloadWeeks = isNewUser
    ? 0
    : Math.min(10, Math.max(1, profile.completedBlocks * 2));
  const deloadLoadPct = isNewUser ? 0 : Math.min(100, Math.round((lastDeloadWeeks / 10) * 100));
  const deloadLabel = isNewUser ? 'FRESH START' : lastDeloadWeeks >= 8 ? '↑ ELEVATED LOAD' : lastDeloadWeeks >= 5 ? 'MODERATE LOAD' : 'LOW LOAD';

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
        {programmes.map((l) => (
          <div key={l} onClick={() => setSelectedProgramme(l)} style={{
            border: `1px solid ${selectedProgramme === l ? T.accent : T.line}`,
            background: selectedProgramme === l ? 'rgba(255,110,58,0.06)' : 'transparent',
            padding: '11px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>{l}</div>
        ))}
      </div>

      <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Weeks since last deload</div>
      <div style={{ border: `1px solid ${T.line}`, padding: '18px 16px 14px', marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <span className="tns-serif" style={{ fontSize: 54, lineHeight: 0.9 }}>{isNewUser ? '—' : lastDeloadWeeks}</span>
          <span className="tns-mono" style={{ fontSize: 10, color: isNewUser ? T.good : T.caution, letterSpacing: '0.08em' }}>{deloadLabel}</span>
        </div>
        <div style={{ height: 4, background: T.surface, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, width: `${deloadLoadPct}%`, background: isNewUser ? T.good : T.accent }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: T.mono, fontSize: 9, color: T.textMute, letterSpacing: '0.08em' }}>
          <span>0 WK</span><span>10 WK +</span>
        </div>
      </div>

      <div style={{ background: T.surface, padding: '12px 14px', borderLeft: `2px solid ${isNewUser ? T.good : lastDeloadWeeks >= 7 ? T.caution : T.good}`, fontSize: 12, color: T.textDim, lineHeight: 1.55 }}>
        <span style={{ color: T.text }}>Recommendation —</span> {isNewUser ? 'clean slate — no prior fatigue to manage. We\'ll start at MEV and ramp conservatively.' : lastDeloadWeeks >= 7 ? 'a 1-week active deload before your first Development Block. We\'ll schedule it as week 0.' : 'No deload needed before your first Development Block.'}
      </div>
    </OBShell>
  );
}
