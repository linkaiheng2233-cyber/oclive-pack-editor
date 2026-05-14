/**
 * 角色包编辑器侧校验：优先 wasm（与 oclive_validation 同源），否则 TypeScript 子集兜底。
 */

import { validateEditorPack, validateMinRuntimeVersion, type ManifestInput, type SettingsInput } from './validation'
import { validateRolePackWithWasmIfAvailable } from './wasmValidation'

/** 与 `oclive_validation::disk_role_settings::CURRENT_SETTINGS_SCHEMA_VERSION` 一致 */
export const ROLE_PACK_SETTINGS_SCHEMA_VERSION = 1

function validateDefaultPersonalityVector(values: unknown): string | null {
  if (values === undefined || values === null) return null
  if (!Array.isArray(values)) return 'manifest.default_personality 须为数组'
  if (values.length === 0) return null
  if (values.length !== 7) {
    return `manifest.default_personality 须为 7 个数字（当前 ${values.length} 个）`
  }
  for (let i = 0; i < 7; i++) {
    const x = Number(values[i])
    if (!Number.isFinite(x)) return `manifest.default_personality[${i}] 不是有限数字`
    if (x < 0 || x > 1) return `manifest.default_personality[${i}] 须在 0～1 之间（当前为 ${x}）`
  }
  return null
}

export function validateRolePackTypescript(
  manifestJson: string,
  settingsJson: string | null,
  mergedSceneIds: string[],
  hostVersion: string,
): string[] {
  const errors: string[] = []
  let manifest: unknown
  try {
    manifest = JSON.parse(manifestJson)
  } catch (e) {
    return [`manifest.json JSON 语法错误: ${e}`]
  }

  let settings: SettingsInput | null = null
  if (settingsJson != null && settingsJson.trim() !== '') {
    try {
      settings = JSON.parse(settingsJson) as SettingsInput
    } catch (e) {
      return [`settings.json JSON 语法错误: ${e}`]
    }
  }

  const m = manifest as ManifestInput
  errors.push(...validateEditorPack(m, settings, mergedSceneIds))

  const mr = manifest as Record<string, unknown>
  const perr = validateDefaultPersonalityVector(mr.default_personality)
  if (perr) errors.push(perr)

  const minErr = validateMinRuntimeVersion(mr.min_runtime_version, hostVersion)
  if (minErr) errors.push(minErr)

  return errors
}

export type RolePackEditorValidateResult = {
  ok: boolean
  errors: string[]
  usedWasm: boolean
}

export async function validateRolePackEditorState(
  manifestJson: string,
  settingsJson: string | null,
  mergedSceneIds: string[],
  hostVersion: string,
): Promise<RolePackEditorValidateResult> {
  const wasm = await validateRolePackWithWasmIfAvailable(
    manifestJson,
    settingsJson,
    mergedSceneIds,
    hostVersion,
    ROLE_PACK_SETTINGS_SCHEMA_VERSION,
  )
  if (wasm.usedWasm) {
    return { ok: wasm.errors.length === 0, errors: wasm.errors, usedWasm: true }
  }
  const tsErrors = validateRolePackTypescript(manifestJson, settingsJson, mergedSceneIds, hostVersion)
  return { ok: tsErrors.length === 0, errors: tsErrors, usedWasm: false }
}
