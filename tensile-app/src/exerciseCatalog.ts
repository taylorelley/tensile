import type { SessionExercise } from './store';
import type { MovementPattern } from './engine';

export type { MovementPattern };

export interface CatalogEntry {
  id: string;
  name: string;
  tag: SessionExercise['tag'];
  defaultSets: number;
  defaultReps: number;
  defaultRpe: number;
  builtin: boolean;
  /** Primary muscle groups targeted by this exercise (for volume budget / MEV-MRV tracking) */
  primaryMuscles: string[];
  /** Exercise fatigue coefficient — systemic demand multiplier (defaults to engine.ts DEFAULT_EFC lookup) */
  efc?: number;
  /** Which primary-lift failure positions this exercise addresses (for weak-point engine) */
  weakPointTargets?: { liftId: string; position: string }[];
  /** Movement pattern category — used by the programmatic scheduler for push/pull balance */
  movementPattern?: MovementPattern;
}

export const TAG_GROUPS: SessionExercise['tag'][] = ['PRIMARY', 'ASSIST', 'SUPP', 'CORE'];

export const BUILTIN_EXERCISES: CatalogEntry[] = [
  // ── Primary Lifts ────────────────────────────────────────────────────────
  { id: 'barbell_back_squat',    name: 'Back squat',          tag: 'PRIMARY', defaultSets: 4, defaultReps: 3,  defaultRpe: 8.5, builtin: true, primaryMuscles: ['quads', 'glutes', 'hamstrings', 'spinal_erectors'], efc: 1.40, movementPattern: 'squat' },
  { id: 'bench_press',           name: 'Bench press',         tag: 'PRIMARY', defaultSets: 4, defaultReps: 4,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['pecs', 'anterior_deltoid', 'triceps'], efc: 0.95, movementPattern: 'horizontal_push' },
  { id: 'conventional_deadlift', name: 'Conventional DL',     tag: 'PRIMARY', defaultSets: 3, defaultReps: 2,  defaultRpe: 8.5, builtin: true, primaryMuscles: ['hamstrings', 'glutes', 'spinal_erectors', 'lats'], efc: 1.35, movementPattern: 'hip_hinge' },
  { id: 'close_grip_bench',      name: 'Close-grip bench',    tag: 'PRIMARY', defaultSets: 4, defaultReps: 5,  defaultRpe: 7.5, builtin: true, primaryMuscles: ['triceps', 'pecs', 'anterior_deltoid'], efc: 0.95, movementPattern: 'horizontal_push' },
  { id: 'sumo_deadlift',         name: 'Sumo deadlift',       tag: 'PRIMARY', defaultSets: 3, defaultReps: 2,  defaultRpe: 8.5, builtin: true, primaryMuscles: ['hamstrings', 'glutes', 'adductors', 'spinal_erectors'], efc: 1.35, movementPattern: 'hip_hinge' },

  // ── Squat Weak-Point Variations ──────────────────────────────────────────
  { id: 'front_squat',           name: 'Front squat',         tag: 'ASSIST',  defaultSets: 3, defaultReps: 5,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['quads', 'glutes', 'core'], efc: 1.40, movementPattern: 'squat' },
  { id: 'paused_squat',          name: 'Paused squat',        tag: 'ASSIST',  defaultSets: 3, defaultReps: 4,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['quads', 'glutes', 'hamstrings'], efc: 1.40, weakPointTargets: [{ liftId: 'squat', position: 'out_of_hole' }], movementPattern: 'squat' },
  { id: 'box_squat',             name: 'Box squat',           tag: 'ASSIST',  defaultSets: 3, defaultReps: 4,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['glutes', 'hamstrings', 'quads', 'spinal_erectors'], efc: 1.35, weakPointTargets: [{ liftId: 'squat', position: 'out_of_hole' }], movementPattern: 'squat' },
  { id: 'high_bar_squat',        name: 'High-bar squat',      tag: 'ASSIST',  defaultSets: 3, defaultReps: 5,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['quads', 'glutes', 'core'], efc: 1.40, weakPointTargets: [{ liftId: 'squat', position: 'out_of_hole' }], movementPattern: 'squat' },
  { id: 'heel_elevated_squat',   name: 'Heel-elevated sq',    tag: 'ASSIST',  defaultSets: 3, defaultReps: 6,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['quads', 'core'], efc: 1.30, weakPointTargets: [{ liftId: 'squat', position: 'out_of_hole' }], movementPattern: 'squat' },
  { id: 'safety_bar_squat',      name: 'Safety bar squat',    tag: 'ASSIST',  defaultSets: 3, defaultReps: 4,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['quads', 'glutes', 'spinal_erectors'], efc: 1.40, weakPointTargets: [{ liftId: 'squat', position: 'out_of_hole' }], movementPattern: 'squat' },
  { id: 'zercher_squat',         name: 'Zercher squat',       tag: 'ASSIST',  defaultSets: 3, defaultReps: 5,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['quads', 'glutes', 'core', 'spinal_erectors'], efc: 1.40, movementPattern: 'squat' },

  // ── Bench Weak-Point Variations ──────────────────────────────────────────
  { id: 'incline_press',         name: 'Incline press',       tag: 'ASSIST',  defaultSets: 3, defaultReps: 6,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['pecs', 'anterior_deltoid', 'triceps'], efc: 0.95, movementPattern: 'horizontal_push' },
  { id: 'paused_bench',          name: 'Paused bench',        tag: 'ASSIST',  defaultSets: 3, defaultReps: 4,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['pecs', 'anterior_deltoid', 'triceps'], efc: 0.95, weakPointTargets: [{ liftId: 'bench', position: 'off_chest' }], movementPattern: 'horizontal_push' },
  { id: 'spoto_press',           name: 'Spoto press',         tag: 'ASSIST',  defaultSets: 3, defaultReps: 5,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['pecs', 'triceps', 'anterior_deltoid'], efc: 0.95, weakPointTargets: [{ liftId: 'bench', position: 'off_chest' }], movementPattern: 'horizontal_push' },
  { id: 'board_press',           name: 'Board press',         tag: 'ASSIST',  defaultSets: 3, defaultReps: 3,  defaultRpe: 8.5, builtin: true, primaryMuscles: ['triceps', 'pecs', 'anterior_deltoid'], efc: 0.90, movementPattern: 'horizontal_push' },
  { id: 'floor_press',           name: 'Floor press',         tag: 'ASSIST',  defaultSets: 3, defaultReps: 6,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['triceps', 'pecs', 'anterior_deltoid'], efc: 0.90, movementPattern: 'horizontal_push' },

  // ── Overhead & Other Compounds ───────────────────────────────────────────
  { id: 'overhead_press',        name: 'Overhead press',      tag: 'ASSIST',  defaultSets: 3, defaultReps: 6,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['anterior_deltoid', 'triceps', 'core'], efc: 1.00, movementPattern: 'vertical_push' },
  { id: 'dumbbell_bench_press',  name: 'DB bench press',      tag: 'ASSIST',  defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['pecs', 'anterior_deltoid', 'triceps'], efc: 0.95, movementPattern: 'horizontal_push' },
  { id: 'dumbbell_shoulder_press', name: 'DB shoulder press', tag: 'ASSIST',  defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['anterior_deltoid', 'triceps'], efc: 0.95, movementPattern: 'vertical_push' },
  { id: 'trap_bar_deadlift',     name: 'Trap bar DL',         tag: 'ASSIST',  defaultSets: 3, defaultReps: 4,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['quads', 'glutes', 'spinal_erectors', 'traps'], efc: 1.35, movementPattern: 'hip_hinge' },

  // ── Deadlift Weak-Point Variations ───────────────────────────────────────
  { id: 'romanian_deadlift',     name: 'Romanian DL',         tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 7.5, builtin: true, primaryMuscles: ['hamstrings', 'glutes', 'spinal_erectors'], efc: 1.25, movementPattern: 'hip_hinge' },
  { id: 'deficit_deadlift',      name: 'Deficit DL',          tag: 'ASSIST',  defaultSets: 3, defaultReps: 3,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['hamstrings', 'glutes', 'spinal_erectors', 'quads'], efc: 1.35, weakPointTargets: [{ liftId: 'deadlift', position: 'off_floor' }], movementPattern: 'hip_hinge' },
  { id: 'block_pull',            name: 'Block pull',          tag: 'ASSIST',  defaultSets: 3, defaultReps: 3,  defaultRpe: 8.5, builtin: true, primaryMuscles: ['glutes', 'hamstrings', 'spinal_erectors', 'traps'], efc: 1.30, movementPattern: 'hip_hinge' },
  { id: 'rack_pull',             name: 'Rack pull',           tag: 'ASSIST',  defaultSets: 3, defaultReps: 3,  defaultRpe: 8.5, builtin: true, primaryMuscles: ['spinal_erectors', 'glutes', 'traps', 'hamstrings'], efc: 1.30, movementPattern: 'hip_hinge' },
  { id: 'snatch_grip_deadlift',  name: 'Snatch-grip DL',      tag: 'ASSIST',  defaultSets: 3, defaultReps: 4,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['hamstrings', 'glutes', 'spinal_erectors', 'traps', 'lats'], efc: 1.30, weakPointTargets: [{ liftId: 'deadlift', position: 'off_floor' }], movementPattern: 'hip_hinge' },
  { id: 'good_morning',          name: 'Good morning',        tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 7.5, builtin: true, primaryMuscles: ['hamstrings', 'glutes', 'spinal_erectors'], efc: 1.25, weakPointTargets: [{ liftId: 'deadlift', position: 'off_floor' }], movementPattern: 'hip_hinge' },

  // ── Back Exercises ───────────────────────────────────────────────────────
  { id: 'barbell_row',           name: 'Barbell row',         tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['lats', 'biceps', 'spinal_erectors'], efc: 0.85, movementPattern: 'horizontal_pull' },
  { id: 'cable_row',             name: 'Cable row',           tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true, primaryMuscles: ['lats', 'biceps', 'rear_deltoid'], efc: 0.85, movementPattern: 'horizontal_pull' },
  { id: 'lat_pulldown',          name: 'Lat pulldown',        tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true, primaryMuscles: ['lats', 'biceps'], efc: 0.85, movementPattern: 'vertical_pull' },
  { id: 'pull_up',               name: 'Pull-up',             tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['lats', 'biceps', 'core'], efc: 0.85, movementPattern: 'vertical_pull' },
  { id: 'chin_up',               name: 'Chin-up',             tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['lats', 'biceps', 'core'], efc: 0.85, movementPattern: 'vertical_pull' },
  { id: 'chest_supported_row',   name: 'Chest-supported row', tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true, primaryMuscles: ['lats', 'biceps', 'rear_deltoid'], efc: 0.80, movementPattern: 'horizontal_pull' },
  { id: 't_bar_row',             name: 'T-bar row',           tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['lats', 'biceps', 'spinal_erectors', 'rear_deltoid'], efc: 0.85, movementPattern: 'horizontal_pull' },
  { id: 'inverted_row',          name: 'Inverted row',        tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 7.5, builtin: true, primaryMuscles: ['lats', 'biceps', 'rear_deltoid'], efc: 0.70, movementPattern: 'horizontal_pull' },
  { id: 'single_arm_row',        name: 'Single-arm row',      tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true, primaryMuscles: ['lats', 'biceps', 'spinal_erectors'], efc: 0.85, movementPattern: 'horizontal_pull' },

  // ── Chest (Machine / Cable) ──────────────────────────────────────────────
  { id: 'pec_deck',              name: 'Pec deck fly',        tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0, builtin: true, primaryMuscles: ['pecs', 'anterior_deltoid'], efc: 0.55, movementPattern: 'isolation_push' },
  { id: 'cable_fly',             name: 'Cable fly',           tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0, builtin: true, primaryMuscles: ['pecs', 'anterior_deltoid'], efc: 0.55, movementPattern: 'isolation_push' },
  { id: 'machine_press',         name: 'Machine chest press', tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true, primaryMuscles: ['pecs', 'anterior_deltoid', 'triceps'], efc: 0.75, movementPattern: 'horizontal_push' },
  { id: 'dips',                  name: 'Dips',                tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['pecs', 'triceps', 'anterior_deltoid'], efc: 0.85, movementPattern: 'horizontal_push' },

  // ── Shoulders ────────────────────────────────────────────────────────────
  { id: 'face_pull',             name: 'Face pull',           tag: 'SUPP',    defaultSets: 3, defaultReps: 15, defaultRpe: 8.0, builtin: true, primaryMuscles: ['rear_deltoid', 'traps'], efc: 0.55, movementPattern: 'isolation_pull' },
  { id: 'rear_delt_fly',         name: 'Rear delt fly',       tag: 'SUPP',    defaultSets: 3, defaultReps: 15, defaultRpe: 8.0, builtin: true, primaryMuscles: ['rear_deltoid'], efc: 0.55, movementPattern: 'isolation_pull' },
  { id: 'lateral_raise',         name: 'Lateral raise',       tag: 'SUPP',    defaultSets: 3, defaultReps: 15, defaultRpe: 8.5, builtin: true, primaryMuscles: ['rear_deltoid', 'anterior_deltoid'], efc: 0.55, movementPattern: 'isolation_push' },
  { id: 'upright_row',           name: 'Upright row',         tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true, primaryMuscles: ['traps', 'anterior_deltoid', 'biceps'], efc: 0.70, movementPattern: 'vertical_pull' },
  { id: 'shrug',                 name: 'Barbell shrug',       tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0, builtin: true, primaryMuscles: ['traps'], efc: 0.55, movementPattern: 'isolation_pull' },

  // ── Legs (Machine / Accessory) ───────────────────────────────────────────
  { id: 'leg_curl',              name: 'Leg curl',            tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0, builtin: true, primaryMuscles: ['hamstrings'], efc: 0.50, movementPattern: 'isolation_lower' },
  { id: 'leg_press',             name: 'Leg press',           tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true, primaryMuscles: ['quads', 'glutes'], efc: 0.75, movementPattern: 'squat' },
  { id: 'leg_extension',         name: 'Leg extension',       tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0, builtin: true, primaryMuscles: ['quads'], efc: 0.50, movementPattern: 'isolation_lower' },
  { id: 'hack_squat',            name: 'Hack squat',          tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true, primaryMuscles: ['quads', 'glutes'], efc: 0.75, movementPattern: 'squat' },
  { id: 'bulgarian_split_squat', name: 'Bulgarian split sq',  tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['quads', 'glutes', 'hamstrings'], efc: 0.85, movementPattern: 'squat' },
  { id: 'walking_lunge',         name: 'Walking lunge',       tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true, primaryMuscles: ['quads', 'glutes', 'hamstrings'], efc: 0.85, movementPattern: 'squat' },
  { id: 'glute_bridge',          name: 'Glute bridge',        tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0, builtin: true, primaryMuscles: ['glutes', 'hamstrings'], efc: 0.55, movementPattern: 'hip_hinge' },
  { id: 'hip_thrust',            name: 'Hip thrust',          tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true, primaryMuscles: ['glutes', 'hamstrings'], efc: 0.75, movementPattern: 'hip_hinge' },
  { id: 'calf_raise',            name: 'Standing calf raise', tag: 'SUPP',    defaultSets: 3, defaultReps: 15, defaultRpe: 8.0, builtin: true, primaryMuscles: ['calves'], efc: 0.50, movementPattern: 'isolation_lower' },
  { id: 'seated_calf_raise',     name: 'Seated calf raise',   tag: 'SUPP',    defaultSets: 3, defaultReps: 15, defaultRpe: 8.0, builtin: true, primaryMuscles: ['calves'], efc: 0.50, movementPattern: 'isolation_lower' },
  { id: 'glute_ham_raise',       name: 'Glute-ham raise',     tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['hamstrings', 'glutes', 'spinal_erectors'], efc: 0.75, movementPattern: 'hip_hinge' },
  { id: 'reverse_hyper',         name: 'Reverse hyper',       tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0, builtin: true, primaryMuscles: ['hamstrings', 'glutes', 'spinal_erectors'], efc: 0.55, movementPattern: 'hip_hinge' },
  { id: 'nordic_curl',           name: 'Nordic curl',         tag: 'SUPP',    defaultSets: 3, defaultReps: 6,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['hamstrings'], efc: 0.55, movementPattern: 'isolation_lower' },
  { id: 'hip_adductor',          name: 'Hip adduction',       tag: 'SUPP',    defaultSets: 3, defaultReps: 15, defaultRpe: 8.0, builtin: true, primaryMuscles: ['adductors'], efc: 0.40, movementPattern: 'isolation_lower' },
  { id: 'hip_abductor',          name: 'Hip abduction',       tag: 'SUPP',    defaultSets: 3, defaultReps: 15, defaultRpe: 8.0, builtin: true, primaryMuscles: ['abductors', 'glutes'], efc: 0.40, movementPattern: 'isolation_lower' },

  // ── Unilateral Legs ──────────────────────────────────────────────────────
  { id: 'single_leg_rdl',        name: 'Single-leg RDL',      tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['hamstrings', 'glutes', 'spinal_erectors'], efc: 0.80, movementPattern: 'hip_hinge' },
  { id: 'step_up',               name: 'Step-up',             tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['quads', 'glutes', 'hamstrings'], efc: 0.80, movementPattern: 'squat' },
  { id: 'split_squat',           name: 'Split squat',         tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['quads', 'glutes'], efc: 0.85, movementPattern: 'squat' },

  // ── Arms ─────────────────────────────────────────────────────────────────
  { id: 'dumbbell_curl',         name: 'Dumbbell curl',       tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.5, builtin: true, primaryMuscles: ['biceps'], efc: 0.55, movementPattern: 'isolation_pull' },
  { id: 'tricep_pushdown',       name: 'Tricep pushdown',     tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0, builtin: true, primaryMuscles: ['triceps'], efc: 0.55, movementPattern: 'isolation_push' },
  { id: 'skullcrusher',          name: 'Skullcrusher',        tag: 'SUPP',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true, primaryMuscles: ['triceps'], efc: 0.55, movementPattern: 'isolation_push' },
  { id: 'preacher_curl',         name: 'Preacher curl',       tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.5, builtin: true, primaryMuscles: ['biceps'], efc: 0.55, movementPattern: 'isolation_pull' },
  { id: 'hammer_curl',           name: 'Hammer curl',         tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0, builtin: true, primaryMuscles: ['biceps', 'forearms'], efc: 0.55, movementPattern: 'isolation_pull' },
  { id: 'tricep_extension',      name: 'Overhead tricep ext', tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0, builtin: true, primaryMuscles: ['triceps'], efc: 0.55, movementPattern: 'isolation_push' },
  { id: 'reverse_curl',          name: 'EZ bar reverse curl', tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0, builtin: true, primaryMuscles: ['biceps', 'forearms'], efc: 0.50, movementPattern: 'isolation_pull' },
  { id: 'concentration_curl',    name: 'Concentration curl',  tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.5, builtin: true, primaryMuscles: ['biceps'], efc: 0.50, movementPattern: 'isolation_pull' },
  { id: 'bayesian_curl',         name: 'Bayesian curl',       tag: 'SUPP',    defaultSets: 3, defaultReps: 12, defaultRpe: 8.0, builtin: true, primaryMuscles: ['biceps'], efc: 0.50, movementPattern: 'isolation_pull' },
  { id: 'single_arm_press',      name: 'Single-arm press',    tag: 'SUPP',    defaultSets: 3, defaultReps: 8,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['anterior_deltoid', 'triceps'], efc: 0.90, movementPattern: 'vertical_push' },

  // ── Core ─────────────────────────────────────────────────────────────────
  { id: 'plank',                 name: 'Plank',               tag: 'CORE',    defaultSets: 3, defaultReps: 1,  defaultRpe: 7.0, builtin: true, primaryMuscles: ['core'], efc: 0.30, movementPattern: 'core' },
  { id: 'hanging_leg_raise',     name: 'Hanging leg raise',   tag: 'CORE',    defaultSets: 3, defaultReps: 10, defaultRpe: 8.0, builtin: true, primaryMuscles: ['core', 'hip_flexors'], efc: 0.40, movementPattern: 'core' },
  { id: 'ab_wheel',              name: 'Ab wheel rollout',    tag: 'CORE',    defaultSets: 3, defaultReps: 8,  defaultRpe: 7.5, builtin: true, primaryMuscles: ['core', 'lats'], efc: 0.40, movementPattern: 'core' },
  { id: 'pallof_press',          name: 'Pallof press',        tag: 'CORE',    defaultSets: 3, defaultReps: 10, defaultRpe: 7.5, builtin: true, primaryMuscles: ['core'], efc: 0.30, movementPattern: 'core' },
  { id: 'dragon_flag',           name: 'Dragon flag',         tag: 'CORE',    defaultSets: 3, defaultReps: 6,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['core', 'lats'], efc: 0.40, movementPattern: 'core' },
  { id: 'russian_twist',         name: 'Russian twist',       tag: 'CORE',    defaultSets: 3, defaultReps: 12, defaultRpe: 7.5, builtin: true, primaryMuscles: ['core'], efc: 0.30, movementPattern: 'core' },
  { id: 'dead_bug',              name: 'Dead bug',            tag: 'CORE',    defaultSets: 3, defaultReps: 8,  defaultRpe: 7.0, builtin: true, primaryMuscles: ['core'], efc: 0.20, movementPattern: 'core' },
  { id: 'farmers_walk',          name: "Farmer's walk",       tag: 'CORE',    defaultSets: 3, defaultReps: 1,  defaultRpe: 7.5, builtin: true, primaryMuscles: ['core', 'forearms', 'traps'], efc: 0.40, movementPattern: 'carry' },
  { id: 'suitcase_carry',        name: 'Suitcase carry',      tag: 'CORE',    defaultSets: 3, defaultReps: 1,  defaultRpe: 7.5, builtin: true, primaryMuscles: ['core', 'forearms'], efc: 0.35, movementPattern: 'carry' },
  { id: 'turkish_get_up',        name: 'Turkish get-up',      tag: 'CORE',    defaultSets: 3, defaultReps: 3,  defaultRpe: 8.0, builtin: true, primaryMuscles: ['core', 'anterior_deltoid', 'glutes', 'spinal_erectors'], efc: 0.70, movementPattern: 'core' },
  { id: 'kettlebell_swing',      name: 'Kettlebell swing',    tag: 'CORE',    defaultSets: 3, defaultReps: 15, defaultRpe: 7.5, builtin: true, primaryMuscles: ['glutes', 'hamstrings', 'spinal_erectors', 'core'], efc: 0.85, movementPattern: 'hip_hinge' },
];

export const TAG_COLORS: Record<SessionExercise['tag'], string> = {
  PRIMARY: '#ff6e3a',
  ASSIST:  '#e8c14e',
  SUPP:    '#a8a298',
  CORE:    '#7fb37a',
};

/** Lookup an exercise from the built-in catalog by ID */
export function getBuiltinExercise(id: string): CatalogEntry | undefined {
  return BUILTIN_EXERCISES.find(e => e.id === id);
}
