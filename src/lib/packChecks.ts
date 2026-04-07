import { mergedSceneIds } from './packLayout'
import type { ManifestInput, SettingsInput } from './validation'
import { validateEditorPack } from './validation'
import { buildMergedManifestJson, validateWithWasmIfAvailable } from './wasmValidation'

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

export type PackCheckResult = {
  ok: boolean
  errors: string[]
  /** 是否使用了 Rust wasm 校验（与运行时一致） */
  wasmUsed: boolean
}

/**
 * JSON 可解析、（可选）wasm `validate_disk_manifest`、否则 TypeScript `validateEditorPack`。
 */
export async function runAllPackChecks(
  manifestText: string,
  settingsText: string,
): Promise<PackCheckResult> {
  const p = parsePackDocuments(manifestText, settingsText)
  if (!p.ok) {
    return { ok: false, errors: p.errors, wasmUsed: false }
  }
  const m = p.manifest as ManifestInput
  const s = p.settings as SettingsInput
  const scenes = mergedSceneIds(m.scenes, [])
  const mergedJson = buildMergedManifestJson(p.manifest, p.settings)
  const wasmRes = await validateWithWasmIfAvailable(mergedJson, JSON.stringify(scenes))

  if (wasmRes.usedWasm && wasmRes.error === null) {
    return { ok: true, errors: [], wasmUsed: true }
  }
  if (wasmRes.usedWasm && wasmRes.error !== null) {
    return { ok: false, errors: [wasmRes.error], wasmUsed: true }
  }

  const errors = validateEditorPack(m, s, scenes)
  return { ok: errors.length === 0, errors, wasmUsed: false }
}
