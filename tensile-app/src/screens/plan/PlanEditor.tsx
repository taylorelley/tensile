import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import type { SessionExercise } from '../../store';
import { Phone, AppHeader, PrimaryBtn, T } from '../../shared';

interface CatalogEntry {
  id: string;
  name: string;
  tag: SessionExercise['tag'];
  defaultSets: number;
  defaultReps: number;
  defaultRpe: number;
}

const EXERCISE_CATALOG: CatalogEntry[] = [
  { id: 'barbell_back_squat',    name: 'Back squat',       tag: 'PRIMARY', defaultSets: 4, defaultReps: 3,  defaultRpe: 8.5 },
  { id: 'bench_press',           name: 'Bench press',      tag: 'PRIMARY', defaultSets: 4, defaultReps: 4,  defaultRpe: 8.0 },
  { id: 'conventional_deadlift', name: 'Conventional DL',  tag: 'PRIMARY', defaultSets: 3, defaultReps: 2,  defaultRpe: 8.5 },
  { id: 'close_grip_bench',      name: 'Close-grip bench', tag: 'PRIMARY', defaultSets: 4, defaultReps: 5,  defaultRpe: 7.5 },
  { id: 'front_squat',           name: 'Front squat',      tag: 'ASSIST',  defaultSets: 3, defaultReps: 5,  defaultRpe: 8.0 },
  { id: 'overhead_press',        name: 'Overhead press',   tag: 'ASSIST',  defaultSets: 3, defaultReps: 6,  defaultRpe: 8.0 },
  { id: 'paused_squat',          name: 'Paused squat',     tag: 'ASSIST',  defaultSets: 3, defaultReps: 4,  defaultRpe: 8.0 },
  { id: 'incline_press',         name: 'Incline press',    tag: 'ASSIST',  defaultSets: 3, defaultReps: 6,  defaultRpe: 8.0 },
  { id: 'romanian_deadlift',     name: 'Romanian DL',      tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 7.5 },
  { id: 'leg_curl',              name: 'Leg curl',         tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0 },
  { id: 'leg_press',             name: 'Leg press',        tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0 },
  { id: 'leg_extension',         name: 'Leg extension',    tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0 },
  { id: 'cable_row',             name: 'Cable row',        tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0 },
  { id: 'barbell_row',           name: 'Barbell row',      tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0 },
  { id: 'lat_pulldown',          name: 'Lat pulldown',     tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0 },
  { id: 'dumbbell_curl',         name: 'Dumbbell curl',    tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.5 },
  { id: 'lateral_raise',         name: 'Lateral raise',    tag: 'SUPP',    defaultSets: 3, defaultReps: 15, defaultRpe: 8.5 },
  { id: 'plank',                 name: 'Plank',            tag: 'CORE',    defaultSets: 3, defaultReps: 1,  defaultRpe: 7.0 },
];

const TAG_GROUPS: SessionExercise['tag'][] = ['PRIMARY', 'ASSIST', 'SUPP', 'CORE'];

const TAG_COLOR: Record<SessionExercise['tag'], string> = {
  PRIMARY: T.accent,
  ASSIST:  T.caution,
  SUPP:    T.textDim,
  CORE:    T.good,
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }).toUpperCase();
}

type LocalExercises = Record<string, SessionExercise[]>;

function ExerciseRow({
  ex, exIdx, sessionId, canRemove, onUpdate, onRemove,
}: {
  ex: SessionExercise;
  exIdx: number;
  sessionId: string;
  canRemove: boolean;
  onUpdate: (sessionId: string, exIdx: number, field: string, value: number) => void;
  onRemove: (sessionId: string, exIdx: number) => void;
}) {
  const inputStyle: React.CSSProperties = {
    fontFamily: T.mono, fontSize: 15, fontWeight: 500,
    background: 'transparent', border: 'none',
    borderBottom: '1px solid transparent', color: T.text,
    outline: 'none', textAlign: 'center',
  };

  return (
    <div style={{
      borderBottom: `1px solid ${T.lineSoft}`,
      padding: '14px 0',
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <div style={{
        fontSize: 9, fontFamily: T.mono, padding: '3px 6px',
        border: `1px solid ${TAG_COLOR[ex.tag]}`, color: TAG_COLOR[ex.tag],
        flexShrink: 0, marginTop: 2, letterSpacing: '0.04em',
      }}>
        {ex.tag}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>{ex.name}</div>
        <div style={{ display: 'flex', gap: 18 }}>
          {([
            { label: 'SETS', field: 'sets',      value: ex.sets,      width: 36, step: 1   },
            { label: 'REPS', field: 'reps',      value: ex.reps,      width: 36, step: 1   },
            { label: 'RPE',  field: 'rpeTarget', value: ex.rpeTarget, width: 44, step: 0.5 },
          ] as const).map(({ label, field, value, width, step }) => (
            <div key={field}>
              <div className="tns-eyebrow" style={{ fontSize: 8, marginBottom: 4, letterSpacing: '0.08em' }}>{label}</div>
              <input
                type="number"
                value={value}
                step={step}
                min={field === 'rpeTarget' ? 6 : 1}
                max={field === 'rpeTarget' ? 10 : 20}
                onChange={e => onUpdate(sessionId, exIdx, field, Number(e.target.value))}
                style={{ ...inputStyle, width }}
                onFocus={e => { e.currentTarget.style.borderBottomColor = T.accent; }}
                onBlur={e => { e.currentTarget.style.borderBottomColor = 'transparent'; }}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        onClick={() => canRemove && onRemove(sessionId, exIdx)}
        style={{
          fontFamily: T.mono, fontSize: 18, color: T.bad,
          cursor: canRemove ? 'pointer' : 'default',
          opacity: canRemove ? 1 : 0.2,
          pointerEvents: canRemove ? 'auto' : 'none',
          paddingTop: 1, lineHeight: 1,
        }}
      >×</div>
    </div>
  );
}

function AddPicker({
  sessionId, existingIds, onAdd, onClose,
}: {
  sessionId: string;
  existingIds: Set<string>;
  onAdd: (sessionId: string, entry: CatalogEntry) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10 }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 11,
        background: T.bg, borderTop: `1px solid ${T.line}`,
        maxHeight: '60%', overflow: 'auto',
        padding: '0 0 24px',
      }}>
        <div style={{
          position: 'sticky', top: 0, background: T.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 22px 12px', borderBottom: `1px solid ${T.lineSoft}`,
        }}>
          <span className="tns-eyebrow" style={{ fontSize: 9, letterSpacing: '0.1em' }}>ADD EXERCISE</span>
          <span
            onClick={onClose}
            style={{ fontFamily: T.mono, fontSize: 16, color: T.textDim, cursor: 'pointer', lineHeight: 1 }}
          >×</span>
        </div>

        {TAG_GROUPS.map(tag => {
          const entries = EXERCISE_CATALOG.filter(e => e.tag === tag);
          return (
            <div key={tag} style={{ padding: '12px 22px 0' }}>
              <div className="tns-eyebrow" style={{
                fontSize: 8, color: TAG_COLOR[tag], letterSpacing: '0.1em', marginBottom: 8,
              }}>{tag}</div>
              {entries.map(entry => {
                const already = existingIds.has(entry.id);
                return (
                  <div
                    key={entry.id}
                    onClick={() => { if (!already) { onAdd(sessionId, entry); onClose(); } }}
                    style={{
                      padding: '10px 0',
                      borderBottom: `1px solid ${T.lineSoft}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: already ? 'default' : 'pointer',
                      opacity: already ? 0.3 : 1,
                    }}
                  >
                    <span style={{ fontSize: 13, color: T.text }}>{entry.name}</span>
                    <span className="tns-mono" style={{ fontSize: 10, color: T.textMute, letterSpacing: '0.04em' }}>
                      {entry.defaultSets}×{entry.defaultReps} @ {entry.defaultRpe}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function PlanEditor() {
  const navigate = useNavigate();
  const currentBlock = useStore(s => s.currentBlock);
  const updateSession = useStore(s => s.updateSession);

  const scheduledSessions = (currentBlock?.sessions ?? []).filter(s => s.status === 'SCHEDULED');

  const [localExercises, setLocalExercises] = useState<LocalExercises>(() =>
    Object.fromEntries(scheduledSessions.map(s => [s.id, s.exercises.map(ex => ({ ...ex }))]))
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [addPickerOpen, setAddPickerOpen] = useState(false);

  const updateExerciseField = (sessionId: string, exIdx: number, field: string, value: number) => {
    setLocalExercises(prev => ({
      ...prev,
      [sessionId]: prev[sessionId].map((ex, i) => i === exIdx ? { ...ex, [field]: value } : ex),
    }));
  };

  const removeExercise = (sessionId: string, exIdx: number) => {
    setLocalExercises(prev => ({
      ...prev,
      [sessionId]: prev[sessionId].filter((_, i) => i !== exIdx),
    }));
  };

  const addExercise = (sessionId: string, entry: CatalogEntry) => {
    const newEx: SessionExercise = {
      id: entry.id,
      name: entry.name,
      tag: entry.tag,
      sets: entry.defaultSets,
      reps: entry.defaultReps,
      rpeTarget: entry.defaultRpe,
    };
    setLocalExercises(prev => ({
      ...prev,
      [sessionId]: [...prev[sessionId], newEx],
    }));
  };

  const handleSave = () => {
    if (!currentBlock) return;
    scheduledSessions.forEach(session => {
      const edited = localExercises[session.id];
      if (edited) updateSession(currentBlock.id, session.id, { exercises: edited });
    });
    navigate(-1);
  };

  if (!currentBlock) {
    return (
      <Phone>
        <AppHeader back onBack={() => navigate(-1)} title="Edit plan" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 32, lineHeight: 1, marginBottom: 12 }}>No block</div>
            <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55 }}>Generate a block from Today first.</div>
          </div>
        </div>
      </Phone>
    );
  }

  const activeSession = scheduledSessions[activeIdx];
  const activeExercises = activeSession ? (localExercises[activeSession.id] ?? []) : [];
  const activeExerciseIds = new Set(activeExercises.map(e => e.id));

  return (
    <Phone>
      <AppHeader
        back
        onBack={() => navigate(-1)}
        eyebrow={`${currentBlock.phase} · ${scheduledSessions.length} SESSION${scheduledSessions.length !== 1 ? 'S' : ''}`}
        title="Edit plan"
      />

      {scheduledSessions.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 26, lineHeight: 1, marginBottom: 10 }}>All done</div>
            <div style={{ fontSize: 12, color: T.textDim }}>No scheduled sessions remain to edit.</div>
          </div>
        </div>
      ) : (
        <>
          {/* Session tab strip */}
          <div style={{
            display: 'flex', gap: 6, padding: '0 22px 14px',
            overflowX: 'auto', flexShrink: 0,
          }}>
            {scheduledSessions.map((s, i) => (
              <div
                key={s.id}
                onClick={() => { setActiveIdx(i); setAddPickerOpen(false); }}
                style={{
                  padding: '8px 14px', flexShrink: 0, cursor: 'pointer',
                  border: `1px solid ${i === activeIdx ? T.accent : T.line}`,
                  background: i === activeIdx ? 'rgba(255,110,58,0.06)' : 'transparent',
                }}
              >
                <div className="tns-mono" style={{ fontSize: 9, color: T.textMute, letterSpacing: '0.08em' }}>
                  {formatDate(s.scheduledDate)}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, marginTop: 3, color: T.text }}>
                  {(localExercises[s.id]?.[0]?.name) ?? '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Exercise list */}
          <div style={{ flex: 1, overflow: 'auto', padding: '0 22px', position: 'relative' }}>
            {activeExercises.map((ex, exIdx) => (
              <ExerciseRow
                key={`${ex.id}-${exIdx}`}
                ex={ex}
                exIdx={exIdx}
                sessionId={activeSession.id}
                canRemove={activeExercises.length > 1}
                onUpdate={updateExerciseField}
                onRemove={removeExercise}
              />
            ))}

            <div
              onClick={() => setAddPickerOpen(true)}
              style={{ padding: '16px 0', cursor: 'pointer' }}
            >
              <span className="tns-mono" style={{ fontSize: 10, color: T.accent, letterSpacing: '0.08em' }}>
                + ADD EXERCISE
              </span>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{
        padding: '14px 22px 28px',
        borderTop: `1px solid ${T.line}`,
        display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <PrimaryBtn dim full={false} onClick={() => navigate(-1)}>Cancel</PrimaryBtn>
        <PrimaryBtn onClick={handleSave}>Save →</PrimaryBtn>
      </div>

      {/* Add exercise picker */}
      {addPickerOpen && activeSession && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          <AddPicker
            sessionId={activeSession.id}
            existingIds={activeExerciseIds}
            onAdd={addExercise}
            onClose={() => setAddPickerOpen(false)}
          />
        </div>
      )}
    </Phone>
  );
}
