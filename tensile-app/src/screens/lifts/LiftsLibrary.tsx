import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import type { SessionExercise } from '../../store';
import { BUILTIN_EXERCISES, TAG_GROUPS, type CatalogEntry } from '../../exerciseCatalog';
import { Phone, AppHeader, PrimaryBtn, TabBar, T } from '../../shared';

const TAG_COLOR: Record<SessionExercise['tag'], string> = {
  PRIMARY: T.accent,
  ASSIST:  T.caution,
  SUPP:    T.textDim,
  CORE:    T.good,
};

const MUSCLE_OPTIONS = [
  'quads', 'hamstrings', 'glutes', 'spinal_erectors',
  'pecs', 'anterior_deltoid', 'triceps', 'biceps',
  'lats', 'rear_deltoid', 'core',
];

interface EditorState {
  mode: 'add' | 'edit';
  id?: string;
  name: string;
  tag: SessionExercise['tag'];
  defaultSets: number;
  defaultReps: number;
  defaultRpe: number;
  primaryMuscles: string[];
}

const blankEditor: EditorState = {
  mode: 'add',
  name: '',
  tag: 'SUPP',
  defaultSets: 3,
  defaultReps: 10,
  defaultRpe: 8,
  primaryMuscles: [],
};

function slugify(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `custom_${slug || 'exercise'}_${Date.now().toString(36)}`;
}

export default function LiftsLibrary() {
  const navigate = useNavigate();
  const customExercises = useStore(s => s.customExercises);
  const addCustomExercise = useStore(s => s.addCustomExercise);
  const updateCustomExercise = useStore(s => s.updateCustomExercise);
  const removeCustomExercise = useStore(s => s.removeCustomExercise);

  const [editor, setEditor] = useState<EditorState | null>(null);

  const allEntries: CatalogEntry[] = [...BUILTIN_EXERCISES, ...customExercises];

  const openAdd = () => setEditor({ ...blankEditor });
  const openEdit = (e: CatalogEntry) => setEditor({
    mode: 'edit',
    id: e.id,
    name: e.name,
    tag: e.tag,
    defaultSets: e.defaultSets,
    defaultReps: e.defaultReps,
    defaultRpe: e.defaultRpe,
    primaryMuscles: e.primaryMuscles,
  });
  const closeEditor = () => setEditor(null);

  const saveEditor = () => {
    if (!editor) return;
    const name = editor.name.trim();
    if (!name) return;
    if (editor.mode === 'add') {
      addCustomExercise({
        id: slugify(name),
        name,
        tag: editor.tag,
        defaultSets: Math.max(1, editor.defaultSets),
        defaultReps: Math.max(1, editor.defaultReps),
        defaultRpe: Math.max(5, Math.min(10, editor.defaultRpe)),
        primaryMuscles: editor.primaryMuscles,
      });
    } else if (editor.id) {
      updateCustomExercise(editor.id, {
        name,
        tag: editor.tag,
        defaultSets: Math.max(1, editor.defaultSets),
        defaultReps: Math.max(1, editor.defaultReps),
        defaultRpe: Math.max(5, Math.min(10, editor.defaultRpe)),
        primaryMuscles: editor.primaryMuscles,
      });
    }
    closeEditor();
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: T.mono, fontSize: 14, fontWeight: 500,
    background: 'transparent', border: `1px solid ${T.line}`,
    color: T.text, padding: '8px 10px', outline: 'none', width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <Phone>
      <AppHeader eyebrow="Library" title="Lifts" />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.5, marginBottom: 14 }}>
          All exercises available to your sessions. Built-ins are protected — past sessions reference them. Custom entries can be edited or removed.
        </div>

        {TAG_GROUPS.map(tag => {
          const entries = allEntries.filter(e => e.tag === tag);
          if (entries.length === 0) return null;
          return (
            <div key={tag} style={{ marginBottom: 18 }}>
              <div className="tns-eyebrow" style={{ fontSize: 8.5, color: TAG_COLOR[tag], letterSpacing: '0.1em', marginBottom: 8 }}>
                {tag}
              </div>
              <div style={{ border: `1px solid ${T.line}` }}>
                {entries.map((entry, i) => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px',
                      borderBottom: i < entries.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: T.text }}>{entry.name}</div>
                      <div className="tns-mono" style={{ fontSize: 9.5, color: T.textMute, marginTop: 2, letterSpacing: '0.04em' }}>
                        {entry.defaultSets} × {entry.defaultReps} @ RPE {entry.defaultRpe}
                        {entry.builtin && ' · BUILT-IN'}
                      </div>
                    </div>
                    {!entry.builtin && (
                      <>
                        <span
                          className="tns-mono"
                          onClick={() => openEdit(entry)}
                          style={{ fontSize: 10, color: T.accent, letterSpacing: '0.08em', cursor: 'pointer', padding: '4px 8px' }}
                        >EDIT</span>
                        <span
                          onClick={() => removeCustomExercise(entry.id)}
                          style={{ fontSize: 18, color: T.bad, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
                        >×</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '14px 22px 0', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn onClick={openAdd}>+ Add exercise</PrimaryBtn>
      </div>

      <TabBar
        active="lifts"
        onNavigate={(id) => {
          if (id === 'today') navigate('/');
          else if (id === 'block') navigate('/block/performance');
          else if (id === 'lifts') navigate('/lifts');
          else if (id === 'meet') navigate('/meet/setup');
          else navigate('/');
        }}
      />

      {editor && (
        <>
          <div
            onClick={closeEditor}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10 }}
          />
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 11,
            background: T.bg, borderTop: `1px solid ${T.line}`,
            padding: '14px 22px 28px', maxHeight: '85%', overflow: 'auto',
          }}>
            <div style={{ height: 4, width: 36, background: T.line, margin: '0 auto 14px' }} />
            <div className="tns-eyebrow" style={{ marginBottom: 4 }}>
              {editor.mode === 'add' ? 'Add exercise' : 'Edit exercise'}
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 26, marginBottom: 18 }}>
              {editor.mode === 'add' ? 'New movement' : editor.name || 'Edit'}
            </div>

            <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Name</div>
            <input
              value={editor.name}
              onChange={e => setEditor({ ...editor, name: e.target.value })}
              placeholder="e.g. Pin squat"
              style={{ ...inputStyle, marginBottom: 14 }}
              autoFocus
            />

            <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Category</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
              {TAG_GROUPS.map(tag => (
                <div
                  key={tag}
                  onClick={() => setEditor({ ...editor, tag })}
                  style={{
                    border: `1px solid ${editor.tag === tag ? T.accent : T.line}`,
                    background: editor.tag === tag ? 'rgba(255,110,58,0.06)' : 'transparent',
                    padding: '10px 0', textAlign: 'center', cursor: 'pointer',
                    fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em',
                    color: editor.tag === tag ? T.accent : T.textDim,
                  }}
                >{tag}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
              <div>
                <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Sets</div>
                <input
                  type="number" min={1} max={20}
                  value={editor.defaultSets}
                  onChange={e => setEditor({ ...editor, defaultSets: Number(e.target.value) || 1 })}
                  style={inputStyle}
                />
              </div>
              <div>
                <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Reps</div>
                <input
                  type="number" min={1} max={50}
                  value={editor.defaultReps}
                  onChange={e => setEditor({ ...editor, defaultReps: Number(e.target.value) || 1 })}
                  style={inputStyle}
                />
              </div>
              <div>
                <div className="tns-eyebrow" style={{ marginBottom: 6 }}>RPE</div>
                <input
                  type="number" min={5} max={10} step={0.5}
                  value={editor.defaultRpe}
                  onChange={e => setEditor({ ...editor, defaultRpe: Number(e.target.value) || 8 })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="tns-eyebrow" style={{ marginBottom: 6 }}>Primary muscles</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {MUSCLE_OPTIONS.map(mg => {
                const selected = editor.primaryMuscles.includes(mg);
                return (
                  <div
                    key={mg}
                    onClick={() => setEditor({
                      ...editor,
                      primaryMuscles: selected
                        ? editor.primaryMuscles.filter(m => m !== mg)
                        : [...editor.primaryMuscles, mg],
                    })}
                    style={{
                      border: `1px solid ${selected ? T.accent : T.line}`,
                      background: selected ? 'rgba(255,110,58,0.08)' : 'transparent',
                      padding: '6px 10px', cursor: 'pointer',
                      fontFamily: T.mono, fontSize: 10, letterSpacing: '0.04em',
                      color: selected ? T.accent : T.textDim, textTransform: 'uppercase',
                    }}
                  >{mg.replace(/_/g, ' ')}</div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <PrimaryBtn dim full={false} onClick={closeEditor}>Cancel</PrimaryBtn>
              <PrimaryBtn onClick={saveEditor}>{editor.mode === 'add' ? 'Add →' : 'Save →'}</PrimaryBtn>
            </div>
          </div>
        </>
      )}
    </Phone>
  );
}
