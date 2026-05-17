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
  const [programmingMode, setProgrammingMode] = useState<'PHASE' | 'TTP'>(profile.programmingMode ?? 'PHASE');
  const [squatStance, setSquatStance] = useState(profile.squatStance);
  const [deadliftStance, setDeadliftStance] = useState(profile.deadliftStance);
  const [belt, setBelt] = useState(profile.belt);
  const [kneeSleeves, setKneeSleeves] = useState(profile.kneeSleeves);

  const [showNoviceGate, setShowNoviceGate] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);

  const handleContinue = () => {
    // Training age gate: < 6 months is out of scope for v1.0
    if (trainingAge === '< 6 months') {
      setShowNoviceGate(true);
      return;
    }
    // Map training age string to numeric years for TTP initialisation
    const ageMap: Record<string, number> = {
      '6–12 months': 0.75,
      '1–2 years': 1.5,
      '2–5 years': 3,
      '5+ years': 7,
    };
    const trainingAgeYears = ageMap[trainingAge] ?? 3;
    // Flag RPE calibration required for 6–12 months users
    const needsCalibration = trainingAge === '6–12 months';
    setProfile({
      bodyWeight,
      dob,
      sex,
      height,
      trainingAge,
      trainingAgeYears,
      primaryGoal,
      programmingMode,
      programmingModeChangedAt: programmingMode !== profile.programmingMode ? new Date().toISOString() : profile.programmingModeChangedAt,
      squatStance,
      deadliftStance,
      belt,
      kneeSleeves,
      rpeCalibration: needsCalibration ? { sessions: 0, mae: 1.0 } : profile.rpeCalibration,
    });
    navigate('/onboarding/baselines');
  };

  const trainingAges = ['< 6 months', '6–12 months', '1–2 years', '2–5 years', '5+ years'];
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
      <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.45, marginBottom: 10 }}>
        Training age determines how aggressively we progress your loads.
      </div>
      {trainingAges.map(ta => (
        <Choice key={ta} label={ta} selected={trainingAge === ta} onClick={() => setTrainingAge(ta)} />
      ))}

      <div className="tns-eyebrow" style={{ marginTop: 18, marginBottom: 10 }}>Primary goal</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {primaryGoals.map(g => {
          // P1.4.4: only Powerlifting/Strength generators are fully wired.
          // Hypertrophy/General will branch a different template family but
          // until they ship, surface them as coming soon so the UX promise
          // matches behaviour. They remain selectable so existing users keep
          // their data; selection just nudges them with a hint.
          const supported = g === 'Powerlifting' || g === 'Strength';
          return (
            <div key={g} onClick={() => setPrimaryGoal(g)} style={{
              border: `1px solid ${primaryGoal === g ? T.accent : T.line}`,
              background: primaryGoal === g ? 'rgba(255,110,58,0.06)' : 'transparent',
              padding: '12px 14px', cursor: 'pointer', textAlign: 'center',
              opacity: supported ? 1 : 0.6,
            }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{g}</div>
              {!supported && (
                <div style={{ fontSize: 9, color: T.textDim, marginTop: 3 }}>Coming soon — runs strength templates for now</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="tns-eyebrow" style={{ marginTop: 18, marginBottom: 10 }}>Programming mode</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {([
          { id: 'PHASE', label: 'Traditional phases', sub: 'Accumulation → Intensification → Realisation. Stimulus changes shape every few weeks.', recommended: true },
          { id: 'TTP', label: 'Bottom-up TTP', sub: 'Constant microcycle. Loads rise as your e1RM does. Block ends when you stop progressing.', recommended: false },
        ] as const).map(opt => (
          <div key={opt.id} onClick={() => setProgrammingMode(opt.id)} style={{
            border: `1px solid ${programmingMode === opt.id ? T.accent : T.line}`,
            background: programmingMode === opt.id ? 'rgba(255,110,58,0.06)' : 'transparent',
            padding: '12px 14px', cursor: 'pointer', position: 'relative',
          }}>
            {opt.recommended && (
              <div style={{ position: 'absolute', top: 6, right: 6, fontFamily: T.mono, fontSize: 7, color: T.accent, letterSpacing: '0.1em', fontWeight: 600 }}>REC</div>
            )}
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{opt.label}</div>
            <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.45 }}>{opt.sub}</div>
          </div>
        ))}
      </div>

      {/* Equipment & stance — progressive disclosure */}
      <div
        onClick={() => setShowEquipment(!showEquipment)}
        style={{
          marginTop: 18, padding: '12px 14px', border: `1px solid ${T.lineSoft}`,
          background: T.surface2, cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span className="tns-eyebrow" style={{ marginBottom: 0 }}>Equipment & stance</span>
        <span className="tns-mono" style={{ fontSize: 10, color: T.textMute }}>{showEquipment ? '▲' : '▼'}</span>
      </div>
      {showEquipment && (
        <>
          <div className="tns-eyebrow" style={{ marginTop: 14, marginBottom: 10 }}>Squat stance</div>
          {['Narrow', 'Moderate', 'Wide'].map(s => (
            <Choice key={s} label={s} selected={squatStance === s.toLowerCase()} onClick={() => setSquatStance(s.toLowerCase())} />
          ))}

          <div className="tns-eyebrow" style={{ marginTop: 14, marginBottom: 10 }}>Deadlift stance</div>
          {['Conventional', 'Sumo', 'Mixed'].map(s => (
            <Choice key={s} label={s} selected={deadliftStance === s.toLowerCase()} onClick={() => setDeadliftStance(s.toLowerCase())} />
          ))}

          <div className="tns-eyebrow" style={{ marginTop: 14, marginBottom: 10 }}>Belt</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[true, false].map(v => (
              <div key={String(v)} onClick={() => setBelt(v)} style={{
                border: `1px solid ${belt === v ? T.accent : T.line}`,
                background: belt === v ? 'rgba(255,110,58,0.06)' : 'transparent',
                padding: '12px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'center',
              }}>{v ? 'Yes' : 'No'}</div>
            ))}
          </div>

          <div className="tns-eyebrow" style={{ marginTop: 14, marginBottom: 10 }}>Knee sleeves</div>
          {['Raw', 'Sleeves', 'Wraps'].map(s => (
            <Choice key={s} label={s} selected={kneeSleeves === s.toLowerCase()} onClick={() => setKneeSleeves(s.toLowerCase())} />
          ))}
        </>
      )}

      {/* Novice gate modal */}
      {showNoviceGate && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,12,10,0.85)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
          <div style={{ border: `1px solid ${T.line}`, background: T.bg, padding: '22px 24px', maxWidth: 320 }}>
            <div className="tns-eyebrow" style={{ marginBottom: 8, color: T.caution }}>ELIGIBILITY</div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 24, lineHeight: 1.1, marginBottom: 12 }}>Tensile is built for experienced lifters.</div>
            <div style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.55, marginBottom: 18 }}>
              RPE accuracy — the foundation of autoregulation — is unreliable in true novices. We recommend a simple linear progression programme for your first 6 months.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <PrimaryBtn dim full={false} onClick={() => setShowNoviceGate(false)}>Back</PrimaryBtn>
              <PrimaryBtn onClick={() => { setTrainingAge('6–12 months'); setShowNoviceGate(false); }}>I'm at 6 months →</PrimaryBtn>
            </div>
          </div>
        </div>
      )}
    </OBShell>
  );
}
