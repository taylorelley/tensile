import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import type { LiftKey } from '../../engine';
import { T, Phone, AppHeader, PrimaryBtn } from '../../shared';

interface CalibrationPoint {
  load: number;
  velocity: number;
}

type CalibrationTarget = 'all' | LiftKey;

function linearRegression(points: CalibrationPoint[]): { slope: number; intercept: number; r2: number } {
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.velocity, 0);
  const sumY = points.reduce((s, p) => s + p.load, 0);
  const sumXY = points.reduce((s, p) => s + p.velocity * p.load, 0);
  const sumX2 = points.reduce((s, p) => s + p.velocity * p.velocity, 0);
  const sumY2 = points.reduce((s, p) => s + p.load * p.load, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: 0, r2: 0 };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const ssTot = sumY2 - sumY * sumY / n;
  const ssRes = points.reduce((s, p) => s + Math.pow(p.load - (slope * p.velocity + intercept), 2), 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  return { slope, intercept, r2 };
}

export default function VbtCalibration() {
  const navigate = useNavigate();
  const profile = useStore(s => s.profile);
  const setProfile = useStore(s => s.setProfile);

  const [points, setPoints] = useState<CalibrationPoint[]>([
    { load: 0, velocity: 0 },
    { load: 0, velocity: 0 },
  ]);
  const [target, setTarget] = useState<CalibrationTarget>('all');
  // P1.4.5: equipment captured during calibration; LVP refuses to apply if
  // equipment at prescription time differs.
  const [straps, setStraps] = useState(false);
  const [belt, setBelt] = useState(profile.belt);
  const [sleeves, setSleeves] = useState(profile.kneeSleeves === 'sleeves');
  const [wraps, setWraps] = useState(profile.kneeSleeves === 'wraps');

  const validPoints = points.filter(p => p.load > 0 && p.velocity > 0);
  const canCalibrate = validPoints.length >= 2;
  const regression = canCalibrate ? linearRegression(validPoints) : null;

  const updatePoint = (index: number, field: keyof CalibrationPoint, value: number) => {
    const next = [...points];
    next[index] = { ...next[index], [field]: value };
    setPoints(next);
  };

  const addPoint = () => {
    setPoints([...points, { load: 0, velocity: 0 }]);
  };

  const handleSave = () => {
    if (!regression) return;
    const fitted = {
      slope: Math.round(regression.slope * 1000) / 1000,
      intercept: Math.round(regression.intercept * 1000) / 1000,
      n: validPoints.length,
      rSquared: Math.round(regression.r2 * 1000) / 1000,
      equipment: { straps, belt, sleeves, wraps },
    };
    if (target === 'all') {
      setProfile({ lvProfile: fitted });
    } else {
      setProfile({
        lvProfiles: { ...(profile.lvProfiles ?? {}), [target]: fitted },
      });
    }
    navigate(-1);
  };

  const targetOptions: { id: CalibrationTarget; label: string }[] = [
    { id: 'all', label: 'All lifts' },
    { id: 'squat', label: 'Squat' },
    { id: 'bench', label: 'Bench' },
    { id: 'deadlift', label: 'Deadlift' },
  ];

  return (
    <Phone>
      <AppHeader eyebrow="VBT" title="Calibrate VBT" back onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.55 }}>
          Enter at least 2 sets with known load and measured mean propulsive velocity. The app will build a load-velocity profile for e1RM estimation. Per-lift profiles are preferred for LRV-based RPE calibration.
        </div>

        {/* Target picker — which lift this profile is for */}
        <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Target lift</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 18 }}>
          {targetOptions.map(opt => {
            const selected = target === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setTarget(opt.id)}
                style={{
                  padding: '10px 0', textAlign: 'center', cursor: 'pointer',
                  border: `1px solid ${selected ? T.accent : T.line}`,
                  background: selected ? T.accent : 'transparent',
                  color: selected ? '#1a0f08' : T.text,
                  fontFamily: T.mono, fontSize: 11, fontWeight: 500,
                }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>

        {points.map((p, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <div>
              <div className="tns-eyebrow" style={{ marginBottom: 4 }}>Load · kg</div>
              <input
                type="number"
                step={2.5}
                value={p.load || ''}
                onChange={e => updatePoint(i, 'load', Number(e.target.value))}
                style={{
                  fontFamily: T.mono, fontSize: 14, fontWeight: 500,
                  background: 'transparent', border: `1px solid ${T.line}`,
                  color: T.text, padding: '10px 12px', outline: 'none', width: '100%',
                }}
              />
            </div>
            <div>
              <div className="tns-eyebrow" style={{ marginBottom: 4 }}>Velocity · m/s</div>
              <input
                type="number"
                step={0.01}
                value={p.velocity || ''}
                onChange={e => updatePoint(i, 'velocity', Number(e.target.value))}
                style={{
                  fontFamily: T.mono, fontSize: 14, fontWeight: 500,
                  background: 'transparent', border: `1px solid ${T.line}`,
                  color: T.text, padding: '10px 12px', outline: 'none', width: '100%',
                }}
              />
            </div>
          </div>
        ))}

        <div style={{ marginTop: 8, marginBottom: 18 }}>
          <span
            className="tns-mono"
            style={{ fontSize: 10, color: T.accent, letterSpacing: '0.08em', cursor: 'pointer' }}
            onClick={addPoint}
          >
            + ADD SET →
          </span>
        </div>

        {/* P1.4.5 equipment capture. */}
        <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Equipment used in calibration</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 18 }}>
          {([
            { id: 'straps', label: 'Straps', value: straps, set: setStraps },
            { id: 'belt', label: 'Belt', value: belt, set: setBelt },
            { id: 'sleeves', label: 'Sleeves', value: sleeves, set: setSleeves },
            { id: 'wraps', label: 'Wraps', value: wraps, set: setWraps },
          ] as const).map(opt => (
            <div
              key={opt.id}
              onClick={() => opt.set(!opt.value)}
              style={{
                padding: '10px 0', textAlign: 'center', cursor: 'pointer',
                border: `1px solid ${opt.value ? T.accent : T.line}`,
                background: opt.value ? T.accent : 'transparent',
                color: opt.value ? '#1a0f08' : T.text,
                fontFamily: T.mono, fontSize: 10, fontWeight: 500,
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>

        {regression && (
          <div style={{ border: `1px solid ${T.line}`, padding: '14px 16px', marginBottom: 18 }}>
            <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Profile preview</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <div className="tns-eyebrow" style={{ fontSize: 8.5, marginBottom: 4 }}>SLOPE</div>
                <div className="tns-mono" style={{ fontSize: 14 }}>{regression.slope.toFixed(2)}</div>
              </div>
              <div>
                <div className="tns-eyebrow" style={{ fontSize: 8.5, marginBottom: 4 }}>INTERCEPT</div>
                <div className="tns-mono" style={{ fontSize: 14 }}>{regression.intercept.toFixed(2)}</div>
              </div>
              <div>
                <div className="tns-eyebrow" style={{ fontSize: 8.5, marginBottom: 4 }}>R²</div>
                <div className="tns-mono" style={{ fontSize: 14, color: regression.r2 >= 0.9 ? T.good : regression.r2 >= 0.7 ? T.caution : T.bad }}>
                  {regression.r2.toFixed(3)}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>
              {regression.r2 >= 0.9
                ? 'Excellent fit. VBT e1RM estimates will be highly reliable.'
                : regression.r2 >= 0.7
                  ? 'Acceptable fit. Add more calibration sets to improve accuracy.'
                  : 'Poor fit. Check velocity measurement consistency.'}
            </div>
          </div>
        )}

        {profile.lvProfile && (
          <div style={{ padding: '12px 14px', background: T.surface, borderLeft: `2px solid ${T.good}`, marginBottom: 10 }}>
            <span className="tns-mono" style={{ fontSize: 9, color: T.good, letterSpacing: '0.08em' }}>FALLBACK PROFILE · ALL LIFTS</span>
            <div style={{ marginTop: 4, fontSize: 11, color: T.textDim }}>
              {profile.lvProfile.n} sets · slope {profile.lvProfile.slope} · intercept {profile.lvProfile.intercept}
            </div>
          </div>
        )}
        {profile.lvProfiles && Object.entries(profile.lvProfiles).map(([liftId, lv]) => (
          lv ? (
            <div key={liftId} style={{ padding: '12px 14px', background: T.surface, borderLeft: `2px solid ${T.good}`, marginBottom: 10 }}>
              <span className="tns-mono" style={{ fontSize: 9, color: T.good, letterSpacing: '0.08em' }}>{liftId.toUpperCase()} PROFILE</span>
              <div style={{ marginTop: 4, fontSize: 11, color: T.textDim }}>
                {lv.n} sets · slope {lv.slope} · intercept {lv.intercept}
              </div>
            </div>
          ) : null
        ))}
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn dim={!canCalibrate} onClick={handleSave}>
          {canCalibrate ? 'Save profile →' : 'Need 2+ valid sets'}
        </PrimaryBtn>
      </div>
    </Phone>
  );
}
