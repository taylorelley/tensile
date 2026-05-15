import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { T, Phone, AppHeader } from '../../shared';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
}

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: T.textMute,
  IN_PROGRESS: T.accent,
  COMPLETE: T.good,
  SKIPPED: T.bad,
};

export default function UpcomingSessions() {
  const navigate = useNavigate();
  const block = useStore(s => s.currentBlock);

  const today = new Date().toISOString().split('T')[0];

  if (!block) {
    return (
      <Phone>
        <AppHeader back onBack={() => navigate(-1)} title="Schedule" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1, marginBottom: 12 }}>No block</div>
            <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55 }}>Generate a block from Today first.</div>
          </div>
        </div>
      </Phone>
    );
  }

  const sessions = [...block.sessions].sort(
    (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  const blockStart = new Date(block.startDate).getTime();

  function weekNum(scheduledDate: string): number {
    const daysSince = Math.floor((new Date(scheduledDate).getTime() - blockStart) / (1000 * 60 * 60 * 24));
    return Math.floor(daysSince / 7) + 1;
  }

  function rpeRange(session: typeof sessions[number]): string {
    const rpes = session.exercises.map(e => e.rpeTarget);
    if (rpes.length === 0) return '';
    const min = Math.min(...rpes);
    const max = Math.max(...rpes);
    return min === max ? `RPE ${min}` : `RPE ${min}–${max}`;
  }

  return (
    <Phone>
      <AppHeader
        back
        onBack={() => navigate(-1)}
        eyebrow={`${block.phase} · ${sessions.length} SESSION${sessions.length !== 1 ? 'S' : ''}`}
        title="Schedule"
      />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {sessions.map((s) => {
          const isToday = s.scheduledDate === today;
          const isPast = s.status === 'COMPLETE' || s.status === 'SKIPPED';
          const focus = s.exercises[0]?.name ?? '—';
          const wk = weekNum(s.scheduledDate);
          const dotColor = STATUS_COLOR[s.status] ?? T.textMute;

          return (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'stretch',
                borderBottom: `1px solid ${T.lineSoft}`,
                opacity: isPast ? 0.45 : 1,
                background: isToday ? 'rgba(255,110,58,0.05)' : 'transparent',
                borderLeft: isToday ? `2px solid ${T.accent}` : '2px solid transparent',
              }}
            >
              {/* Status dot column */}
              <div style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: 99, background: dotColor }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, padding: '14px 16px 14px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <span className="tns-mono" style={{ fontSize: 9, color: T.textMute, letterSpacing: '0.08em' }}>
                    {formatDate(s.scheduledDate)}
                  </span>
                  <span className="tns-mono" style={{ fontSize: 9, color: T.textMute, letterSpacing: '0.06em' }}>
                    WK {wk}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 20, lineHeight: 1, letterSpacing: '-0.01em' }}>
                    {focus}
                  </div>
                  <div className="tns-mono" style={{ fontSize: 9, color: T.textDim, letterSpacing: '0.04em', textAlign: 'right' }}>
                    {s.exercises.length} EX · {rpeRange(s)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Phone>
  );
}
