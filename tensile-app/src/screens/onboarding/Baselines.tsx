import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Logo, PrimaryBtn, StepDots, T } from '../../shared';
import { useStore } from '../../store';
import { ensembleE1RM } from '../../engine';

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

const liftMeta = [
  { key: 'squat' as const, name: 'Back squat' },
  { key: 'bench' as const, name: 'Bench press' },
  { key: 'deadlift' as const, name: 'Deadlift' },
];

const OHP_KEY = 'overhead_press';

interface LiftInput {
  weight: number;
  reps: number;
  rpe: number;
}

export default function Baselines() {
  const navigate = useNavigate();
  const profile = useStore(s => s.profile);
  const setProfile = useStore(s => s.setProfile);

  // Initialise from existing e1rm via reverse estimation (load ~85% of e1rm), or use PRD defaults
  function defaultLift(key: string): LiftInput {
    const e1 = profile.e1rm?.[key];
    if (e1 && e1 > 0) {
      return { weight: Math.round(e1 * 0.85), reps: 3, rpe: 8.5 };
    }
    const defaults: Record<string, LiftInput> = {
      squat: { weight: 180, reps: 3, rpe: 8.5 },
      bench: { weight: 125, reps: 4, rpe: 8.0 },
      deadlift: { weight: 210, reps: 2, rpe: 9.0 },
      [OHP_KEY]: { weight: 60, reps: 5, rpe: 8.0 },
    };
    return defaults[key] ?? { weight: 100, reps: 3, rpe: 8.0 };
  }

  const [squat, setSquat] = useState<LiftInput>(defaultLift('squat'));
  const [bench, setBench] = useState<LiftInput>(defaultLift('bench'));
  const [deadlift, setDeadlift] = useState<LiftInput>(defaultLift('deadlift'));
  const [ohp, setOhp] = useState<LiftInput>(defaultLift(OHP_KEY));
  const [showOhp, setShowOhp] = useState<boolean>(() => !!profile.e1rm?.[OHP_KEY]);

  const liftData: Record<string, LiftInput> = { squat, bench, deadlift, [OHP_KEY]: ohp };
  const setters: Record<string, React.Dispatch<React.SetStateAction<LiftInput>>> = {
    squat: setSquat, bench: setBench, deadlift: setDeadlift, [OHP_KEY]: setOhp,
  };

  const activeMeta = showOhp
    ? [...liftMeta, { key: OHP_KEY, name: 'Overhead press' }]
    : liftMeta;

  const e1rmResults = useMemo(() => {
    const results: Record<string, ReturnType<typeof ensembleE1RM>> = {};
    for (const { key } of activeMeta) {
      const d = liftData[key];
      results[key] = ensembleE1RM(
        { load: d.weight, reps: d.reps, rpe: d.rpe },
        profile.rpeTable,
        profile.rpeCalibration,
        profile.rollingE1rm?.[key] ?? 200,
        0.3,
      );
    }
    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [squat, bench, deadlift, ohp, showOhp, profile.rpeTable, profile.rpeCalibration, profile.rollingE1rm]);

  const updateField = (key: string, field: keyof LiftInput, raw: string) => {
    const val = raw === '' ? 0 : Number(raw);
    if (isNaN(val)) return;
    const prev = liftData[key];
    const updated = { ...prev, [field]: val };
    setters[key](updated);
  };

  const handleContinue = () => {
    const e1rm: Record<string, number> = { ...profile.e1rm };
    const rollingE1rm: Record<string, number> = { ...profile.rollingE1rm };
    for (const { key } of activeMeta) {
      const r = e1rmResults[key];
      e1rm[key] = Math.round(r.session * 10) / 10;
      rollingE1rm[key] = Math.round(r.rolling * 10) / 10;
    }
    if (!showOhp) {
      delete e1rm[OHP_KEY];
      delete rollingE1rm[OHP_KEY];
    }
    setProfile({
      e1rm,
      rollingE1rm,
      rpeCalibration: {
        sessions: Math.max(1, profile.rpeCalibration.sessions),
        mae: profile.rpeCalibration.mae,
      },
    });
    navigate('/onboarding/weak-point');
  };

  const inputStyle = (): React.CSSProperties => ({
    fontFamily: T.mono,
    fontSize: 16,
    padding: '6px 10px',
    border: `1px solid ${T.line}`,
    background: 'transparent',
    color: T.text,
    outline: 'none',
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'center',
  });

  return (
    <OBShell
      step={2}
      eyebrow="Step 02 · Baselines"
      title="Best recent work sets — we'll estimate your 1RM."
      footer={<PrimaryBtn onClick={handleContinue}>Continue →</PrimaryBtn>}
    >
      <div style={{ marginBottom: 14, padding: '10px 12px', background: T.surface, fontSize: 11, color: T.textDim, lineHeight: 1.5, borderLeft: `2px solid ${T.accent}` }}>
        Enter a recent <span className="tns-mono" style={{ color: T.text }}>weight × reps × RPE</span> for each lift. We use an Epley/Brzycki/RPE ensemble to estimate your 1RM.
      </div>

      {activeMeta.map(({ key, name }) => {
        const d = liftData[key];
        const e1 = e1rmResults[key];
        const isOhp = key === OHP_KEY;
        return (
          <div key={key} style={{ border: `1px solid ${T.line}`, marginBottom: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isOhp && (
                  <span
                    onClick={() => setShowOhp(false)}
                    className="tns-mono"
                    style={{ fontSize: 9, color: T.bad, letterSpacing: '0.08em', cursor: 'pointer' }}
                  >× REMOVE</span>
                )}
                <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}>e1RM</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 9, color: T.textMute, fontFamily: T.mono, letterSpacing: '0.1em', marginBottom: 4 }}>WEIGHT</div>
                  <input
                    value={d.weight || ''}
                    onChange={e => updateField(key, 'weight', e.target.value)}
                    style={{ ...inputStyle(), minWidth: 64 }}
                    onFocus={e => { e.target.style.borderColor = T.accent; }}
                    onBlur={e => { e.target.style.borderColor = T.line; }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: T.textMute, fontFamily: T.mono, letterSpacing: '0.1em', marginBottom: 4 }}>REPS</div>
                  <input
                    value={d.reps || ''}
                    onChange={e => updateField(key, 'reps', e.target.value)}
                    style={{ ...inputStyle(), minWidth: 38 }}
                    onFocus={e => { e.target.style.borderColor = T.accent; }}
                    onBlur={e => { e.target.style.borderColor = T.line; }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: T.textMute, fontFamily: T.mono, letterSpacing: '0.1em', marginBottom: 4 }}>RPE</div>
                  <input
                    value={d.rpe || ''}
                    onChange={e => updateField(key, 'rpe', e.target.value)}
                    style={{ ...inputStyle(), minWidth: 44 }}
                    onFocus={e => { e.target.style.borderColor = T.accent; }}
                    onBlur={e => { e.target.style.borderColor = T.line; }}
                  />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="tns-serif" style={{ fontSize: 28 }}>{Math.round(e1.session)}</span>
                <span className="tns-mono" style={{ fontSize: 9, color: T.textMute, marginLeft: 3 }}>KG</span>
              </div>
            </div>
          </div>
        );
      })}

      {!showOhp && (
        <div
          onClick={() => setShowOhp(true)}
          style={{ marginTop: 8, fontSize: 11, color: T.accent, fontFamily: T.mono, letterSpacing: '0.04em', cursor: 'pointer' }}
        >
          + ADD OVERHEAD PRESS (optional)
        </div>
      )}
    </OBShell>
  );
}
