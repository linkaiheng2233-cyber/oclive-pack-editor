/**
 * 可选：由 `npm run wasm:build` 生成的 `oclive_validation` wasm（与运行时同一套 `validate_disk_manifest`）。
 * 占位 stub 未覆盖时自动回退到纯 TS 校验。
 */

import init, { validateManifestWasm } from '../wasm/pkg/oclive_validation.js'
import { HOST_RUNTIME_VERSION } from './hostRuntimeVersion'
import { mergeManifestWithSettings } from './mergeManifest'

export type WasmValidationResult = { usedWasm: boolean; error: string | null }

let wasmInitDone = false

/**
 * 若 wasm 可用且非占位，调用 `validateManifestWasm`；占位或失败时返回 `usedWasm: false` 以便走 TS。
 */
export async function validateWithWasmIfAvailable(
  mergedManifestJson: string,
  mergedSceneIdsJson: string,
): Promise<WasmValidationResult> {
  try {
    if (!wasmInitDone) {
      await init()
      wasmInitDone = true
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

export function buildMergedManifestJson(
  manifest: Record<string, unknown>,
  settings: Record<string, unknown>,
): string {
  const merged = mergeManifestWithSettings(manifest, settings)
  return JSON.stringify(merged)
}
