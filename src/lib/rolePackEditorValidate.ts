/**
 * 角色包编辑器侧校验：构建 v2 蓝图并与 oclive_validation BlueprintV2 profile 对齐。
 */

import {
  buildBlueprintV2FromLegacy,
  validateBlueprintV2Typescript,
} from './blueprintV2'
import { validateEditorPack, validateMinRuntimeVersion, type ManifestInput, type SettingsInput } from './validation'

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
  let settingsRecord: Record<string, unknown> = {}
  if (settingsJson != null && settingsJson.trim() !== '') {
    try {
      settings = JSON.parse(settingsJson) as SettingsInput
      settingsRecord = settings as Record<string, unknown>
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

  const bp = buildBlueprintV2FromLegacy(mr, settingsRecord)
  const roleId = String(mr.id ?? bp.meta.id ?? '').trim()
  errors.push(...validateBlueprintV2Typescript(bp, roleId || undefined))

  return errors
}

export type RolePackEditorValidateResult = {
  ok: boolean
  errors: string[]
  usedWasm: boolean
}

/** 桌面版优先走 Tauri `validate_blueprint_v2_json`（与 pack validate 默认 profile 同源）。 */
export async function validateRolePackEditorState(
  manifestJson: string,
  settingsJson: string | null,
  mergedSceneIds: string[],
  hostVersion: string,
): Promise<RolePackEditorValidateResult> {
  const tsErrors = validateRolePackTypescript(manifestJson, settingsJson, mergedSceneIds, hostVersion)
  if (tsErrors.length > 0) {
    return { ok: false, errors: tsErrors, usedWasm: false }
  }

  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri')
      const manifest = JSON.parse(manifestJson) as Record<string, unknown>
      await invoke('validate_blueprint_v2_json', {
        manifestText: manifestJson,
        settingsText: settingsJson ?? '{}',
        mergedSceneIds,
        hostRuntimeVersion: hostVersion,
        roleId: String(manifest.id ?? '').trim(),
      })
      return { ok: true, errors: [], usedWasm: true }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { ok: false, errors: msg.split('\n').filter(Boolean), usedWasm: true }
    }
  }

  return { ok: true, errors: [], usedWasm: false }
}
