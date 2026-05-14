import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, AppHeader, TabBar, T } from '../../shared';
import { generatePeakingPlan } from '../../engine';
import { useStore } from '../../store';

const phaseColors = [T.accent, T.caution, T.text, T.textDim, T.accent];
const phaseLabels = ['DEV', 'PIV', 'REAL', 'TPR', '★'];

export default function Peaking() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);

  const meetDate = new Date(profile.meetDate || '2026-09-14');
  const plan = generatePeakingPlan(meetDate, profile.ttpEstimate);
  const devWeeks = Math.round((plan.pivotStart.getTime() - plan.developmentStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const pivotWeeks = Math.round((plan.realisationStart.getTime() - plan.pivotStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const realWeeks = Math.round((plan.taperStart.getTime() - plan.realisationStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const taperDays = Math.round((plan.meetDate.getTime() - plan.taperStart.getTime()) / (24 * 60 * 60 * 1000));
  const totalWeeks = Math.ceil((plan.meetDate.getTime() - plan.developmentStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const daysToMeet = Math.max(0, Math.floor((plan.meetDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)));

  const phases = [
    { l: 'Development', wk: `${devWeeks} wk`, start: 'NOW', col: T.accent, w: devWeeks },
    { l: 'Pivot', wk: `${pivotWeeks} wk`, col: T.caution, w: pivotWeeks },
    { l: 'Realisation', wk: `${realWeeks} wk`, col: T.text, w: realWeeks },
    { l: 'Taper', wk: `${taperDays} d`, col: T.textDim, w: Math.max(1, Math.round(taperDays / 7)) },
    { l: 'MEET', wk: `${plan.meetDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`, col: T.accent, w: 2, terminal: true },
  ];

  return (
    <Phone>
      <AppHeader eyebrow={`Peaking · ${totalWeeks} weeks out`} title={`Path to ${meetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} back onBack={() => navigate('/meet/setup')} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        {/* Countdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 22,
            borderBottom: `1px solid ${T.line}`,
            paddingBottom: 18,
          }}
        >
          <div>
            <div className="tns-eyebrow" style={{ marginBottom: 4 }}>
              Days to meet
            </div>
            <span className="tns-serif" style={{ fontSize: 72, lineHeight: 0.85 }}>
               {daysToMeet}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="tns-eyebrow" style={{ marginBottom: 4 }}>
              Projected total
            </div>
            <span className="tns-serif" style={{ fontSize: 32, color: T.accent }}>
              {Math.round((profile.e1rm.squat + profile.e1rm.bench + profile.e1rm.deadlift) * 1.02)}
            </span>
            <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, marginLeft: 4 }}>
              KG
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Phase timeline
        </div>
        <div style={{ display: 'flex', height: 36, marginBottom: 6 }}>
          {phases.map((p, i) => (
            <div
              key={i}
              style={{
                flex: p.w,
                background: p.col,
                opacity: p.terminal ? 1 : 0.85,
                borderRight: i < phases.length - 1 ? `1px solid ${T.bg}` : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a0f08',
                fontFamily: T.mono,
                fontSize: 9,
                letterSpacing: '0.08em',
                fontWeight: 600,
              }}
            >
              {p.terminal ? '▼' : p.wk}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', marginBottom: 22 }}>
          {phases.map((p, i) => (
            <div
              key={i}
              style={{
                flex: p.w,
                fontFamily: T.mono,
                fontSize: 9,
                color: p.col,
                letterSpacing: '0.06em',
                textAlign: 'left',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {p.l.toUpperCase()}
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Week-by-week
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3, marginBottom: 14 }}>
          {Array.from({ length: totalWeeks }).map((_, i) => {
            const phase = i < devWeeks ? 0 : i < devWeeks + pivotWeeks ? 1 : i < devWeeks + pivotWeeks + realWeeks ? 2 : 3;
            return (
              <div
                key={i}
                style={{
                  aspectRatio: '1',
                  border: `1px solid ${T.line}`,
                  background: phase === 0 ? T.surface : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <div className="tns-mono" style={{ fontSize: 9, color: T.textMute }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div
                  className="tns-mono"
                  style={{ fontSize: 8, color: phaseColors[phase], letterSpacing: '0.04em', marginTop: 2 }}
                >
                  {phaseLabels[phase]}
                </div>
                {i === 0 && (
                  <div
                    className="tns-mono"
                    style={{ position: 'absolute', top: -10, right: -2, fontSize: 8, color: T.accent }}
                  >
                    NOW
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Phase descriptions */}
        <div
          style={{
            padding: '12px 14px',
            background: T.surface,
            fontSize: 11.5,
            color: T.textDim,
            lineHeight: 1.55,
            borderLeft: `2px solid ${T.accent}`,
          }}
        >
          <span style={{ color: T.text }}>Now · Development.</span> Push your squat e1RM ≥ {profile.e1rm.squat} kg over {devWeeks} weeks (TTP
          est. 6 wk). Pivot begins automatically after peak detection.
        </div>

        {/* Link to Attempts */}
        <div style={{ marginTop: 18, padding: '14px 16px', border: `1px solid ${T.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/meet/attempts')}>
          <div>
            <div className="tns-eyebrow" style={{ marginBottom: 4 }}>Meet day</div>
            <div style={{ fontSize: 13, color: T.textDim }}>View recommended openers, seconds, thirds</div>
          </div>
          <span style={{ color: T.accent, fontSize: 18 }}>›</span>
        </div>
      </div>
      <TabBar
        active="meet"
        onNavigate={(id) => {
          if (id === 'today') navigate('/');
          else if (id === 'block') navigate('/block/performance');
          else if (id === 'lifts') navigate('/lifts');
          else if (id === 'meet') navigate('/meet/setup');
          else navigate('/');
        }}
      />
    </Phone>
  );
}
