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

function Choice({ label, sub, selected, onClick }: { label: string; sub?: string; selected?: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      border: `1px solid ${selected ? T.accent : T.line}`,
      background: selected ? 'rgba(255,110,58,0.06)' : 'transparent',
      padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
      cursor: onClick ? 'pointer' : undefined,
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

interface WeakPointOption {
  value: string;
  label: string;
  sub: string;
}

const weakPointOptions: Record<string, WeakPointOption[]> = {
  squat: [
    { value: 'out_of_hole', label: 'Fails out of the hole', sub: 'Hip extensor / glute limit' },
    { value: 'back_position_loss', label: 'Loses thoracic position', sub: 'Anterior core / back limit' },
    { value: 'mid_ascent_stall', label: 'Bends forward (good-morning)', sub: 'Posterior chain relative to quad' },
    { value: 'falls_forward', label: 'Falls forward at bottom', sub: 'Ankle mobility / balance limit' },
    { value: 'no_clear_pattern', label: 'No clear pattern yet', sub: 'Skip — balanced accessories' },
  ],
  bench: [
    { value: 'off_chest', label: 'Fails off the chest', sub: 'Pec / front delt limit' },
    { value: 'lockout_failure', label: 'Fails at lockout', sub: 'Tricep extension limit' },
    { value: 'arch_stability', label: 'Loses leg drive / arch', sub: 'Posterior chain / setup issue' },
    { value: 'no_clear_pattern', label: 'No clear pattern yet', sub: 'Skip — balanced accessories' },
  ],
  deadlift: [
    { value: 'off_floor', label: 'Fails off the floor', sub: 'Posterior chain / back strength' },
    { value: 'lockout_failure', label: 'Fails at lockout', sub: 'Glute / hip extensor limit' },
    { value: 'back_position_loss', label: 'Loses back position', sub: 'Erector spinae / bracing' },
    { value: 'no_clear_pattern', label: 'No clear pattern yet', sub: 'Skip — balanced accessories' },
  ],
};

const liftOrder = ['squat', 'bench', 'deadlift'] as const;
type LiftKey = typeof liftOrder[number];

const liftLabels: Record<LiftKey, string> = {
  squat: 'Squat',
  bench: 'Bench',
  deadlift: 'Deadlift',
};

export default function WeakPoint() {
  const navigate = useNavigate();
  const profile = useStore(s => s.profile);
  const setProfile = useStore(s => s.setProfile);

  const [weakPoints, setWeakPoints] = useState<Record<string, string>>({
    squat: profile.weakPoints?.squat ?? 'no_clear_pattern',
    bench: profile.weakPoints?.bench ?? 'no_clear_pattern',
    deadlift: profile.weakPoints?.deadlift ?? 'no_clear_pattern',
  });

  const handleSelect = (lift: string, value: string) => {
    setWeakPoints(prev => ({ ...prev, [lift]: value }));
  };

  const handleContinue = () => {
    setProfile({ weakPoints });
    navigate('/onboarding/history');
  };

  return (
    <OBShell
      step={3}
      eyebrow="Step 03 · Weak points"
      title="Where do you usually fail?"
      footer={<PrimaryBtn onClick={handleContinue}>Continue →</PrimaryBtn>}
    >
      {liftOrder.map(lift => (
        <div key={lift} style={{ marginBottom: 24 }}>
          <div className="tns-eyebrow" style={{ marginBottom: 10, marginTop: lift !== 'squat' ? 4 : 0 }}>
            {liftLabels[lift]}
          </div>
          {weakPointOptions[lift].map(opt => (
            <Choice
              key={opt.value}
              label={opt.label}
              sub={opt.sub}
              selected={weakPoints[lift] === opt.value}
              onClick={() => handleSelect(lift, opt.value)}
            />
          ))}
        </div>
      ))}
    </OBShell>
  );
}
