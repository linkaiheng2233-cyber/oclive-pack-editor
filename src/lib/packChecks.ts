import { mergedSceneIds } from './packLayout'
import type { ManifestInput, SettingsInput } from './validation'
import { validateEditorPack } from './validation'

export function parseJson<T>(
  raw: string,
  label: string,
): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(raw) as T }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `${label} 不是合法 JSON：${msg}` }
  }
}

/** 解析 manifest / settings 文本，供导出等路径统一报错（避免无效 JSON 时静默失败）。 */
export function parsePackDocuments(
  manifestText: string,
  settingsText: string,
):
  | { ok: true; manifest: Record<string, unknown>; settings: Record<string, unknown> }
  | { ok: false; errors: string[] } {
  const m = parseJson<Record<string, unknown>>(manifestText, 'manifest.json')
  if (!m.ok) return { ok: false, errors: [m.error] }
  const s = parseJson<Record<string, unknown>>(settingsText, 'settings.json')
  if (!s.ok) return { ok: false, errors: [s.error] }
  return { ok: true, manifest: m.value, settings: s.value }
}

/**
 * JSON 可解析、validateEditorPack、场景键与 topic_weights 一致。
 * 与 `prepareExportPayload` / `parsePackDocuments` 共用同一次 manifest/settings 解析，避免重复 `JSON.parse`。
 */
export function runAllPackChecks(
  manifestText: string,
  settingsText: string,
): { ok: boolean; errors: string[] } {
  const p = parsePackDocuments(manifestText, settingsText)
  if (!p.ok) {
    return { ok: false, errors: p.errors }
  }
  const m = p.manifest as ManifestInput
  const s = p.settings as SettingsInput
  const scenes = mergedSceneIds(m.scenes, [])
  const errors = validateEditorPack(m, s, scenes)
  return { ok: errors.length === 0, errors }
}
