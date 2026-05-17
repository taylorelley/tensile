import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { T, Phone, AppHeader, PrimaryBtn, Pressable } from '../shared';

export default function Settings() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const currentBlock = useStore((s) => s.currentBlock);
  const requestProgrammingModeSwitch = useStore((s) => s.requestProgrammingModeSwitch);
  const setTelemetryConsent = useStore((s) => s.setTelemetryConsent);
  const exportAggregate = useStore((s) => s.exportAggregate);

  const activeBlock = currentBlock && currentBlock.status === 'ACTIVE';
  const pendingMode = profile.pendingProgrammingMode;
  const effectiveMode = profile.programmingMode;

  const switchMode = (next: 'PHASE' | 'TTP') => {
    if (next === effectiveMode && !pendingMode) return;
    requestProgrammingModeSwitch(next);
  };

  const downloadAggregate = () => {
    const blob = exportAggregate();
    if (!blob) {
      window.alert('Enable aggregate telemetry below to export.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([blob], { type: 'application/json' }));
    a.download = `tensile-aggregate-${Date.now()}.json`;
    a.click();
  };

  return (
    <Phone>
      <AppHeader eyebrow="Settings" title="Settings" back onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div className="tns-eyebrow" style={{ marginTop: 14, marginBottom: 10 }}>Programming mode</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {([
            { id: 'PHASE', label: 'Traditional phases', sub: 'Accumulation → Intensification → Realisation.' },
            { id: 'TTP', label: 'Bottom-up TTP', sub: 'Constant microcycle; load progresses with e1RM.' },
          ] as const).map((opt) => {
            const isCurrent = effectiveMode === opt.id;
            const isPending = pendingMode === opt.id;
            return (
              <Pressable
                key={opt.id}
                onClick={() => switchMode(opt.id)}
                style={{
                  border: `1px solid ${isCurrent ? T.accent : isPending ? T.caution : T.line}`,
                  background: isCurrent ? 'rgba(255,110,58,0.06)' : 'transparent',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  minHeight: 80,
                }}
                activeStyle={{ opacity: 0.7 }}
              >
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.45 }}>{opt.sub}</div>
                {isPending && !isCurrent && (
                  <div style={{ marginTop: 6, fontSize: 10, color: T.caution }}>Switches at next block boundary</div>
                )}
              </Pressable>
            );
          })}
        </div>
        {activeBlock && pendingMode && (
          <div style={{ marginTop: 10, fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>
            Mode switch is queued — it will apply when the current block completes. Mid-block changes are blocked to keep the
            generator and TTP detector consistent across a block.
          </div>
        )}

        <div className="tns-eyebrow" style={{ marginTop: 28, marginBottom: 10 }}>Aggregate telemetry</div>
        <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.5, marginBottom: 10 }}>
          Opt in to a sanitised aggregate export. No PII, no date of birth, bodyweight rounded. Used to refine population priors
          once a cohort is available — never uploaded automatically.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {([
            { id: 'NONE', label: 'Off', sub: 'No telemetry export.' },
            { id: 'AGGREGATE', label: 'Aggregate', sub: 'Allow sanitised JSON export.' },
          ] as const).map((opt) => (
            <Pressable
              key={opt.id}
              onClick={() => setTelemetryConsent(opt.id)}
              style={{
                border: `1px solid ${profile.telemetryConsent === opt.id ? T.accent : T.line}`,
                background: profile.telemetryConsent === opt.id ? 'rgba(255,110,58,0.06)' : 'transparent',
                padding: '12px 14px',
                cursor: 'pointer',
                minHeight: 80,
              }}
              activeStyle={{ opacity: 0.7 }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.45 }}>{opt.sub}</div>
            </Pressable>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <PrimaryBtn onClick={downloadAggregate}>Export aggregate JSON →</PrimaryBtn>
        </div>
      </div>
    </Phone>
  );
}
