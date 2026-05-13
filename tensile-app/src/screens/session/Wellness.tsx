import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { calculateRCS } from '../../engine';
import { T, Phone, AppHeader, PrimaryBtn, Spark } from '../../shared';

function WellnessSlider({ label, value, low, high, onChange }: {
  label: string; value: number; low: string; high: string; onChange: (v: number) => void;
}) {
  const pct = (value - 1) / 9 * 100;
  const colorPct = value >= 7 ? T.good : value >= 5 ? T.caution : T.bad;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
        <span className="tns-mono" style={{ fontSize: 14, color: colorPct }}>{value}<span style={{ color: T.textMute, fontSize: 10 }}>/10</span></span>
      </div>
      <div
        style={{ position: 'relative', height: 4, background: T.surface, cursor: 'pointer' }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const newVal = Math.round(1 + (x / rect.width) * 9);
          onChange(Math.max(1, Math.min(10, newVal)));
        }}
      >
        <div style={{ position: 'absolute', inset: 0, width: pct + '%', background: colorPct }} />
        <div style={{
          position: 'absolute', left: `calc(${pct}% - 6px)`, top: -4,
          width: 12, height: 12, background: T.text, border: `2px solid ${colorPct}`,
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

  const defaults = currentSession?.wellness ?? { sleepQuality: 7, overallFatigue: 6, muscleSoreness: 5, motivation: 8, stress: 6 };

  const [sleepQuality, setSleepQuality] = useState(defaults.sleepQuality);
  const [overallFatigue, setOverallFatigue] = useState(defaults.overallFatigue);
  const [muscleSoreness, setMuscleSoreness] = useState(defaults.muscleSoreness);
  const [motivation, setMotivation] = useState(defaults.motivation);
  const [stress, setStress] = useState(defaults.stress);

  const handleCompute = () => {
    const wellness = { sleepQuality, overallFatigue, muscleSoreness, motivation, stress };
    const rcs = calculateRCS(wellness);
    if (currentSession && block) {
      updateSession(block.id, currentSession.id, { wellness, rcs });
    }
    navigate('/session/readiness');
  };

  return (
    <Phone>
      <AppHeader eyebrow="Pre-session · 02:11 min" title="Readiness" back onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 24, lineHeight: 1.55 }}>
          Drag each marker. Sleep and fatigue weigh heaviest — they're the strongest predictors of today's readiness.
        </div>
        <WellnessSlider label="Sleep quality" value={sleepQuality} low="VERY POOR" high="EXCELLENT" onChange={setSleepQuality} />
        <WellnessSlider label="Overall fatigue" value={overallFatigue} low="FATIGUED" high="ENERGISED" onChange={setOverallFatigue} />
        <WellnessSlider label="Muscle soreness" value={muscleSoreness} low="SEVERE" high="NONE" onChange={setMuscleSoreness} />
        <WellnessSlider label="Motivation" value={motivation} low="POOR" high="HIGH" onChange={setMotivation} />
        <WellnessSlider label="Non-training stress" value={stress} low="EXTREME" high="NONE" onChange={setStress} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${T.line}`, marginTop: 10 }}>
          <div>
            <div className="tns-eyebrow" style={{ marginBottom: 4 }}>HRV · 7-day</div>
            <div className="tns-mono" style={{ fontSize: 13 }}>62 ms<span style={{ color: T.bad, marginLeft: 8 }}>−4.2%</span></div>
          </div>
          <Spark data={[64, 63, 62, 62, 61, 62, 62]} color={T.caution} w={70} h={22} />
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn onClick={handleCompute}>Compute readiness →</PrimaryBtn>
      </div>
    </Phone>
  );
}
