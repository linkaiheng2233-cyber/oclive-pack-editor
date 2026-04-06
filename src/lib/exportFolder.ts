import { buildRolePackFiles, type ExportableManifest, type ExportableSettings } from './exportPack'

/** Write `{roleId}/**` under the directory chosen as the roles root (`OCLIVE_ROLES_DIR`). Requires a secure context and Chromium-based browsers. */
export async function writePackToRolesRoot(
  rolesRoot: FileSystemDirectoryHandle,
  roleId: string,
  manifest: ExportableManifest,
  settings: ExportableSettings,
): Promise<void> {
  const id = roleId.trim()
  const m = { ...manifest, id }
  const files = buildRolePackFiles(id, m, settings)
  for (const [rel, content] of files) {
    const parts = rel.split('/').filter(Boolean)
    let dir: FileSystemDirectoryHandle = rolesRoot
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i], { create: true })
    }
    const fileName = parts[parts.length - 1]
    const fh = await dir.getFileHandle(fileName, { create: true })
    const w = await fh.createWritable()
    await w.write(content)
    await w.close()
  }
}

export function isFolderExportSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}
