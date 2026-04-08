/**
 * Lightweight checks aligned with runtime `validate_disk_manifest` (see oclivenewnew
 * `src-tauri/src/domain/role_manifest_validate.rs`). Full truth remains `load_role` in the app.
 */

import { HOST_RUNTIME_VERSION } from './hostRuntimeVersion'

export { HOST_RUNTIME_VERSION }

/** 与 `oclive_validation::validate_min_runtime_version` 对齐（主.次.补丁 semver）。 */
export function validateMinRuntimeVersion(
  minReq: unknown,
  hostVersion: string = HOST_RUNTIME_VERSION,
): string | null {
  if (minReq == null) return null
  const req = String(minReq).trim()
  if (!req) return null
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/.exec(req)
  if (!m) {
    return `角色包 manifest：min_runtime_version「${req}」须为语义化版本（例如 0.2.0）`
  }
  const major = parseInt(m[1]!, 10)
  const minor = parseInt(m[2]!, 10)
  const patch = parseInt(m[3]!, 10)
  const hm = /^(\d+)\.(\d+)\.(\d+)/.exec(hostVersion.trim())
  if (!hm) return null
  const hmaj = parseInt(hm[1]!, 10)
  const hmin = parseInt(hm[2]!, 10)
  const hpat = parseInt(hm[3]!, 10)
  if (
    hmaj < major ||
    (hmaj === major && hmin < minor) ||
    (hmaj === major && hmin === minor && hpat < patch)
  ) {
    return `当前编写器按 oclive ${hostVersion} 校验：本包要求最低 ${req}（manifest.min_runtime_version）。请升级 oclive 或使用更低 min_runtime。`
  }
  return null
}

export type UserRelationDisk = {
  display_name?: string
  prompt_hint?: string
  favor_multiplier?: number
  initial_favorability?: number
}

export type ManifestInput = {
  id?: string
  name?: string
  scenes?: string[]
  user_relations?: Record<string, UserRelationDisk>
  default_relation?: string
  memory_config?: { topic_weights?: Record<string, Record<string, number>> }
}

export type SettingsInput = {
  memory_config?: { topic_weights?: Record<string, Record<string, number>> }
}

export function validateEditorPack(
  manifest: ManifestInput,
  settings: SettingsInput | null,
  mergedSceneIds: string[],
): string[] {
  const errors: string[] = []
  const id = (manifest.id ?? '').trim()
  const name = (manifest.name ?? '').trim()

  if (!id) errors.push('manifest.id 不能为空')
  if (!name) errors.push('manifest.name 不能为空')

  const rels = manifest.user_relations ?? {}
  if (Object.keys(rels).length === 0) {
    errors.push('user_relations 至少需要配置一种用户身份')
  }

  const relationKeys = new Set(Object.keys(rels))
  const dr = (manifest.default_relation ?? '').trim()
  if (dr && !relationKeys.has(dr)) {
    errors.push(`default_relation「${dr}」在 user_relations 中不存在`)
  }

  const scenes = new Set(mergedSceneIds.map((s) => s.trim()).filter(Boolean))
  const topicWeights = settings?.memory_config?.topic_weights ?? manifest.memory_config?.topic_weights
  if (topicWeights) {
    for (const sceneKey of Object.keys(topicWeights)) {
      if (!scenes.has(sceneKey)) {
        errors.push(
          `memory_config.topic_weights 中的场景「${sceneKey}」未出现在合并后的场景列表中（manifest.scenes + scenes/ 目录）`,
        )
      }
    }
  }

  for (const [rid, ur] of Object.entries(rels)) {
    const fav = ur.initial_favorability
    if (fav !== undefined) {
      if (!Number.isFinite(fav)) {
        errors.push(`身份「${rid}」的 initial_favorability 不是有效数字`)
      } else if (fav < 0 || fav > 100) {
        errors.push(`身份「${rid}」的 initial_favorability 须在 0～100 之间（当前为 ${fav}）`)
      }
    }
    const fm = ur.favor_multiplier
    if (fm !== undefined && (!Number.isFinite(fm) || fm <= 0)) {
      errors.push(`身份「${rid}」的 favor_multiplier 须为正数`)
    }
  }

  return errors
}
