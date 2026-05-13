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

function Choice({ label, sub, selected }: { label: string; sub?: string; selected?: boolean }) {
  return (
    <div style={{
      border: `1px solid ${selected ? T.accent : T.line}`,
      background: selected ? 'rgba(255,110,58,0.06)' : 'transparent',
      padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: T.textDim, marginTop: 3, fontFamily: T.sans }}>{sub}</div>}
      </div>
      <div style={{
        width: 18, height: 18, borderRadius: 99,
        border: `1.5px solid ${selected ? T.accent : T.line}`,
        background: selected ? T.accent : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <div style={{ width: 6, height: 6, borderRadius: 99, background: T.bg }} />}
      </div>
    </div>
  );
}

export default function WeakPoint() {
  const navigate = useNavigate();

  return (
    <OBShell
      step={3}
      eyebrow="Step 03 · Weak point · Squat"
      title="Where does your squat usually fail?"
      footer={
        <div style={{ display: 'flex', gap: 8 }}>
          <PrimaryBtn dim full={false} onClick={() => navigate('/onboarding/weak-point')}>Skip lift</PrimaryBtn>
          <PrimaryBtn onClick={() => navigate('/onboarding/history')}>Bench →</PrimaryBtn>
        </div>
      }
    >
      <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
        <div style={{ width: 100, flexShrink: 0, position: 'relative' }}>
          <svg width="100" height="160" viewBox="0 0 100 160" fill="none">
            <line x1="20" y1="14" x2="80" y2="14" stroke={T.text} strokeWidth="2" />
            <line x1="50" y1="14" x2="50" y2="32" stroke={T.text} strokeWidth="1.5" />
            <circle cx="50" cy="40" r="8" stroke={T.text} strokeWidth="1.5" />
            <line x1="50" y1="48" x2="50" y2="84" stroke={T.text} strokeWidth="1.5" />
            <line x1="50" y1="60" x2="30" y2="76" stroke={T.text} strokeWidth="1.5" />
            <line x1="50" y1="60" x2="70" y2="76" stroke={T.text} strokeWidth="1.5" />
            <line x1="50" y1="84" x2="30" y2="110" stroke={T.text} strokeWidth="1.5" />
            <line x1="50" y1="84" x2="70" y2="110" stroke={T.text} strokeWidth="1.5" />
            <line x1="30" y1="110" x2="40" y2="140" stroke={T.text} strokeWidth="1.5" />
            <line x1="70" y1="110" x2="60" y2="140" stroke={T.text} strokeWidth="1.5" />
            <circle cx="50" cy="92" r="22" stroke={T.accent} strokeWidth="1" strokeDasharray="2 3" fill="none" />
            <line x1="76" y1="92" x2="92" y2="92" stroke={T.accent} strokeWidth="1" />
          </svg>
          <div className="tns-mono" style={{ position: 'absolute', right: -8, top: 86, fontSize: 9, color: T.accent, letterSpacing: '0.06em' }}>HOLE</div>
        </div>
        <div style={{ flex: 1, fontSize: 12, color: T.textDim, lineHeight: 1.55, paddingTop: 18 }}>
          Pick the option that most closely matches your typical failure pattern at near-maximal loads.
        </div>
      </div>

      <Choice label="Fails out of the hole" sub="Hip extensor / glute limit" selected />
      <Choice label="Loses thoracic position" sub="Anterior core / back limit" />
      <Choice label="Bends forward (good-morning)" sub="Posterior chain relative to quad" />
      <Choice label="Mid-ascent sticking point" sub="Quadricep contribution limit" />
      <Choice label="No clear pattern yet" sub="Skip — balanced accessories" />
    </OBShell>
  );
}
