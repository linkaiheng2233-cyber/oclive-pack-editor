/* tslint:disable */
/* eslint-disable */

/**
 * Validate merged manifest JSON, scene id list, and (optionally) minimum host version.
 * Pass `host_runtime_version` as semver aligned with oclivenewnew `Cargo.toml` (e.g. `0.2.0`); empty string skips `min_runtime_version` check.
 * On error, returns Chinese `Err` strings consistent with runtime.
 */
export function validateManifestWasm(manifest_json: string, merged_scene_ids_json: string, host_runtime_version: string): void;

/**
 * In-memory role pack validation (`manifest` + optional `settings` + merged scene id list).
 * Empty `settings_json` means no `settings.json`; `merged_scene_ids_json` is a JSON string array.
 */
export function validateRolePackWasm(manifest_json: string, settings_json: string, merged_scene_ids_json: string, host_runtime_version: string, settings_schema_supported: number): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly validateManifestWasm: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly validateRolePackWasm: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
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
