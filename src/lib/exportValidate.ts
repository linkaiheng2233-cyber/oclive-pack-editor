import { buildRolePackFiles, type ExportableManifest, type ExportableSettings, type PackExtraFiles } from './exportPack'
import { HOST_RUNTIME_VERSION } from './hostRuntimeVersion'
import { isTauriRuntime } from './exportFolder'
import { parseConfigJson } from './portraitCatalog'
import { humanizeExportValidateErrors } from './exportErrorMessages'
const PLACEHOLDER_BYTES = '\u0000'

/** Mirror disk paths referenced by catalog / VP so wasm `validate_portrait_catalog_files` passes. */
export function appendAssetPlaceholdersForValidate(
  files: Map<string, string>,
  roleId: string,
  extra?: Partial<PackExtraFiles>,
): Map<string, string> {
  const id = roleId.trim()
  const out = new Map(files)

  const writeIfMissing = (rel: string, content = PLACEHOLDER_BYTES) => {
    const key = `${id}/${rel.replace(/\\/g, '/').replace(/^\//, '')}`
    if (!out.has(key)) out.set(key, content)
  }

  const assets =
    extra?.catalogAssets?.length
      ? extra.catalogAssets
      : (extra?.emotionImages ?? []).map((f) => ({
          relPath: `assets/images/${f.name}`,
          file: f,
        }))
  for (const { relPath } of assets) {
    writeIfMissing(relPath)
  }

  const catalogRaw = extra?.portraitCatalogJson?.trim()
  if (catalogRaw) {
    try {
      const parsed = JSON.parse(catalogRaw) as {
        assets?: Array<{ path?: string; kind?: string }>
      }
      for (const a of parsed.assets ?? []) {
        const rel = a.path?.trim()
        if (!rel) continue
        writeIfMissing(rel, a.kind === 'live2d' ? '{}' : PLACEHOLDER_BYTES)
      }
    } catch {
      /* ignore */
    }
  }

  const configRaw = extra?.configJson?.trim()
  if (configRaw) {
    const { visual } = parseConfigJson(configRaw)
    const model = visual.live2dModel?.trim()
    if (model) writeIfMissing(model, '{}')
  }

  return out
}

/** Desktop: write export-shaped tree to temp dir and run `validate_role_pack_blueprint_v2_directory`. */
export async function validateExportPackDirectory(
  roleId: string,
  manifest: ExportableManifest,
  settings: ExportableSettings,
  extra?: Partial<PackExtraFiles>,
): Promise<{ ok: boolean; errors: string[]; usedTauri: boolean }> {
  const id = roleId.trim()
  const files = appendAssetPlaceholdersForValidate(
    buildRolePackFiles(id, { ...manifest, id }, settings, extra),
    id,
    extra,
  )
  const payload = [...files.entries()].map(([path, content]) => ({ path, content }))

  if (!isTauriRuntime()) {
    return { ok: true, errors: [], usedTauri: false }
  }

  try {
    const { invoke } = await import('@tauri-apps/api/tauri')
    await invoke('validate_role_pack_export', {
      roleId: id,
      files: payload,
      hostRuntimeVersion: HOST_RUNTIME_VERSION,
    })
    return { ok: true, errors: [], usedTauri: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const raw = msg.split('\n').filter(Boolean)
    return { ok: false, errors: humanizeExportValidateErrors(raw, id), usedTauri: true }
  }
}