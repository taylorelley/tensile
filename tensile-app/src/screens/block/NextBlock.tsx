import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Phone, TabBar, T, PrimaryBtn } from '../../shared';
import { getBackOffDrop } from '../../engine';

export default function NextBlock() {
  const navigate = useNavigate();
  const currentBlock = useStore((s) => s.currentBlock);
  const profile = useStore((s) => s.profile);
  const generateNextDevelopmentBlock = useStore((s) => s.generateNextDevelopmentBlock);

  const blockId = currentBlock?.id ?? '—';
  const blockStatus = currentBlock?.status ?? '—';
  const endDate = currentBlock?.endDate;
  const phase = currentBlock?.phase ?? '—';

  const blockLabel = currentBlock
    ? `Block ${blockId.slice(-2)} · ${blockStatus === 'COMPLETE' ? 'closed' : blockStatus === 'ACTIVE' ? 'active' : blockStatus}`
    : 'No block';

  const handleStartBlock = () => {
    generateNextDevelopmentBlock();
    navigate('/');
  };

  return (
    <Phone>
      <div
        style={{
          padding: '8px 22px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          className="tns-mono"
          style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', cursor: 'pointer' }}
          onClick={() => navigate('/block/audit')}
        >
          ‹ 5 / 6
        </div>
        <div className="tns-eyebrow">{blockLabel}</div>
        <div
          className="tns-mono"
          style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em' }}
        >
          6 / 6
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div
          style={{
            fontFamily: T.serif,
            fontStyle: 'italic',
            fontSize: 34,
            lineHeight: 1,
            marginBottom: 4,
          }}
        >
          Next block
        </div>
        <div className="tns-eyebrow" style={{ marginBottom: 18 }}>
          {endDate
            ? `Ended ${endDate} · ${phase}`
            : `Active · ${phase} · ${blockId.slice(-4)}`}
        </div>

        {/* Headline params */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 1,
            background: T.line,
            border: `1px solid ${T.line}`,
            marginBottom: 18,
          }}
        >
          {[
            ['Block ID', blockId.slice(-6)],
            ['Status', blockStatus],
            ['Phase', phase],
          ].map(([l, v], i) => (
            <div key={i} style={{ background: T.bg, padding: '12px 14px' }}>
              <div
                className="tns-eyebrow"
                style={{ fontSize: 8, marginBottom: 4 }}
              >
                {l}
              </div>
              <div className="tns-mono" style={{ fontSize: 14 }}>
                {v}
              </div>
            </div>
          ))}
        </div>

        {/* Changes from current */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Changes from current block
        </div>
        <div style={{ border: `1px solid ${T.line}`, marginBottom: 18 }}>
          {(() => {
            const changes: { sym: string; l: string; sub: string; c: string }[] =
              phase === 'ACCUMULATION'
                ? [
                    { sym: '↑', l: 'Primary RPE band → 8.5–9.0', sub: 'Shift to intensification — fewer reps, heavier loads', c: T.accent },
                    { sym: '↓', l: `Drop target → ${Math.round(getBackOffDrop('INTENSIFICATION') * 100)}% (from ${Math.round(getBackOffDrop('ACCUMULATION') * 100)}%)`, sub: 'Lower volume, higher quality back-offs', c: T.accent },
                    { sym: '↓', l: 'Weekly set count decreases', sub: 'Approach MRV before tapering', c: T.caution },
                  ]
                : phase === 'INTENSIFICATION'
                ? [
                    { sym: '↑', l: 'Primary RPE band → 9.0–9.5', sub: 'Realisation phase — near-maximal efforts', c: T.accent },
                    { sym: '↓', l: `Drop target → ${Math.round(getBackOffDrop('REALISATION') * 100)}% (from ${Math.round(getBackOffDrop('INTENSIFICATION') * 100)}%)`, sub: 'Minimal back-off volume', c: T.accent },
                    { sym: '↓', l: 'Volume drops substantially', sub: 'Quality over quantity before peak', c: T.caution },
                  ]
                : [
                    { sym: '↑', l: 'New development block starts', sub: 'Volume resets to MEV; RPE band 7.5–8.5', c: T.accent },
                    { sym: '↔', l: `Drop target → ${Math.round(getBackOffDrop('ACCUMULATION') * 100)}%`, sub: 'Accumulation phase back-off protocol', c: T.good },
                    { sym: '+', l: 'Weak-point accessories carried forward', sub: 'Based on correlation from prior block', c: T.good },
                  ];
            return changes.map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderBottom: i < changes.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
                  gap: 12,
                }}
              >
                <span className="tns-mono" style={{ fontSize: 18, color: c.c, width: 18 }}>{c.sym}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5 }}>{c.l}</div>
                  <div style={{ fontSize: 10.5, color: T.textDim, marginTop: 2 }}>{c.sub}</div>
                </div>
              </div>
            ));
          })()}
        </div>

        {/* Targets */}
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Targets · end of block
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { l: 'Squat', from: Math.round(profile.e1rm.squat || 0), to: Math.round(((profile.e1rm.squat || 0) * 1.03) / 2.5) * 2.5 },
            { l: 'Bench', from: Math.round(profile.e1rm.bench || 0), to: Math.round(((profile.e1rm.bench || 0) * 1.03) / 2.5) * 2.5 },
            { l: 'DL', from: Math.round(profile.e1rm.deadlift || 0), to: Math.round(((profile.e1rm.deadlift || 0) * 1.03) / 2.5) * 2.5 },
          ].map((t, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                border: `1px solid ${T.line}`,
                padding: '10px 12px',
              }}
            >
              <div
                className="tns-eyebrow"
                style={{ fontSize: 8, marginBottom: 6 }}
              >
                {t.l}
              </div>
              <div className="tns-mono" style={{ fontSize: 10, color: T.textMute }}>
                {t.from} →
              </div>
              <span className="tns-serif" style={{ fontSize: 26, color: T.accent }}>
                {t.to}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          padding: '14px 22px 28px',
          borderTop: `1px solid ${T.line}`,
          display: 'flex',
          gap: 8,
        }}
      >
        <PrimaryBtn dim full={false} onClick={() => navigate('/plan/edit')}>
          Customise
        </PrimaryBtn>
        <PrimaryBtn onClick={handleStartBlock}>Start block →</PrimaryBtn>
      </div>
      <TabBar
        active="block"
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
