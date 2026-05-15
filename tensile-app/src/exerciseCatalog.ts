import type { SessionExercise } from './store';

export interface CatalogEntry {
  id: string;
  name: string;
  tag: SessionExercise['tag'];
  defaultSets: number;
  defaultReps: number;
  defaultRpe: number;
  builtin: boolean;
}

export const TAG_GROUPS: SessionExercise['tag'][] = ['PRIMARY', 'ASSIST', 'SUPP', 'CORE'];

export const BUILTIN_EXERCISES: CatalogEntry[] = [
  { id: 'barbell_back_squat',    name: 'Back squat',       tag: 'PRIMARY', defaultSets: 4, defaultReps: 3,  defaultRpe: 8.5, builtin: true },
  { id: 'bench_press',           name: 'Bench press',      tag: 'PRIMARY', defaultSets: 4, defaultReps: 4,  defaultRpe: 8.0, builtin: true },
  { id: 'conventional_deadlift', name: 'Conventional DL',  tag: 'PRIMARY', defaultSets: 3, defaultReps: 2,  defaultRpe: 8.5, builtin: true },
  { id: 'close_grip_bench',      name: 'Close-grip bench', tag: 'PRIMARY', defaultSets: 4, defaultReps: 5,  defaultRpe: 7.5, builtin: true },
  { id: 'front_squat',           name: 'Front squat',      tag: 'ASSIST',  defaultSets: 3, defaultReps: 5,  defaultRpe: 8.0, builtin: true },
  { id: 'overhead_press',        name: 'Overhead press',   tag: 'ASSIST',  defaultSets: 3, defaultReps: 6,  defaultRpe: 8.0, builtin: true },
  { id: 'paused_squat',          name: 'Paused squat',     tag: 'ASSIST',  defaultSets: 3, defaultReps: 4,  defaultRpe: 8.0, builtin: true },
  { id: 'incline_press',         name: 'Incline press',    tag: 'ASSIST',  defaultSets: 3, defaultReps: 6,  defaultRpe: 8.0, builtin: true },
  { id: 'romanian_deadlift',     name: 'Romanian DL',      tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 7.5, builtin: true },
  { id: 'leg_curl',              name: 'Leg curl',         tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0, builtin: true },
  { id: 'leg_press',             name: 'Leg press',        tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true },
  { id: 'leg_extension',         name: 'Leg extension',    tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0, builtin: true },
  { id: 'cable_row',             name: 'Cable row',        tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true },
  { id: 'barbell_row',           name: 'Barbell row',      tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0, builtin: true },
  { id: 'lat_pulldown',          name: 'Lat pulldown',     tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true },
  { id: 'dumbbell_curl',         name: 'Dumbbell curl',    tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.5, builtin: true },
  { id: 'lateral_raise',         name: 'Lateral raise',    tag: 'SUPP',    defaultSets: 3, defaultReps: 15, defaultRpe: 8.5, builtin: true },
  { id: 'plank',                 name: 'Plank',            tag: 'CORE',    defaultSets: 3, defaultReps: 1,  defaultRpe: 7.0, builtin: true },
];

export const TAG_COLORS: Record<SessionExercise['tag'], string> = {
  PRIMARY: '#ff6e3a',
  ASSIST:  '#e8c14e',
  SUPP:    '#a8a298',
  CORE:    '#7fb37a',
};
