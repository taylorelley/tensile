import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { T, Phone } from '../../shared';

interface OverrideOption {
  icon: string;
  label: string;
  sub: string;
}

const options: OverrideOption[] = [
  { icon: '−', label: 'Drop next set', sub: 'Terminate back-off early — feeling cooked' },
  { icon: '+', label: 'Add a set', sub: 'Feeling strong; extend back-off' },
  { icon: '↻', label: 'Swap exercise', sub: 'Replace squat with low-bar variation' },
  { icon: '↓', label: 'Lower RPE cap', sub: 'Cap session at RPE 8 — joint flag' },
  { icon: '◐', label: 'Reactive deload', sub: 'End block and begin 1-week deload' },
  { icon: '✕', label: 'End session', sub: 'Save partial; log what was completed' },
];

export default function Override() {
  const navigate = useNavigate();
  const block = useStore(s => s.currentBlock);
  const currentSession = useStore(s => s.currentSession);
  const updateSession = useStore(s => s.updateSession);

  const handleOverride = (reason: string) => {
    if (block && currentSession) {
      updateSession(block.id, currentSession.id, {
        overrides: [...(currentSession.overrides || []), reason],
      });
    }
    navigate(-1);
  };

  return (
    <Phone>
      {/* Dimmed underlying screen */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }}>
        <div style={{ padding: '20px 22px' }}>
          <div className="tns-eyebrow">Back squat · Set 2 of 4 · Back-off</div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 80, lineHeight: 0.9, marginTop: 30 }}>163 kg</div>
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,12,10,0.7)', backdropFilter: 'blur(4px)' }} />

      {/* Sheet */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: T.bg, borderTop: `1px solid ${T.line}`, paddingBottom: 24 }}>
        <div style={{ height: 4, width: 36, background: T.line, margin: '10px auto 18px' }} />
        <div style={{ padding: '0 22px' }}>
          <div className="tns-eyebrow" style={{ marginBottom: 4 }}>Adjust this set</div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 28, marginBottom: 18 }}>Override</div>

          {options.map((o, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < 5 ? `1px solid ${T.lineSoft}` : 'none', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleOverride(o.label)}>
              <div style={{ width: 32, height: 32, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: 14, color: T.accent }}>{o.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{o.label}</div>
                <div style={{ fontSize: 11.5, color: T.textDim, marginTop: 2 }}>{o.sub}</div>
              </div>
              <span style={{ color: T.textMute, fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </Phone>
  );
}
