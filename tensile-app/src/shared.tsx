/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Design tokens and shared components for Tensile
export const T = {
  bg: '#0d0c0a',
  surface: '#15130f',
  surface2: '#1d1a14',
  surface3: '#26221a',
  line: '#2a2620',
  lineSoft: '#1f1c16',
  text: '#f5f0e6',
  textDim: '#a8a298',
  textMute: '#6f6a60',
  accent: '#ff6e3a',
  accentDim: '#a64a26',
  caution: '#e8c14e',
  good: '#7fb37a',
  bad: '#d56a55',
  serif: '"Instrument Serif", "Times New Roman", serif',
  sans: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
} as const;

export function Phone({ children, bg = T.bg }: { children: React.ReactNode; bg?: string }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: bg, position: 'relative',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

export function Pressable({ style, activeStyle, children, ...props }: {
  style?: React.CSSProperties;
  activeStyle?: React.CSSProperties;
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          (props.onClick as (() => void) | undefined)?.();
        }
      }}
      style={{ outline: focused ? `2px solid ${T.accent}` : 'none', outlineOffset: 2, ...style, ...(pressed ? activeStyle : {}) }}
      {...props}
    >{children}</div>
  );
}

export function TabBar({ active = 'today', onNavigate }: { active?: string; onNavigate?: (id: string) => void }) {
  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'block', label: 'Block' },
    { id: 'lifts', label: 'Lifts' },
    { id: 'meet', label: 'Meet' },
  ];
  return (
    <div role="tablist" style={{
      borderTop: `1px solid ${T.line}`, background: T.bg,
      padding: '0 0 18px', display: 'flex', justifyContent: 'space-around',
    }}>
      {tabs.map(t => (
        <Pressable
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          aria-label={t.label}
          onClick={() => onNavigate?.(t.id)}
          style={{
            fontFamily: T.mono, fontSize: 11, letterSpacing: '0.14em',
            textTransform: 'uppercase', fontWeight: 500,
            color: active === t.id ? T.accent : T.textMute,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            cursor: 'pointer', padding: '12px 16px', minWidth: 64, minHeight: 44,
          }}
          activeStyle={{ opacity: 0.7 }}
        >
          <div style={{
            width: 20, height: 2, borderRadius: 99,
            background: active === t.id ? T.accent : 'transparent',
          }} />
          {t.label}
        </Pressable>
      ))}
    </div>
  );
}

export function AppHeader({ eyebrow, title, right, back = false, onBack, close = false, onClose }: { eyebrow?: string; title: string; right?: React.ReactNode; back?: boolean; onBack?: () => void; close?: boolean; onClose?: () => void }) {
  return (
    <div style={{ padding: '8px 22px 18px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div>
        {back && (
          <Pressable
            aria-label="Go back"
            onClick={onBack}
            style={{ fontSize: 18, color: T.textDim, marginBottom: 4, cursor: 'pointer', padding: '10px 14px 10px 0', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center' }}
            activeStyle={{ opacity: 0.6 }}
          >←</Pressable>
        )}
        {eyebrow && <div className="tns-eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 30, lineHeight: 1, letterSpacing: '-0.02em' }}>{title}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {right && <div>{right}</div>}
        {close && (
          <Pressable
            aria-label="Close"
            onClick={onClose}
            style={{ padding: 10, margin: -10, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            activeStyle={{ opacity: 0.6 }}
          >
            <span style={{ fontSize: 20, color: T.textDim }}>×</span>
          </Pressable>
        )}
      </div>
    </div>
  );
}

export function PrimaryBtn({ children, dim = false, full = true, onClick, disabled }: { children: React.ReactNode; dim?: boolean; full?: boolean; onClick?: () => void; disabled?: boolean }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      disabled={disabled}
      aria-disabled={disabled}
      style={{
        background: disabled ? T.surface2 : dim ? T.surface2 : pressed ? 'rgba(255,110,58,0.85)' : T.accent,
        color: dim ? T.text : '#1a0f08',
        border: dim ? `1px solid ${T.lineSoft}` : 'none',
        padding: '15px 22px', borderRadius: 0,
        fontSize: 13, fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', width: full ? '100%' : 'auto',
        fontFamily: T.sans, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        minHeight: 48, opacity: disabled ? 0.5 : pressed && dim ? 0.7 : 1,
        transition: 'opacity 80ms, background 80ms',
      }}
    >{children}</button>
  );
}

export function Stat({ value, unit, label, delta, align = 'left', size = 56 }: { value: string; unit?: string; label?: string; delta?: string; align?: 'left' | 'right'; size?: number }) {
  return (
    <div style={{ textAlign: align }}>
      {label && <div className="tns-eyebrow" style={{ marginBottom: 6 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        <span className="tns-serif" style={{ fontSize: size, lineHeight: 0.9 }}>{value}</span>
        {unit && <span className="tns-mono" style={{ fontSize: 11, color: T.textDim, letterSpacing: '0.06em' }}>{unit}</span>}
      </div>
      {delta && <div className="tns-mono" style={{ fontSize: 10, color: delta.startsWith('+') ? T.good : delta.startsWith('-') ? T.bad : T.textDim, marginTop: 6, letterSpacing: '0.06em' }}>{delta}</div>}
    </div>
  );
}

export function Logo({ size = 18, color }: { size?: number; color?: string }) {
  const c = color || T.text;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <title>Tensile</title>
        <path d="M3 4h18M12 4v17M6 4l2 4M18 4l-2 4" stroke={c} strokeWidth="1.5"/>
      </svg>
      <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: size + 2, letterSpacing: '-0.01em' }}>Tensile</span>
    </div>
  );
}

export function MetricRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div style={{ display: 'flex', borderTop: `1px solid ${T.line}` }}>
      {items.map((it, i) => (
        <div key={i} style={{
          flex: 1, padding: '12px 14px',
          borderRight: i < items.length - 1 ? `1px solid ${T.line}` : 'none',
        }}>
          <div className="tns-eyebrow" style={{ fontSize: 8.5, marginBottom: 4 }}>{it.label}</div>
          <div className="tns-mono" style={{ fontSize: 14, fontWeight: 500 }}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}

export function Spark({ data, color = T.accent, w = 80, h = 24, area = true }: { data: number[]; color?: string; w?: number; h?: number; area?: boolean }) {
  if (!data || data.length === 0) {
    return (
      <svg width={w} height={h} style={{ display: 'block' }}>
        <title>Sparkline chart</title>
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={T.line} strokeWidth="1" strokeDasharray="3 3" />
      </svg>
    );
  }
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    data.length > 1 ? (i / (data.length - 1)) * w : w / 2,
    h - ((v - min) / range) * (h - 2) - 1,
  ]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const areaPath = path + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <title>Sparkline chart</title>
      {area && <path d={areaPath} fill={color} opacity="0.12" />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.25" />
    </svg>
  );
}

export function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.08em', marginRight: 4 }}>
        {String(step).padStart(2,'0')} / {String(total).padStart(2,'0')}
      </span>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width: 14, height: 2,
            background: i < step ? T.accent : T.line,
          }} />
        ))}
      </div>
    </div>
  );
}

// Chart primitives
export function Chart({ data, w = 320, h = 100, color = T.accent, ticks = 4, peak }: { data: number[]; w?: number; h?: number; color?: string; ticks?: number; peak?: number }) {
  if (!data || data.length === 0) return <svg width={w} height={h + 18} style={{ display: 'block', overflow: 'visible' }} />;
  const min = Math.min(...data), max = Math.max(...data);
  const pad = (max - min) * 0.15;
  const lo = min - pad, hi = max + pad, range = hi - lo;
  const pts = data.map((v, i) => [
    data.length > 1 ? (i / (data.length - 1)) * w : w / 2,
    h - ((v - lo) / range) * h,
  ]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const areaPath = path + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h + 18} style={{ display: 'block', overflow: 'visible' }}>
      <title>Line chart</title>
      {Array.from({ length: ticks }).map((_, i) => (
        <line key={i} x1="0" x2={w} y1={i * (h / (ticks - 1))} y2={i * (h / (ticks - 1))} stroke={T.lineSoft} strokeWidth="1" />
      ))}
      <path d={areaPath} fill={color} opacity="0.1" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2" fill={color} />
      ))}
      {peak !== undefined && pts[peak] && (
        <>
          <line x1={pts[peak][0]} x2={pts[peak][0]} y1="0" y2={h} stroke={T.accent} strokeWidth="1" strokeDasharray="2 3" />
          <text x={pts[peak][0]} y={-3} fill={T.accent} fontSize="9" fontFamily={T.mono} textAnchor="middle" letterSpacing="0.06em">PEAK</text>
        </>
      )}
    </svg>
  );
}

export function ChartEmpty({ message = 'NO DATA YET', h = 100 }: { message?: string; h?: number }) {
  return (
    <div style={{
      height: h, border: `1px dashed ${T.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.mono, fontSize: 10, color: T.textMute, letterSpacing: '0.08em',
    }}>{message}</div>
  );
}

export function ChartBars({ data, w = 320, h = 100, mev, mav, mrv }: { data: number[]; w?: number; h?: number; mev?: number; mav?: number; mrv?: number }) {
  const max = Math.max(...data, mrv || 0);
  const barW = w / data.length - 2;
  return (
    <svg width={w} height={h + 18} style={{ display: 'block', overflow: 'visible' }}>
      <title>Bar chart</title>
      {mev !== undefined && (
        <>
          <line x1="0" x2={w} y1={h - (mev / max) * h} y2={h - (mev / max) * h} stroke={T.textMute} strokeWidth="1" strokeDasharray="3 4" />
          <text x={w + 2} y={h - (mev / max) * h + 3} fill={T.textMute} fontSize="8" fontFamily={T.mono}>MEV</text>
        </>
      )}
      {mav !== undefined && (
        <>
          <line x1="0" x2={w} y1={h - (mav / max) * h} y2={h - (mav / max) * h} stroke={T.caution} strokeWidth="1" strokeDasharray="3 4" />
          <text x={w + 2} y={h - (mav / max) * h + 3} fill={T.caution} fontSize="8" fontFamily={T.mono}>MAV</text>
        </>
      )}
      {mrv !== undefined && (
        <>
          <line x1="0" x2={w} y1={h - (mrv / max) * h} y2={h - (mrv / max) * h} stroke={T.bad} strokeWidth="1" strokeDasharray="3 4" />
          <text x={w + 2} y={h - (mrv / max) * h + 3} fill={T.bad} fontSize="8" fontFamily={T.mono}>MRV</text>
        </>
      )}
      {data.map((v, i) => (
        <rect key={i} x={i * (w / data.length) + 1} y={h - (v / max) * h} width={barW} height={(v / max) * h} fill={v > (mrv || Infinity) ? T.bad : v > (mav || Infinity) ? T.caution : T.accent} opacity="0.85" />
      ))}
    </svg>
  );
}

export function BlockSubNav({ active }: { active: string }) {
  const tabs = [
    { id: 'performance', label: 'Performance', path: '/block/performance' },
    { id: 'volume', label: 'Volume', path: '/block/volume' },
    { id: 'readiness', label: 'Readiness', path: '/block/readiness' },
    { id: 'weakpoint', label: 'WeakPoint', path: '/block/weakpoint' },
    { id: 'audit', label: 'Audit', path: '/block/audit' },
    { id: 'next', label: 'Next', path: '/block/next' },
  ];
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', gap: 6, padding: '10px 22px', borderBottom: `1px solid ${T.lineSoft}`, overflowX: 'auto' }}>
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => navigate(t.path)}
          aria-label={t.label}
          aria-current={active === t.id ? 'page' : undefined}
          style={{
            padding: '6px 12px',
            borderRadius: 4,
            border: 'none',
            fontFamily: T.mono,
            fontSize: 10,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            background: active === t.id ? T.accent : T.surface2,
            color: active === t.id ? '#1a0f08' : T.textDim,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
