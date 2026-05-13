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

function FieldRow({ label, value, unit, onChange, inputWidth }: { label: string; value: string; unit?: string; onChange?: (v: string) => void; inputWidth?: number }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: `1px solid ${T.lineSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: T.textDim }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        {onChange ? (
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
              fontFamily: T.mono, fontSize: 14, fontWeight: 500, background: 'transparent',
              border: 'none', borderBottom: '1px solid transparent', color: T.text,
              textAlign: 'right', width: inputWidth ?? 120, outline: 'none',
            }}
            onFocus={e => { e.target.style.borderBottomColor = T.accent; }}
            onBlur={e => { e.target.style.borderBottomColor = 'transparent'; }}
          />
        ) : (
          <span className="tns-mono" style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
        )}
        {unit && <span className="tns-mono" style={{ fontSize: 10, color: T.textMute }}>{unit}</span>}
      </div>
    </div>
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

export default function Biometrics() {
  const navigate = useNavigate();
  const profile = useStore(s => s.profile);
  const setProfile = useStore(s => s.setProfile);

  const [bodyWeight, setBodyWeight] = useState(profile.bodyWeight);
  const [dob, setDob] = useState(profile.dob);
  const [sex, setSex] = useState<'Male' | 'Female'>(profile.sex);
  const [height, setHeight] = useState(profile.height ?? 0);
  const [trainingAge, setTrainingAge] = useState(profile.trainingAge);
  const [primaryGoal, setPrimaryGoal] = useState(profile.primaryGoal);

  const handleContinue = () => {
    setProfile({
      bodyWeight,
      dob,
      sex,
      height,
      trainingAge,
      primaryGoal,
    });
    navigate('/onboarding/baselines');
  };

  const trainingAges = ['6–12 months', '1–2 years', '2–5 years', '5+ years'];
  const primaryGoals = ['Powerlifting', 'Strength', 'Hypertrophy', 'General'];

  return (
    <OBShell
      step={1}
      eyebrow="Step 01 · Biometrics"
      title="Tell us about your body and history."
      footer={<PrimaryBtn onClick={handleContinue}>Continue →</PrimaryBtn>}
    >
      <div style={{ marginBottom: 22 }}>
        <FieldRow label="Body weight" value={String(bodyWeight)} unit="KG" onChange={v => setBodyWeight(Number(v) || 0)} inputWidth={80} />
        <FieldRow label="Date of birth" value={dob} onChange={setDob} inputWidth={140} />
        <FieldRow label="Height" value={String(height)} unit="CM" onChange={v => setHeight(Number(v) || 0)} inputWidth={80} />
      </div>

      <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Biological sex</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
        {(['Male', 'Female'] as const).map(s => (
          <div key={s} onClick={() => setSex(s)} style={{
            border: `1px solid ${sex === s ? T.accent : T.line}`,
            background: sex === s ? 'rgba(255,110,58,0.06)' : 'transparent',
            padding: '12px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'center',
          }}>{s}</div>
        ))}
      </div>

      <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Training age</div>
      {trainingAges.map(ta => (
        <Choice key={ta} label={ta} selected={trainingAge === ta} onClick={() => setTrainingAge(ta)} />
      ))}

      <div className="tns-eyebrow" style={{ marginTop: 18, marginBottom: 10 }}>Primary goal</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {primaryGoals.map(g => (
          <div key={g} onClick={() => setPrimaryGoal(g)} style={{
            border: `1px solid ${primaryGoal === g ? T.accent : T.line}`,
            background: primaryGoal === g ? 'rgba(255,110,58,0.06)' : 'transparent',
            padding: '12px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'center',
          }}>{g}</div>
        ))}
      </div>
    </OBShell>
  );
}
