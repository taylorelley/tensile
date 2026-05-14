import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Phone, AppHeader, PrimaryBtn, T } from '../../shared';

const blockParams: [string, string][] = [
  ['Duration', '2 weeks'],
  ['Rep range', '6–12'],
  ['RPE cap', '8.0'],
  ['Volume', '~55% of block 04'],
];

const substitutions: [string, string][] = [
  ['Back squat', 'Tempo SSB squat'],
  ['Bench press', 'Spoto bench · 3 ct'],
  ['Deadlift', 'Snatch-grip RDL'],
  ['Paused squat', 'Bulgarian split sq.'],
];

const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const schedule = [
  ['SSB', '', 'SPT', '', 'SGR', '', 'REST'],
  ['SSB', '', 'SPT', '', 'SGR', 'BSS', ''],
];

export default function Pivot() {
  const navigate = useNavigate();
  const generatePivotBlock = useStore((s) => s.generatePivotBlock);
  return (
    <Phone>
      <AppHeader eyebrow="Pivot block · 2 wk · May 14 – 27" title="Re-sensitise" back onBack={() => navigate('/deload/structure')} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div
          style={{
            padding: '12px 14px',
            background: T.surface,
            fontSize: 11.5,
            color: T.textDim,
            lineHeight: 1.55,
            borderLeft: `2px solid ${T.caution}`,
            marginBottom: 16,
          }}
        >
          <span className="tns-mono" style={{ fontSize: 9, color: T.caution, letterSpacing: '0.08em' }}>
            HEURISTIC
          </span>
          <div style={{ marginTop: 4 }}>
            Pivot blocks are inspired by Bondarchuk's variation framework but lack direct RCT validation. Presented as a
            sensible re-sensitisation tool.
          </div>
        </div>

        {/* Block params */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            background: T.line,
            border: `1px solid ${T.line}`,
            marginBottom: 18,
          }}
        >
          {blockParams.map(([l, v], i) => (
            <div key={i} style={{ background: T.bg, padding: '12px 14px' }}>
              <div className="tns-eyebrow" style={{ fontSize: 8, marginBottom: 4 }}>
                {l}
              </div>
              <div className="tns-mono" style={{ fontSize: 13 }}>
                {v}
              </div>
            </div>
          ))}
        </div>

        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Movement substitutions
        </div>
        <div style={{ border: `1px solid ${T.line}`, marginBottom: 18 }}>
          {substitutions.map(([f, t], i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 16px 1fr',
                alignItems: 'center',
                padding: '12px 14px',
                borderBottom: i < substitutions.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 12.5, color: T.textDim }}>{f}</span>
              <span className="tns-mono" style={{ fontSize: 14, color: T.accent }}>
                →
              </span>
              <span style={{ fontSize: 12.5 }}>{t}</span>
            </div>
          ))}
        </div>

        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          2-week schedule
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 3,
            marginBottom: 6,
          }}
        >
          {days.map((d, i) => (
            <div
              key={i}
              className="tns-mono"
              style={{ fontSize: 9, color: T.textMute, textAlign: 'center', letterSpacing: '0.08em' }}
            >
              {d}
            </div>
          ))}
          {schedule.flat().map((d, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${d ? T.line : 'transparent'}`,
                background: d ? T.surface : 'transparent',
                fontFamily: T.mono,
                fontSize: 9,
                color: d === 'REST' ? T.textMute : T.text,
                letterSpacing: '0.04em',
              }}
            >
              {d}
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: T.mono,
            fontSize: 9,
            color: T.textMute,
            letterSpacing: '0.06em',
            marginTop: 6,
          }}
        >
          <span>WK 1</span>
          <span>WK 2</span>
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn onClick={() => {
          generatePivotBlock();
          navigate('/');
        }}>Begin pivot block →</PrimaryBtn>
      </div>
    </Phone>
  );
}
