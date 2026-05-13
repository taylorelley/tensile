import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Logo, PrimaryBtn, StepDots, T } from '../../shared';
import { useStore } from '../../store';

const OB_TOTAL = 6;

function OBShell({ step, title, eyebrow, children, footer, scrollable = false }: {
  step?: number;
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <Phone>
      <div style={{ padding: '4px 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={14} />
        {step !== undefined && <StepDots step={step} total={OB_TOTAL} />}
      </div>
      <div style={{ padding: '14px 22px 0', flex: 1, overflow: scrollable ? 'auto' : 'hidden', display: 'flex', flexDirection: 'column' }}>
        {eyebrow && <div className="tns-eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</div>}
        {title && <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 22, color: T.text, maxWidth: 280 }}>{title}</div>}
        <div style={{ flex: 1, overflow: scrollable ? 'visible' : 'auto' }}>{children}</div>
      </div>
      {footer && (
        <div style={{ padding: '18px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>{footer}</div>
      )}
    </Phone>
  );
}

export default function FirstBlock() {
  const navigate = useNavigate();
  const generateFirstBlock = useStore(s => s.generateFirstBlock);
  const setOnboardingComplete = useStore(s => s.setOnboardingComplete);
  const profile = useStore(s => s.profile);

  const handleLockIn = () => {
    generateFirstBlock();
    setOnboardingComplete(true);
    navigate('/');
  };

  return (
    <OBShell
      step={6}
      eyebrow="Step 06 · First block preview"
      title="Your first Development Block."
      footer={
        <div style={{ display: 'flex', gap: 8 }}>
          <PrimaryBtn dim full={false} onClick={() => navigate('/onboarding/first-block')}>Customise</PrimaryBtn>
          <PrimaryBtn onClick={handleLockIn}>Lock in →</PrimaryBtn>
        </div>
      }
      scrollable
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: T.line, marginBottom: 16, border: `1px solid ${T.line}` }}>
        <div style={{ background: T.bg, padding: '12px 14px' }}>
          <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Block type</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Development</div>
        </div>
        <div style={{ background: T.bg, padding: '12px 14px' }}>
          <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Phase</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Accumulation</div>
        </div>
        <div style={{ background: T.bg, padding: '12px 14px' }}>
          <div className="tns-eyebrow" style={{ marginBottom: 6 }}>TTP estimate</div>
          <div className="tns-mono" style={{ fontSize: 14 }}>{profile.ttpEstimate ?? 5}–{Math.min(7, (profile.ttpEstimate ?? 5) + 2)} wk</div>
        </div>
        <div style={{ background: T.bg, padding: '12px 14px' }}>
          <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Frequency</div>
          <div className="tns-mono" style={{ fontSize: 14 }}>{profile.trainingFrequency ?? 4} ×/wk</div>
        </div>
      </div>

      <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Microcycle template</div>
      <div style={{ border: `1px solid ${T.line}` }}>
        {[
          { d: 'MON', t: 'SQUAT', sub: 'Comp · 3×3 @ RPE 8.5 + back-off', tag: 'PRIMARY' },
          { d: 'WED', t: 'BENCH', sub: 'Comp · 4×4 @ RPE 8.0 + back-off', tag: 'PRIMARY' },
          { d: 'FRI', t: 'DEADLIFT', sub: 'Comp · 3×2 @ RPE 8.5', tag: 'PRIMARY' },
          { d: 'SAT', t: 'BENCH (variation)', sub: 'CG bench · 4×5 @ RPE 7.5', tag: 'ASSIST' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: i < 3 ? `1px solid ${T.lineSoft}` : 'none', gap: 12 }}>
            <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, width: 26, letterSpacing: '0.06em' }}>{s.d}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.t}</div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{s.sub}</div>
            </div>
            <span className="tns-mono" style={{ fontSize: 8.5, color: T.textMute, letterSpacing: '0.1em' }}>{s.tag}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: '12px 14px', background: T.surface, fontSize: 11.5, color: T.textDim, lineHeight: 1.55 }}>
        <span className="tns-mono" style={{ fontSize: 9.5, color: T.accent, letterSpacing: '0.08em' }}>RATIONALE</span>
        <div style={{ marginTop: 6 }}>
          Squat frequency biased toward your out-of-the-hole weak point (pause squat featured Sat). Volume starts at MEV with weekly ramp toward MAV.
        </div>
      </div>
    </OBShell>
  );
}
