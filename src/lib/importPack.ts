/**
 * 从 .zip / .ocpak 导入角色包，用于编辑或另存为新包。
 */
import JSZip from 'jszip'
import { normalizeKnowledgePath, type KnowledgeMarkdownFile } from './knowledgeFiles'

export type ImportedRolePack = {
  roleId: string
  manifestJson: string
  settingsJson: string
  corePersonality: string
  worldviewMarkdown: string
  knowledgeMarkdownFiles: KnowledgeMarkdownFile[]
  /** 从包内 assets/images 解压出的文件，便于再次导出 */
  emotionImageFiles: File[]
  /** roles/{id}/creator_message.txt 全文（可含多行，与导出模式一致） */
  creatorMessage: string
}

function normalizeZipPath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\/+/, '')
}

/** 拒绝 zip-slip：路径段中不得出现 `.` / `..`，且必须落在 roleId 之下。 */
export function isSafePathUnderRole(fullPath: string, roleId: string): boolean {
  const p = normalizeZipPath(fullPath)
  const prefix = `${roleId}/`
  if (!p.startsWith(prefix)) return false
  const segments = p.split('/').filter((s) => s.length > 0)
  if (segments.length < 2 || segments[0] !== roleId) return false
  for (const s of segments) {
    if (s === '.' || s === '..') return false
  }
  return true
}

function isValidRoleId(id: string): boolean {
  if (!id || id === '.' || id === '..') return false
  if (id.includes('/') || id.includes('\\') || id.includes('\0')) return false
  return true
}

function isSafeAssetImageEntry(path: string, roleId: string, prefix: string): boolean {
  if (!path.startsWith(prefix) || path.endsWith('/')) return false
  if (!isSafePathUnderRole(path, roleId)) return false
  const base = path.slice(prefix.length)
  if (!base || base.includes('/') || base.includes('\\')) return false
  if (base === '.' || base === '..') return false
  return true
}

/** 解析 zip：取第一个「角色目录/manifest.json」路径确定角色根目录。 */
export async function importRolePackFromZip(file: File): Promise<ImportedRolePack> {
  const zip = await JSZip.loadAsync(file)
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir)

  const manifestPath = names.find((n) => /(^|\/)[^/]+\/manifest\.json$/.test(normalizeZipPath(n)))
  if (!manifestPath) {
    throw new Error('压缩包内未找到「角色文件夹/manifest.json」结构。')
  }

  const norm = normalizeZipPath(manifestPath)
  const manifestSegments = norm.split('/').filter(Boolean)
  if (manifestSegments.some((s) => s === '.' || s === '..')) {
    throw new Error('压缩包内 manifest 路径非法（含 . 或 .. 段）。')
  }
  if (manifestSegments.length < 2) {
    throw new Error('无法解析角色目录名。')
  }
  const roleId = manifestSegments[0]!
  if (!isValidRoleId(roleId)) {
    throw new Error('角色目录名非法。')
  }
  if (!isSafePathUnderRole(norm, roleId)) {
    throw new Error('压缩包内 manifest 路径非法。')
  }

  const readText = async (rel: string): Promise<string> => {
    const p = `${roleId}/${rel}`.replace(/\/+/g, '/')
    if (!isSafePathUnderRole(p, roleId)) return ''
    const entry = zip.file(p)
    if (!entry) return ''
    return (await entry.async('string')) as string
  }

  const manifestJson = await readText('manifest.json')
  if (!manifestJson.trim()) throw new Error('manifest.json 为空')

  let settingsJson = await readText('settings.json')
  if (!settingsJson.trim()) {
    settingsJson = '{}\n'
  }

  const corePersonality = await readText('core_personality.txt')

  const creatorMessageRaw = await readText('creator_message.txt')
  /** 保留全文（多行）以便与「按模块各一句」导出一致 */
  const creatorMessage = creatorMessageRaw.replace(/\r\n/g, '\n').replace(/\n+$/, '')

  const knowledgeMarkdownFiles: KnowledgeMarkdownFile[] = []
  for (const n of names) {
    const path = normalizeZipPath(n)
    if (!path.startsWith(`${roleId}/knowledge/`) || !path.endsWith('.md')) continue
    if (!isSafePathUnderRole(path, roleId)) continue
    const entry = zip.file(path)
    if (!entry) continue
    const content = (await entry.async('string')) as string
    knowledgeMarkdownFiles.push({
      path: normalizeKnowledgePath(path.slice(`${roleId}/`.length)),
      content: content.endsWith('\n') ? content : `${content}\n`,
    })
  }
  knowledgeMarkdownFiles.sort((a, b) => a.path.localeCompare(b.path))
  const worldMain =
    knowledgeMarkdownFiles.find((x) => x.path === 'knowledge/world.md') ??
    knowledgeMarkdownFiles.find((x) => x.path === 'knowledge/lore.md') ??
    knowledgeMarkdownFiles[0]
  const worldviewMarkdown = worldMain?.content ?? ''

  const emotionImageFiles: File[] = []
  const prefix = `${roleId}/assets/images/`
  for (const n of names) {
    const path = normalizeZipPath(n)
    if (!isSafeAssetImageEntry(path, roleId, prefix)) continue
    const entry = zip.file(path)
    if (!entry) continue
    const blob = await entry.async('blob')
    const base = path.slice(prefix.length)
    emotionImageFiles.push(new File([blob], base, { type: blob.type || 'image/png' }))
  }

  return {
    roleId,
    manifestJson: manifestJson.endsWith('\n') ? manifestJson : `${manifestJson}\n`,
    settingsJson: settingsJson.endsWith('\n') ? settingsJson : `${settingsJson}\n`,
    corePersonality,
    worldviewMarkdown,
    knowledgeMarkdownFiles,
    emotionImageFiles,
    creatorMessage,
  }
}

/** 导入成功后附在状态栏的短提示（与 oclive-launcher / 简单创作「对话推理」一致）。 */
export function importedPackBrainHint(settingsJson: string): string {
  try {
    const s = JSON.parse(settingsJson) as { plugin_backends?: { llm?: string } }
    if (s.plugin_backends?.llm === 'remote') {
      return '（云端 LLM：运行 oclive 时请在 oclive-launcher 填写 Remote LLM URL。）'
    }
  } catch {
    /* ignore */
  }
  return '（推理方式可在简单创作「对话推理」或 oclive-launcher 中调整。）'
}
