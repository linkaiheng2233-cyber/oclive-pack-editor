import JSZip from 'jszip'
import { mergedSceneIds, rolePackRelativePaths } from './packLayout'

export type ExportableManifest = Record<string, unknown>
export type ExportableSettings = Record<string, unknown>

const KNOWLEDGE_PLACEHOLDER = `在此目录放置世界观 Markdown（可选）。
运行时契约见 oclivenewnew 仓库 creator-docs/role-pack/WORLDVIEW_KNOWLEDGE.md
`

const SCENE_DESC_PLACEHOLDER = '（编写器占位：请替换为场景叙事与设定。）\n'

function minimalSceneJson(displayName: string): string {
  return JSON.stringify({ name: displayName }, null, 2) + '\n'
}

/** Build path → UTF-8 file contents for a role pack under the roles root. */
export function buildRolePackFiles(
  roleId: string,
  manifest: ExportableManifest,
  settings: ExportableSettings,
): Map<string, string> {
  const id = roleId.trim()
  const m: ExportableManifest = { ...manifest, id }

  const scenes = mergedSceneIds(m['scenes'] as string[] | undefined, [])
  const files = new Map<string, string>()

  files.set(`${id}/manifest.json`, JSON.stringify(m, null, 2) + '\n')
  files.set(`${id}/settings.json`, JSON.stringify(settings, null, 2) + '\n')
  files.set(`${id}/knowledge/.oclive_placeholder.txt`, KNOWLEDGE_PLACEHOLDER)

  for (const sid of scenes) {
    files.set(`${id}/scenes/${sid}/scene.json`, minimalSceneJson(sid))
    files.set(`${id}/scenes/${sid}/description.txt`, SCENE_DESC_PLACEHOLDER)
  }

  return files
}

export async function buildRolePackZipBlob(
  roleId: string,
  manifest: ExportableManifest,
  settings: ExportableSettings,
): Promise<Blob> {
  const files = buildRolePackFiles(roleId, manifest, settings)
  const zip = new JSZip()
  for (const [path, content] of files) {
    zip.file(path, content)
  }
  return zip.generateAsync({ type: 'blob' })
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function suggestedZipName(roleId: string, ocpak: boolean): string {
  const safe = roleId.trim().replace(/[^\w\-]+/g, '_') || 'role'
  return ocpak ? `${safe}.ocpak` : `${safe}-role-pack.zip`
}

export { rolePackRelativePaths, mergedSceneIds }
