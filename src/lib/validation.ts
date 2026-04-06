/**
 * Lightweight checks aligned with runtime `validate_disk_manifest` (see oclivenewnew
 * `src-tauri/src/domain/role_manifest_validate.rs`). Full truth remains `load_role` in the app.
 */

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
