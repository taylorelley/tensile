import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Logo, PrimaryBtn, T } from '../../shared';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <Phone>
      <div style={{ padding: '18px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo size={14} />
        <span className="tns-eyebrow">v 1.0 · internal</span>
      </div>
      <div style={{ padding: '0 22px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ marginTop: 48 }}>
          <div className="tns-eyebrow" style={{ marginBottom: 18, color: T.accent }}>Adaptive strength engine</div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 46, lineHeight: 1, letterSpacing: '-0.03em' }}>
            Train the<br />way an elite<br />coach would<br /><span style={{ color: T.accent }}>respond.</span>
          </div>
          <div style={{ marginTop: 26, fontSize: 13.5, color: T.textDim, lineHeight: 1.55, maxWidth: 300 }}>
            A rules-based, autoregulated programme that reads your daily readiness, fatigue, and lift data — and adapts one session at a time.
          </div>
        </div>
        <div>
          <div style={{ border: `1px solid ${T.line}`, padding: '14px 16px', marginBottom: 18 }}>
            <div className="tns-eyebrow" style={{ marginBottom: 8 }}>Eligibility</div>
            <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.55 }}>
              Tensile is built for lifters with <span style={{ color: T.text }}>6+ months</span> of consistent barbell training. RPE/RIR accuracy underpins the system.
            </div>
          </div>
          <PrimaryBtn onClick={() => navigate('/onboarding/biometrics')}>Begin onboarding →</PrimaryBtn>
          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: T.textMute, fontFamily: T.mono, letterSpacing: '0.06em' }}>
            ETA · 12 MIN  ·  6 STEPS
          </div>
        </div>
      </div>
      <div style={{ height: 28 }} />
    </Phone>
  );
}
