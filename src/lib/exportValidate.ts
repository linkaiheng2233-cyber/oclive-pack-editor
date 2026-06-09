import { buildRolePackFiles, type ExportableManifest, type ExportableSettings, type PackExtraFiles } from './exportPack'
import { HOST_RUNTIME_VERSION } from './hostRuntimeVersion'
import { isTauriRuntime } from './exportFolder'

/** Desktop: write export-shaped tree to temp dir and run `validate_role_pack_blueprint_v2_directory`. */
export async function validateExportPackDirectory(
  roleId: string,
  manifest: ExportableManifest,
  settings: ExportableSettings,
  extra?: Partial<PackExtraFiles>,
): Promise<{ ok: boolean; errors: string[]; usedTauri: boolean }> {
  const id = roleId.trim()
  const files = buildRolePackFiles(id, { ...manifest, id }, settings, extra)
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
    return { ok: false, errors: msg.split('\n').filter(Boolean), usedTauri: true }
  }
}
