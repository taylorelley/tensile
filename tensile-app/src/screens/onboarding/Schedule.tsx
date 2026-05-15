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

const dayShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Schedule() {
  const navigate = useNavigate();
  const profile = useStore(s => s.profile);
  const setProfile = useStore(s => s.setProfile);

  const [availableDays, setAvailableDays] = useState<boolean[]>(profile.availableDays);
  const [sessionDuration, setSessionDuration] = useState(profile.sessionDuration);
  const [excludedExercises, setExcludedExercises] = useState<string[]>(profile.excludedExercises || []);
  const [addingExclusion, setAddingExclusion] = useState(false);
  const [exclusionDraft, setExclusionDraft] = useState('');

  const trainingFrequency = availableDays.filter(Boolean).length;

  const toggleDay = (i: number) => {
    setAvailableDays(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const toggleExcluded = (name: string) => {
    setExcludedExercises(prev =>
      prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]
    );
  };

  const commitExclusion = () => {
    const v = exclusionDraft.trim();
    if (!v) { setAddingExclusion(false); setExclusionDraft(''); return; }
    setExcludedExercises(prev =>
      prev.some(e => e.toLowerCase() === v.toLowerCase()) ? prev : [...prev, v]
    );
    setExclusionDraft('');
    setAddingExclusion(false);
  };

  const handleContinue = () => {
    setProfile({ availableDays, trainingFrequency, sessionDuration, excludedExercises });
    navigate('/onboarding/first-block');
  };

  const durations = [45, 60, 75, 90];

  return (
    <OBShell
      step={5}
      eyebrow="Step 05 · Schedule"
      title="When can you train?"
      footer={<PrimaryBtn onClick={handleContinue}>Continue →</PrimaryBtn>}
    >
      <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
        Days available <span className="tns-mono" style={{ color: T.accent, fontSize: 10 }}>({trainingFrequency} selected)</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
        {dayShort.map((d, i) => (
          <div key={i} onClick={() => toggleDay(i)} style={{
            flex: 1, aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${availableDays[i] ? T.accent : T.line}`,
            background: availableDays[i] ? T.accent : 'transparent',
            color: availableDays[i] ? '#1a0f08' : T.textDim,
            cursor: 'pointer',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{d}</span>
          </div>
        ))}
      </div>

      <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Session length preference</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 22 }}>
        {durations.map((l) => {
          const displayLabel = l < 90 ? String(l) : '90+';
          const selected = sessionDuration === l || (l === 90 && sessionDuration >= 90);
          return (
            <div key={l} onClick={() => setSessionDuration(l)} style={{
              border: `1px solid ${selected ? T.accent : T.line}`,
              background: selected ? 'rgba(255,110,58,0.06)' : 'transparent',
              padding: '12px 0', textAlign: 'center', fontFamily: T.mono, fontSize: 14,
              cursor: 'pointer',
            }}>{displayLabel}<span style={{ fontSize: 9, color: T.textMute }}> MIN</span></div>
          );
        })}
      </div>

      <div className="tns-eyebrow" style={{ marginBottom: 10 }}>Exclude exercises</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(() => {
          const presets = ['Conventional DL', 'Overhead press', 'Behind-neck press', 'Box squat', 'Snatch-grip DL'];
          const extras = excludedExercises.filter(e => !presets.includes(e));
          return [...presets, ...extras].map((l) => {
            const x = excludedExercises.includes(l);
            return (
              <div key={l} onClick={() => toggleExcluded(l)} style={{
                border: `1px solid ${x ? T.bad : T.line}`,
                color: x ? T.bad : T.textDim,
                padding: '6px 12px', fontSize: 11.5,
                fontFamily: T.mono, letterSpacing: '0.02em',
                textDecoration: x ? 'line-through' : 'none',
                cursor: 'pointer',
              }}>{l}</div>
            );
          });
        })()}
      </div>
      <div style={{ marginTop: 8 }}>
        {addingExclusion ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              autoFocus
              value={exclusionDraft}
              onChange={e => setExclusionDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitExclusion(); if (e.key === 'Escape') { setAddingExclusion(false); setExclusionDraft(''); } }}
              placeholder="e.g. Hack squat"
              style={{
                flex: 1, fontFamily: T.mono, fontSize: 12, background: 'transparent',
                border: `1px solid ${T.line}`, color: T.text, padding: '6px 10px', outline: 'none',
              }}
            />
            <span
              onClick={commitExclusion}
              className="tns-mono"
              style={{ fontSize: 10, color: T.accent, letterSpacing: '0.08em', cursor: 'pointer', padding: '4px 8px' }}
            >ADD</span>
            <span
              onClick={() => { setAddingExclusion(false); setExclusionDraft(''); }}
              className="tns-mono"
              style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', cursor: 'pointer', padding: '4px 8px' }}
            >CANCEL</span>
          </div>
        ) : (
          <span
            onClick={() => setAddingExclusion(true)}
            style={{ fontSize: 11, color: T.accent, fontFamily: T.mono, letterSpacing: '0.04em', cursor: 'pointer' }}
          >+ ADD EXCLUSION</span>
        )}
      </div>
    </OBShell>
  );
}
