import { invoke } from '@tauri-apps/api/tauri'
import { open } from '@tauri-apps/api/dialog'
import {
  buildRolePackFiles,
  type ExportableManifest,
  type ExportableSettings,
  type PackExtraFiles,
} from './exportPack'

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + Math.min(chunk, bytes.length - i)))
  }
  return btoa(binary)
}

async function binaryPayloadForCatalogAssets(
  roleId: string,
  extra?: Partial<PackExtraFiles>,
): Promise<{ path: string; base64: string }[]> {
  const id = roleId.trim()
  const assets =
    extra?.catalogAssets?.length
      ? extra.catalogAssets
      : (extra?.emotionImages ?? []).map((f) => ({
          relPath: `assets/images/${f.name}`,
          file: f,
        }))
  const out: { path: string; base64: string }[] = []
  for (const { relPath, file } of assets) {
    const buf = await file.arrayBuffer()
    out.push({
      path: `${id}/${relPath.replace(/\\/g, '/')}`,
      base64: arrayBufferToBase64(buf),
    })
  }
  return out
}

/** Write `{roleId}/**` under the directory chosen as the roles root (`OCLIVE_ROLES_DIR`). Tauri：对话框选目录 + IPC；浏览器：需 File System Access。 */
export async function writePackToRolesRoot(
  rolesRoot: FileSystemDirectoryHandle,
  roleId: string,
  manifest: ExportableManifest,
  settings: ExportableSettings,
  extra?: Partial<PackExtraFiles>,
): Promise<void> {
  const id = roleId.trim()
  const m = { ...manifest, id }
  const files = buildRolePackFiles(id, m, settings, extra)
  for (const [rel, content] of files) {
    const parts = rel.split('/').filter(Boolean)
    let dir: FileSystemDirectoryHandle = rolesRoot
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i]!, { create: true })
    }
    const fileName = parts[parts.length - 1]!
    const fh = await dir.getFileHandle(fileName, { create: true })
    const w = await fh.createWritable()
    await w.write(content)
    await w.close()
  }
  const assets =
    extra?.catalogAssets?.length
      ? extra.catalogAssets
      : (extra?.emotionImages ?? []).map((f) => ({
          relPath: `assets/images/${f.name}`,
          file: f,
        }))
  for (const { relPath, file } of assets) {
    const rel = `${id}/${relPath.replace(/\\/g, '/')}`
    const parts = rel.split('/').filter(Boolean)
    let dir: FileSystemDirectoryHandle = rolesRoot
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i]!, { create: true })
    }
    const fh = await dir.getFileHandle(parts[parts.length - 1]!, { create: true })
    const w = await fh.createWritable()
    await w.write(await file.arrayBuffer())
    await w.close()
  }
}

export async function writePackToRolesRootPath(
  rolesRootPath: string,
  roleId: string,
  manifest: ExportableManifest,
  settings: ExportableSettings,
  extra?: Partial<PackExtraFiles>,
): Promise<void> {
  const id = roleId.trim()
  const m = { ...manifest, id }
  const files = buildRolePackFiles(id, m, settings, extra)
  const payload = [...files.entries()].map(([path, content]) => ({ path, content }))
  await invoke('write_role_pack_files', {
    rolesRoot: rolesRootPath,
    files: payload,
  })
  const bins = await binaryPayloadForCatalogAssets(id, extra)
  if (bins.length > 0) {
    await invoke('write_role_pack_binaries', {
      rolesRoot: rolesRootPath,
      files: bins,
    })
  }
}

/** 选 roles 根并写入完整包；取消对话框时 `wrote: false`。成功时返回 `rolesRootPath` 供试聊等使用。 */
export async function pickRolesRootAndWritePack(
  roleId: string,
  manifest: ExportableManifest,
  settings: ExportableSettings,
  extra?: Partial<PackExtraFiles>,
): Promise<{ wrote: boolean; rolesRootPath?: string }> {
  if (isTauriRuntime()) {
    const selected = await open({ directory: true, multiple: false })
    if (selected === null) return { wrote: false }
    const path = Array.isArray(selected) ? selected[0] : selected
    await writePackToRolesRootPath(path, roleId, manifest, settings, extra)
    return { wrote: true, rolesRootPath: path }
  }
  if (!isFolderExportSupported()) {
    throw new Error('当前环境不支持选择文件夹写入，请使用桌面版或支持 File System Access 的浏览器。')
  }
  try {
    const dir = await window.showDirectoryPicker({ mode: 'readwrite' })
    await writePackToRolesRoot(dir, roleId, manifest, settings, extra)
    return { wrote: true }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return { wrote: false }
    throw e
  }
}

export function isFolderExportSupported(): boolean {
  return isTauriRuntime() || (typeof window !== 'undefined' && 'showDirectoryPicker' in window)
}
