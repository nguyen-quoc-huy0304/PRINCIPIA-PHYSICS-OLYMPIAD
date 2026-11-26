/* tslint:disable */
/* eslint-disable */

/**
 * Calculate study streaks and normalize activity dates in Rust.
 */
export function activity_calendar_json(input_json: string): string;

export function assessment_grade_json(input_json: string): string;

export function clamp_game_target(target_m: number, speed_mps: number, gravity_mps2: number): number;

export function content_catalog_index_json(input_json: string, query: string): string;

/**
 * Execute hierarchical catalog operations in Rust for the browser presentation adapter.
 */
export function content_tree_query_json(catalog_json: string, operation: string, target_id: string): string;

/**
 * Calculate course completion metrics with Rust-owned rounding and bounds.
 */
export function course_completion_json(completed: number, total: number): string;

/**
 * Return the canonical XP reward for a validated learning activity.
 */
export function experience_reward(activity: string): number;

export function force_balance_score_json(candidate_x: number, candidate_y: number, target_x: number, target_y: number): string;

export function force_balance_target_json(force_a_x: number, force_a_y: number, force_b_x: number, force_b_y: number): string;

/**
 * Resolve deterministic AI league operations in the Rust core.
 */
export function game_league_json(input_json: string): string;

export function game_trajectory_json(speed_mps: number, angle_degrees: number, gravity_mps2: number, samples: number): string;

/**
 * Validate and apply Gameverse skill purchases in Rust.
 */
export function gameverse_buy_skill_json(input_json: string): string;

/**
 * Validate a Gameverse card pack purchase and select an unowned card in Rust.
 */
export function gameverse_card_pack_json(input_json: string): string;

/**
 * Validate and apply Gameverse season pass claims in Rust.
 */
export function gameverse_claim_pass_json(input_json: string): string;

/**
 * Apply a Gameverse recipe and validate its inventory transaction in Rust.
 */
export function gameverse_craft_json(input_json: string): string;

/**
 * Complete a Gameverse daily quest and select its material reward in Rust.
 */
export function gameverse_daily_quest_json(input_json: string): string;

/**
 * Calculate Gameverse pet XP remainder, level, and form in Rust.
 */
export function gameverse_pet_progress_json(pet_xp: number, pet_level: number): string;

/**
 * Resolve Gameverse quiz rewards and ranked rating changes in Rust.
 */
export function gameverse_quiz_reward_json(input_json: string): string;

/**
 * Validate and randomly select Gameverse quiz questions in Rust.
 */
export function gameverse_quiz_select_json(input_json: string): string;

/**
 * Select a daily Gameverse event and its reward in Rust.
 */
export function gameverse_random_event_json(roll: number, already_triggered: boolean): string;

/**
 * Calculate Gameverse season pass level and progress in Rust.
 */
export function gameverse_season_progress_json(season_xp: number): string;

/**
 * Validate a Gameverse treasure answer and return its Rust-owned reward.
 */
export function gameverse_treasure_answer_json(input_json: string): string;

/**
 * Select a Gameverse treasure riddle using a validated random sample.
 */
export function gameverse_treasure_question_json(roll: number): string;

/**
 * Validate and apply Gameverse zone unlock transactions in Rust.
 */
export function gameverse_unlock_zone_json(input_json: string): string;

export function generate_game_challenge_json(seed: bigint): string;

/**
 * Search lesson, quiz and discovery catalogs using the Rust content index.
 */
export function global_search_index_json(input_json: string, query: string, default_kind: string): string;

/**
 * Aggregate learning analytics in Rust; browser code supplies locally stored records.
 */
export function learning_analytics_summary_json(input_json: string): string;

export function learning_orchestrate_json(input_json: string): string;

/**
 * Produces an adaptive learning plan in Rust; browser code only presents the result.
 */
export function learning_plan_json(topic: string, phase: string, percent: number, has_percent: boolean, error_count: number, energy: number, confidence: number, goal: string): string;

export function learning_recommend_json(context_json: string): string;

export function learning_review_schedule_json(quality: number, previous_interval_days: number, ease_factor: number): string;

export function learning_science_select_json(input_json: string): string;

export function physics_collision_1d_json(mass_a: number, velocity_a: number, mass_b: number, velocity_b: number, restitution: number): string;

export function physics_disk_collision_json(body_a_json: string, body_b_json: string, restitution: number): string;

export function physics_displacement(initial_mps: number, acceleration_mps2: number, seconds: number): number;

export function physics_kinetic_energy(mass_kg: number, speed_mps: number): number;

export function physics_linear_regression_json(points_json: string): string;

export function physics_pendulum_json(length_m: number, gravity_mps2: number, amplitude_degrees: number): string;

export function physics_projectile_json(speed_mps: number, angle_degrees: number, gravity_mps2: number): string;

export function physics_robot_arm_json(l1_m: number, l2_m: number, target_x_m: number, target_y_m: number, elbow_branch: number): string;

export function physics_robot_forward_json(l1: number, l2: number, shoulder_rad: number, elbow_rad: number): string;

export function physics_velocity(initial_mps: number, acceleration_mps2: number, seconds: number): number;

/**
 * Record a study day without awarding XP or incrementing lesson counters.
 */
export function progress_day_json(progress_json: string, day: string): string;

export function progress_record_json(progress_json: string, activity: string, day: string): string;

export function progression_summary_json(input_json: string): string;

/**
 * Validate ranked arena mission claims and return the reward decided by Rust.
 */
export function rank_arena_claim_json(id: string, progress: number, already_claimed: boolean): string;

/**
 * Resolve a ranked arena match using Rust-owned scoring rules.
 */
export function rank_arena_resolve_json(input_json: string): string;

/**
 * Return the canonical ranked arena tier for a rating-point total.
 */
export function rank_arena_tier_json(rp: bigint): string;

export function robot_assembly_evaluate_json(base: string, joint: string, link1: string, link2: string, tool: string, link1_mm: number, link2_mm: number, shoulder_deg: number, elbow_deg: number, target_x_mm: number, target_y_mm: number): string;

export function score_projectile_json(speed: number, angle_degrees: number, target_m: number, gravity: number): string;

/**
 * Validate a weekly learning mission claim and return its Rust-owned reward.
 */
export function season_mission_claim_json(input_json: string): string;

/**
 * Generate weekly learning missions with Rust-owned targets and rewards.
 */
export function season_missions_json(input_json: string): string;

/**
 * Applies one UI event in the Rust state machine and returns the canonical state snapshot.
 */
export function ui_reduce_json(route: string, width: number, query: string, dialog: string, event: string, value: string): string;

/**
 * Render the validated Rust UI shell to HTML for WASM/browser/native adapters.
 */
export function ui_render_html(route: string, width: number, search_query: string, dialog: string): string;

/**
 * Builds a validated responsive UI state snapshot for browser/native renderers.
 */
export function ui_snapshot_json(route: string, width: number, search_query: string, dialog: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly activity_calendar_json: (a: number, b: number, c: number) => void;
    readonly assessment_grade_json: (a: number, b: number, c: number) => void;
    readonly clamp_game_target: (a: number, b: number, c: number, d: number) => void;
    readonly content_catalog_index_json: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly content_tree_query_json: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly course_completion_json: (a: number, b: number, c: number) => void;
    readonly experience_reward: (a: number, b: number, c: number) => void;
    readonly force_balance_score_json: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly force_balance_target_json: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly game_league_json: (a: number, b: number, c: number) => void;
    readonly game_trajectory_json: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly gameverse_buy_skill_json: (a: number, b: number, c: number) => void;
    readonly gameverse_card_pack_json: (a: number, b: number, c: number) => void;
    readonly gameverse_claim_pass_json: (a: number, b: number, c: number) => void;
    readonly gameverse_craft_json: (a: number, b: number, c: number) => void;
    readonly gameverse_daily_quest_json: (a: number, b: number, c: number) => void;
    readonly gameverse_pet_progress_json: (a: number, b: number, c: number) => void;
    readonly gameverse_quiz_reward_json: (a: number, b: number, c: number) => void;
    readonly gameverse_quiz_select_json: (a: number, b: number, c: number) => void;
    readonly gameverse_random_event_json: (a: number, b: number, c: number) => void;
    readonly gameverse_season_progress_json: (a: number, b: number) => void;
    readonly gameverse_treasure_answer_json: (a: number, b: number, c: number) => void;
    readonly gameverse_treasure_question_json: (a: number, b: number) => void;
    readonly gameverse_unlock_zone_json: (a: number, b: number, c: number) => void;
    readonly generate_game_challenge_json: (a: number, b: bigint) => void;
    readonly global_search_index_json: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly learning_analytics_summary_json: (a: number, b: number, c: number) => void;
    readonly learning_orchestrate_json: (a: number, b: number, c: number) => void;
    readonly learning_plan_json: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => void;
    readonly learning_recommend_json: (a: number, b: number, c: number) => void;
    readonly learning_review_schedule_json: (a: number, b: number, c: number, d: number) => void;
    readonly learning_science_select_json: (a: number, b: number, c: number) => void;
    readonly physics_collision_1d_json: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly physics_disk_collision_json: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly physics_displacement: (a: number, b: number, c: number, d: number) => void;
    readonly physics_kinetic_energy: (a: number, b: number, c: number) => void;
    readonly physics_linear_regression_json: (a: number, b: number, c: number) => void;
    readonly physics_pendulum_json: (a: number, b: number, c: number, d: number) => void;
    readonly physics_projectile_json: (a: number, b: number, c: number, d: number) => void;
    readonly physics_robot_arm_json: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly physics_robot_forward_json: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly physics_velocity: (a: number, b: number, c: number, d: number) => void;
    readonly progress_day_json: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly progress_record_json: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly progression_summary_json: (a: number, b: number, c: number) => void;
    readonly rank_arena_claim_json: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly rank_arena_resolve_json: (a: number, b: number, c: number) => void;
    readonly rank_arena_tier_json: (a: number, b: bigint) => void;
    readonly robot_assembly_evaluate_json: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number) => void;
    readonly score_projectile_json: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly season_mission_claim_json: (a: number, b: number, c: number) => void;
    readonly season_missions_json: (a: number, b: number, c: number) => void;
    readonly ui_reduce_json: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => void;
    readonly ui_render_html: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly ui_snapshot_json: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export4: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
