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

function FieldRow({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: `1px solid ${T.lineSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: T.textDim }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span className="tns-mono" style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
        {unit && <span className="tns-mono" style={{ fontSize: 10, color: T.textMute }}>{unit}</span>}
      </div>
    </div>
  );
}

function Choice({ label, sub, selected, mono }: { label: string; sub?: string; selected?: boolean; mono?: boolean }) {
  return (
    <div style={{
      border: `1px solid ${selected ? T.accent : T.line}`,
      background: selected ? 'rgba(255,110,58,0.06)' : 'transparent',
      padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
    }}>
      <div>
        <div className={mono ? 'tns-mono' : ''} style={{ fontSize: mono ? 14 : 15, fontWeight: 500 }}>{label}</div>
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

  return (
    <OBShell
      step={1}
      eyebrow="Step 01 · Biometrics"
      title="Tell us about your body and history."
      footer={<PrimaryBtn onClick={() => navigate('/onboarding/baselines')}>Continue →</PrimaryBtn>}
    >
      <div style={{ marginBottom: 22 }}>
        <FieldRow label="Body weight" value="84.5" unit="KG" />
        <FieldRow label="Date of birth" value="1991 · 06 · 12" />
        <FieldRow label="Biological sex" value="Male" />
        <FieldRow label="Height" value="178" unit="CM" />
      </div>

      <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Training age</div>
      <Choice label="6–12 months" />
      <Choice label="1–2 years" />
      <Choice label="2–5 years" selected />
      <Choice label="5+ years" />

      <div className="tns-eyebrow" style={{ marginTop: 18, marginBottom: 10 }}>Primary goal</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          ['Powerlifting', true],
          ['Strength', false],
          ['Hypertrophy', false],
          ['General', false],
        ].map(([l, s]) => (
          <div key={l as string} style={{
            border: `1px solid ${s ? T.accent : T.line}`,
            background: s ? 'rgba(255,110,58,0.06)' : 'transparent',
            padding: '12px 14px', fontSize: 13, fontWeight: 500,
          }}>{(l as string)}</div>
        ))}
      </div>
    </OBShell>
  );
}
