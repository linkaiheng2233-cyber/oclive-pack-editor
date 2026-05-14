/**
 * 可选：由 `npm run wasm:build` 生成的 `oclive_validation` wasm（与运行时同一套 `validate_disk_manifest`）。
 * 占位 stub 未覆盖时自动回退到纯 TS 校验。
 */

import init, { validateManifestWasm, validateRolePackWasm } from '../wasm/pkg/oclive_validation.js'
import { HOST_RUNTIME_VERSION } from './hostRuntimeVersion'
import { mergeManifestWithSettings } from './mergeManifest'

export type WasmValidationResult = { usedWasm: boolean; error: string | null }

let wasmInitDone = false
/** Node/Vitest 等环境无法 `fetch` 包内 `.wasm` 时跳过一次后永久回退 TS（浏览器打包后正常）。 */
let wasmLoadSkipped = false

/**
 * 若 wasm 可用且非占位，调用 `validateManifestWasm`；占位或失败时返回 `usedWasm: false` 以便走 TS。
 */
export async function validateWithWasmIfAvailable(
  mergedManifestJson: string,
  mergedSceneIdsJson: string,
): Promise<WasmValidationResult> {
  if (import.meta.env.VITEST) {
    return { usedWasm: false, error: null }
  }
  if (wasmLoadSkipped) {
    return { usedWasm: false, error: null }
  }
  try {
    if (!wasmInitDone) {
      try {
        await init()
        wasmInitDone = true
      } catch {
        wasmLoadSkipped = true
        return { usedWasm: false, error: null }
      }
    }
    validateManifestWasm(mergedManifestJson, mergedSceneIdsJson, HOST_RUNTIME_VERSION)
    return { usedWasm: true, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === '__OCWASM_NOT_BUILT__') {
      return { usedWasm: false, error: null }
    }
    return { usedWasm: true, error: msg }
  }
}

export type WasmRolePackValidationResult = { usedWasm: boolean; errors: string[] }

/**
 * 若 wasm 可用，调用 `validateRolePackWasm`（与 `validate_role_pack_loaded` 同源）；否则 `usedWasm: false`。
 */
export async function validateRolePackWithWasmIfAvailable(
  manifestJson: string,
  settingsJson: string | null,
  mergedSceneIds: string[],
  hostRuntimeVersion: string,
  settingsSchemaSupported: number,
): Promise<WasmRolePackValidationResult> {
  if (import.meta.env.VITEST) {
    return { usedWasm: false, errors: [] }
  }
  if (wasmLoadSkipped) {
    return { usedWasm: false, errors: [] }
  }
  try {
    if (!wasmInitDone) {
      try {
        await init()
        wasmInitDone = true
      } catch {
        wasmLoadSkipped = true
        return { usedWasm: false, errors: [] }
      }
    }
    validateRolePackWasm(
      manifestJson,
      settingsJson ?? '',
      JSON.stringify(mergedSceneIds),
      hostRuntimeVersion,
      settingsSchemaSupported,
    )
    return { usedWasm: true, errors: [] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === '__OCWASM_NOT_BUILT__') {
      return { usedWasm: false, errors: [] }
    }
    return { usedWasm: true, errors: msg.split('\n').filter(Boolean) }
  }
}

export function buildMergedManifestJson(
  manifest: Record<string, unknown>,
  settings: Record<string, unknown>,
): string {
  const merged = mergeManifestWithSettings(manifest, settings)
  return JSON.stringify(merged)
}
