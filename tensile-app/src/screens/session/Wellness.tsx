import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { calculateRCS, hrvCoefficientOfVariation } from '../../engine';
import { T, Phone, AppHeader, PrimaryBtn, Spark, StepDots } from '../../shared';

function WellnessSlider({ label, value, low, high, onChange }: {
  label: string; value: number; low: string; high: string; onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [displayValue, setDisplayValue] = useState(value);
  const draggingRef = useRef(false);
  const didDrag = useRef(false);
  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    if (!draggingRef.current) setDisplayValue(value);
  }, [value]);

  const computeValue = (clientX: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(1, Math.min(10, Math.round(1 + (x / rect.width) * 9)));
  };

  const pct = (displayValue - 1) / 9 * 100;
  const colorPct = displayValue >= 7 ? T.good : displayValue >= 5 ? T.caution : T.bad;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
        <span className="tns-mono" style={{ fontSize: 14, color: colorPct }}>{displayValue}<span style={{ color: T.textMute, fontSize: 10 }}>/10</span></span>
      </div>
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={displayValue}
        aria-label={label}
        tabIndex={0}
        style={{ position: 'relative', height: 6, background: T.surface, cursor: 'pointer', touchAction: 'none', userSelect: 'none', padding: '8px 0' }}
        onClick={(e) => {
          if (didDrag.current) { didDrag.current = false; return; }
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const newVal = Math.round(1 + (x / rect.width) * 9);
          const clamped = Math.max(1, Math.min(10, newVal));
          setDisplayValue(clamped);
          onChangeRef.current(clamped);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const newVal = Math.max(1, displayValue - 1);
            setDisplayValue(newVal);
            onChangeRef.current(newVal);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const newVal = Math.min(10, displayValue + 1);
            setDisplayValue(newVal);
            onChangeRef.current(newVal);
          }
        }}
        onMouseDown={(e) => {
          draggingRef.current = true;
          didDrag.current = false;
          setDisplayValue(computeValue(e.clientX));

          const handleMove = (ev: MouseEvent) => {
            didDrag.current = true;
            setDisplayValue(computeValue(ev.clientX));
          };
          const handleUp = () => {
            draggingRef.current = false;
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            setDisplayValue(prev => {
              onChangeRef.current(prev);
              return prev;
            });
          };
          window.addEventListener('mousemove', handleMove);
          window.addEventListener('mouseup', handleUp);
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 0) return;
          draggingRef.current = true;
          didDrag.current = false;
          setDisplayValue(computeValue(e.touches[0].clientX));

          const handleMove = (ev: TouchEvent) => {
            if (ev.touches.length === 0) return;
            didDrag.current = true;
            setDisplayValue(computeValue(ev.touches[0].clientX));
          };
          const handleEnd = () => {
            draggingRef.current = false;
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('touchcancel', handleEnd);
            setDisplayValue(prev => {
              onChangeRef.current(prev);
              return prev;
            });
          };
          window.addEventListener('touchmove', handleMove);
          window.addEventListener('touchend', handleEnd);
          window.addEventListener('touchcancel', handleEnd);
        }}
      >
        <div style={{ position: 'absolute', inset: '8px 0', width: pct + '%', background: colorPct }} />
        <div style={{
          position: 'absolute', left: `calc(${pct}% - 10px)`, top: 1,
          width: 20, height: 20, borderRadius: 99,
          background: T.text, border: `2px solid ${colorPct}`,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontFamily: T.mono, fontSize: 9, color: T.textMute, letterSpacing: '0.06em' }}>
        <span>{low}</span><span>{high}</span>
      </div>
    </div>
  );
}

export default function Wellness() {
  const navigate = useNavigate();
  const block = useStore(s => s.currentBlock);
  const currentSession = useStore(s => s.currentSession);
  const updateSession = useStore(s => s.updateSession);
  const profile = useStore(s => s.profile);
  const setProfile = useStore(s => s.setProfile);

  const defaults = currentSession?.wellness ?? { sleepQuality: 7, overallFatigue: 6, muscleSoreness: 5, motivation: 8, stress: 6, jointPain: 1 };

  const [sleepQuality, setSleepQuality] = useState(defaults.sleepQuality);
  const [overallFatigue, setOverallFatigue] = useState(defaults.overallFatigue);
  const [muscleSoreness, setMuscleSoreness] = useState(defaults.muscleSoreness);
  const [motivation, setMotivation] = useState(defaults.motivation);
  const [stress, setStress] = useState(defaults.stress);
  const [jointPain, setJointPain] = useState(defaults.jointPain ?? 1);
  const [showHrvInput, setShowHrvInput] = useState(false);
  const [hrvInput, setHrvInput] = useState<number | undefined>(undefined);

  if (!currentSession || !block) {
    return (
      <Phone>
        <AppHeader eyebrow="Pre-session" title="Readiness" back onBack={() => navigate(-1)} />
        <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1, marginBottom: 12 }}>No active session</div>
            <div style={{ fontSize: 13, color: T.textDim }}>Please start a session from the Today screen.</div>
          </div>
        </div>
        <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
          <PrimaryBtn onClick={() => navigate('/')}>Back to Today →</PrimaryBtn>
        </div>
      </Phone>
    );
  }

  const handleCompute = () => {
    const wellness = { sleepQuality, overallFatigue, muscleSoreness, motivation, stress, hrvRmssd: hrvInput, jointPain };
    const completed = block.sessions
      .filter(s => s.status === 'COMPLETE')
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    let rpeDrift = 0;
    if (completed.length >= 6) {
      const first3 = completed.slice(0, 3);
      const last3 = completed.slice(-3);
      const avgFirst = first3.reduce((sum, s) => sum + (s.srpe ?? 0), 0) / first3.length;
      const avgLast = last3.reduce((sum, s) => sum + (s.srpe ?? 0), 0) / last3.length;
      rpeDrift = Math.max(0, avgLast - avgFirst);
    }
    // P0.3.1: HRV contributes only when a real reading exists. No synthetic
    // estimate is derived from the wellness composite.
    let hrv28DayBaseline = profile.hrv28DayBaseline;
    let rolling7DayHrv: number | undefined;
    if (hrvInput !== undefined) {
      const newHistory = [...(profile.hrvHistory || []), hrvInput].slice(-28);
      hrv28DayBaseline = newHistory.length > 0
        ? Math.round(newHistory.reduce((a, b) => a + b, 0) / newHistory.length * 10) / 10
        : undefined;
      const last7 = newHistory.slice(-7);
      rolling7DayHrv = last7.length > 0
        ? Math.round(last7.reduce((a, b) => a + b, 0) / last7.length * 10) / 10
        : undefined;
      // P2.5.6: persist Coefficient of Variation alongside the baseline.
      const hrv28DayCv = newHistory.length >= 4 ? Math.round(hrvCoefficientOfVariation(newHistory) * 1000) / 1000 : undefined;
      setProfile({ hrvHistory: newHistory, hrv28DayBaseline, hrv28DayCv });
    } else if ((profile.hrvHistory ?? []).length >= 3) {
      const last7 = (profile.hrvHistory ?? []).slice(-7);
      rolling7DayHrv = Math.round(last7.reduce((a, b) => a + b, 0) / last7.length * 10) / 10;
    }

    const rcs = calculateRCS(wellness, rolling7DayHrv, hrv28DayBaseline, rpeDrift);
    updateSession(block.id, currentSession.id, { wellness, rcs, wellnessCompleted: true });
    navigate('/session/readiness');
  };

  return (
    <Phone>
      <AppHeader eyebrow="Pre-session · 02:11 min" title="Readiness" back onBack={() => navigate(-1)} />
      <div style={{ padding: '0 22px 8px' }}>
        <StepDots step={1} total={6} />
      </div>
      <div className="route-enter" style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 24, lineHeight: 1.55 }}>
          Drag each marker. Sleep and fatigue weigh heaviest — they're the strongest predictors of today's readiness.
        </div>
        {block && block.sessions.filter(s => s.status === 'COMPLETE').length >= 1 && (
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <button type="button" className="tns-mono" style={{ fontSize: 10, color: T.textMute, cursor: 'pointer', padding: '8px 12px', background: 'none', border: 'none', fontFamily: 'inherit' }} aria-label="Use last session's wellness values" onClick={() => {
              const completed = block.sessions
                .filter(s => s.status === 'COMPLETE')
                .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
              const last = completed[0];
              if (last?.wellness) {
                setSleepQuality(last.wellness.sleepQuality);
                setOverallFatigue(last.wellness.overallFatigue);
                setMuscleSoreness(last.wellness.muscleSoreness);
                setMotivation(last.wellness.motivation);
                setStress(last.wellness.stress);
                setJointPain(last.wellness.jointPain ?? 1);
              }
            }}>
              USE LAST SESSION'S VALUES →
            </button>
          </div>
        )}
        <WellnessSlider label="Sleep quality" value={sleepQuality} low="VERY POOR" high="EXCELLENT" onChange={setSleepQuality} />
        <WellnessSlider label="Overall fatigue" value={overallFatigue} low="FATIGUED" high="ENERGISED" onChange={setOverallFatigue} />
        <WellnessSlider label="Muscle recovery" value={muscleSoreness} low="VERY SORE" high="FULLY RECOVERED" onChange={setMuscleSoreness} />
        <WellnessSlider label="Motivation" value={motivation} low="POOR" high="HIGH" onChange={setMotivation} />
        <WellnessSlider label="Stress level" value={stress} low="EXTREME" high="NONE" onChange={setStress} />
        <WellnessSlider label="Joint health" value={jointPain} low="SEVERE PAIN" high="NO PAIN" onChange={setJointPain} />

        {/* Manual HRV entry */}
        <div style={{ marginTop: 14, marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tns-eyebrow">HRV (optional)</span>
            <button type="button" className="tns-mono" style={{ fontSize: 9, color: T.accent, letterSpacing: '0.08em', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }} aria-expanded={showHrvInput} onClick={() => setShowHrvInput(!showHrvInput)}>
              {showHrvInput ? 'HIDE' : 'ADD HRV →'}
            </button>
          </div>
          {showHrvInput && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <label htmlFor="hrv-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>HRV rMSSD in milliseconds</label>
              <input
                id="hrv-input"
                type="number"
                value={hrvInput ?? ''}
                onChange={e => setHrvInput(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="rMSSD ms"
                style={{
                  fontFamily: T.mono, fontSize: 14, fontWeight: 500,
                  background: 'transparent', border: `1px solid ${T.line}`,
                  color: T.text, padding: '8px 10px', outline: 'none', width: 120,
                }}
              />
              <span style={{ fontSize: 11, color: T.textDim }}>Morning rMSSD (ms)</span>
            </div>
          )}
        </div>

        {/* P0.3.1: real HRV history only — no synthetic estimate from wellness. */}
        {(() => {
          const history = profile.hrvHistory ?? [];
          if (history.length === 0) {
            return (
              <div style={{ padding: '12px 14px', border: `1px solid ${T.line}`, marginTop: 10 }}>
                <div className="tns-eyebrow" style={{ marginBottom: 4 }}>HRV</div>
                <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.45 }}>
                  Not available today — score uses subjective wellness only. Enter rMSSD above to enable HRV-adjusted readiness.
                </div>
              </div>
            );
          }
          const last7 = history.slice(-7);
          const currentHrv = last7[last7.length - 1];
          const prevAvg = last7.length >= 6 ? last7.slice(0, 3).reduce((a, b) => a + b, 0) / 3 : currentHrv;
          const currAvg = last7.length >= 3 ? last7.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, last7.length) : currentHrv;
          const pctChange = prevAvg > 0 ? ((currAvg - prevAvg) / prevAvg) * 100 : 0;
          const changeColor = pctChange >= -2 ? T.good : pctChange >= -5 ? T.caution : T.bad;
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${T.line}`, marginTop: 10 }}>
              <div>
                <div className="tns-eyebrow" style={{ marginBottom: 4 }}>HRV · last 7 days</div>
                <div className="tns-mono" style={{ fontSize: 13 }}>{currentHrv} ms<span style={{ color: changeColor, marginLeft: 8 }}>{pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%</span></div>
              </div>
              <Spark data={last7} color={changeColor} w={70} h={22} />
            </div>
          );
        })()}
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn onClick={handleCompute}>Compute readiness →</PrimaryBtn>
      </div>
    </Phone>
  );
}
