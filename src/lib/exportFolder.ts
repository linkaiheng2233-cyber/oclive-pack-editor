import { invoke } from '@tauri-apps/api/tauri'
import { open } from '@tauri-apps/api/dialog'
import { buildRolePackFiles, type ExportableManifest, type ExportableSettings } from './exportPack'

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

/** Write `{roleId}/**` under the directory chosen as the roles root (`OCLIVE_ROLES_DIR`). Tauri：对话框选目录 + IPC；浏览器：需 File System Access。 */
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

export async function writePackToRolesRootPath(
  rolesRootPath: string,
  roleId: string,
  manifest: ExportableManifest,
  settings: ExportableSettings,
): Promise<void> {
  const id = roleId.trim()
  const m = { ...manifest, id }
  const files = buildRolePackFiles(id, m, settings)
  const payload = [...files.entries()].map(([path, content]) => ({ path, content }))
  await invoke('write_role_pack_files', {
    roles_root: rolesRootPath,
    files: payload,
  })
}

/** 选 roles 根并写入 `buildRolePackFiles` 目录树；桌面走 Tauri，否则走 File System Access（若可用）。取消对话框时返回 false。 */
export async function pickRolesRootAndWritePack(
  roleId: string,
  manifest: ExportableManifest,
  settings: ExportableSettings,
): Promise<boolean> {
  if (isTauriRuntime()) {
    const selected = await open({ directory: true, multiple: false })
    if (selected === null) return false
    const path = Array.isArray(selected) ? selected[0] : selected
    await writePackToRolesRootPath(path, roleId, manifest, settings)
    return true
  }
  if (!isFolderExportSupported()) {
    throw new Error('当前环境不支持选择文件夹写入，请使用桌面版或支持 File System Access 的浏览器。')
  }
  try {
    const dir = await window.showDirectoryPicker({ mode: 'readwrite' })
    await writePackToRolesRoot(dir, roleId, manifest, settings)
    return true
  } catch (e) {
    if ((e as Error).name === 'AbortError') return false
    throw e
  }
}

export function isFolderExportSupported(): boolean {
  return isTauriRuntime() || (typeof window !== 'undefined' && 'showDirectoryPicker' in window)
}
