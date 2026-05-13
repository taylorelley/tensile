import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, AppHeader, PrimaryBtn, TabBar, T } from '../../shared';

const federations: [string, boolean][] = [
  ['IPF', true],
  ['USAPL', false],
  ['WRPF', false],
];

const equipmentOptions: [string, boolean][] = [
  ['Raw', true],
  ['Wraps', false],
  ['Equipped', false],
];

const weightClasses = ['74', '83', '93', '105'];

export default function MeetSetup() {
  const navigate = useNavigate();

  return (
    <Phone>
      <AppHeader eyebrow="Competition · Setup" title="Meet day" back />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Meet date
        </div>
        <div
          style={{
            border: `1px solid ${T.line}`,
            padding: '18px 18px',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div className="tns-serif" style={{ fontSize: 46, lineHeight: 0.9 }}>
              14 · 09 · 26
            </div>
            <div
              className="tns-mono"
              style={{ fontSize: 11, color: T.textMute, marginTop: 6, letterSpacing: '0.06em' }}
            >
              SAT · 18 WEEKS OUT
            </div>
          </div>
          <span style={{ color: T.accent, fontSize: 22 }}>✎</span>
        </div>

        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Federation
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 18 }}>
          {federations.map(([l, s]) => (
            <div
              key={l}
              style={{
                border: `1px solid ${s ? T.accent : T.line}`,
                background: s ? 'rgba(255,110,58,0.06)' : 'transparent',
                padding: '12px 0',
                textAlign: 'center',
                fontFamily: T.mono,
                fontSize: 12,
              }}
            >
              {l}
            </div>
          ))}
        </div>

        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Weight class
        </div>
        <div style={{ border: `1px solid ${T.line}`, padding: '14px 16px', marginBottom: 8 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <span className="tns-mono" style={{ fontSize: 18 }}>
              83 kg
            </span>
            <span className="tns-mono" style={{ fontSize: 11, color: T.textMute, letterSpacing: '0.06em' }}>
              CURRENT 84.5
            </span>
          </div>
          <div style={{ height: 4, background: T.surface, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, width: '60%', background: T.accent }} />
            <div style={{ position: 'absolute', left: '62%', top: -4, width: 2, height: 12, background: T.caution }} />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              fontFamily: T.mono,
              fontSize: 9,
              color: T.textMute,
            }}
          >
            {weightClasses.map((wc) => (
              <span key={wc}>{wc}</span>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: T.textDim, lineHeight: 1.5, marginBottom: 22 }}>
          Cut <span className="tns-mono">1.5 kg</span> by meet day — within passive water-cut range.
        </div>

        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Equipment
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {equipmentOptions.map(([l, s]) => (
            <div
              key={l}
              style={{
                flex: 1,
                border: `1px solid ${s ? T.accent : T.line}`,
                background: s ? 'rgba(255,110,58,0.06)' : 'transparent',
                padding: '11px 0',
                textAlign: 'center',
                fontSize: 12,
              }}
            >
              {l}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 22px 0', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn>Generate peaking plan →</PrimaryBtn>
      </div>
      <TabBar
        active="meet"
        onNavigate={(id) => {
          if (id === 'today') navigate('/');
          else if (id === 'block') navigate('/block/performance');
          else if (id === 'meet') navigate('/meet/setup');
          else navigate('/');
        }}
      />
    </Phone>
  );
}
