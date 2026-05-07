import JSZip from 'jszip'
import {
  buildCreatorMessageFileContent,
  ROLE_PACK_CREATOR_MESSAGE_FILENAME,
  type CreatorMessageExportMode,
} from './rolePackCreatorMessage'
import { mergedSceneIds, rolePackRelativePaths } from './packLayout'
import { normalizeKnowledgePath, type KnowledgeMarkdownFile } from './knowledgeFiles'
import { normalizeOclexpertForDisk } from './oclexpertPack'

export type ExportableManifest = Record<string, unknown>
export type ExportableSettings = Record<string, unknown>

const KNOWLEDGE_PLACEHOLDER = `在此目录放置世界观 Markdown（可选）。
运行时契约见 oclivenewnew 仓库 creator-docs/role-pack/WORLDVIEW_KNOWLEDGE.md
`

const SCENE_DESC_PLACEHOLDER = '（编写器占位：请替换为场景叙事与设定。）\n'

function minimalSceneJson(displayName: string): string {
  return JSON.stringify({ name: displayName }, null, 2) + '\n'
}

export type PackExtraFiles = {
  /** 可选：`roles/{id}/author.json` 全文 */
  authorJson?: string
  /** 可选：`roles/{id}/ui.json` 全文 */
  uiConfigJson?: string
  /** 对应 roles/{id}/core_personality.txt */
  corePersonality: string
  /** 兼容旧路径：有内容时写入 knowledge/world.md（含 front matter） */
  worldviewMarkdown: string
  /** 多知识文件（world.md + lore/*.md 等）；优先于 worldviewMarkdown */
  knowledgeMarkdownFiles: KnowledgeMarkdownFile[]
  /** 置于 assets/images/ 下，文件名应与 oclive 情绪资源命名一致（如 happy.png） */
  emotionImages: File[]
  /** 写入 roles/{id}/creator_message.txt，随包分发；见 `creatorMessageMode` */
  creatorMessage?: string
  /** unified：全文只取首条非空行；per_module：每行一条（多模块拼接时汇总展示） */
  creatorMessageMode?: CreatorMessageExportMode
  /**
   * 可选：`roles/{id}/expert/default.oclexpert`（Module 9 专家图分享格式）。
   * 导出前会校验并规范化为 `format: oclexpert` 的 v1 文件；无效内容不会写入包内。
   */
  expertOclexpertJson?: string
}

function worldMdBody(body: string): string {
  const t = body.trim()
  if (!t) return ''
  if (t.startsWith('---')) return `${t}\n`
  return `---\nid: world_intro\ntags: []\n---\n\n${t}\n`
}

/** Build path → UTF-8 file contents for a role pack under the roles root. */
export function buildRolePackFiles(
  roleId: string,
  manifest: ExportableManifest,
  settings: ExportableSettings,
  extra?: Partial<PackExtraFiles>,
): Map<string, string> {
  const id = roleId.trim()
  const m: ExportableManifest = { ...manifest, id }

  const scenes = mergedSceneIds(m['scenes'] as string[] | undefined, [])
  const files = new Map<string, string>()

  files.set(`${id}/manifest.json`, JSON.stringify(m, null, 2) + '\n')
  files.set(`${id}/settings.json`, JSON.stringify(settings, null, 2) + '\n')

  const uiRaw = extra?.uiConfigJson?.trim()
  if (uiRaw) {
    files.set(`${id}/ui.json`, uiRaw.endsWith('\n') ? uiRaw : `${uiRaw}\n`)
  }

  const authorRaw = extra?.authorJson?.trim()
  if (authorRaw) {
    files.set(`${id}/author.json`, authorRaw.endsWith('\n') ? authorRaw : `${authorRaw}\n`)
  }

  const core = (extra?.corePersonality ?? '').trim()
  files.set(
    `${id}/core_personality.txt`,
    core ? `${core}\n` : '（请填写人设、语气与说话习惯。）\n',
  )

  const echoBody = buildCreatorMessageFileContent(
    extra?.creatorMessage ?? '',
    extra?.creatorMessageMode ?? 'unified',
  )
  if (echoBody) {
    files.set(`${id}/${ROLE_PACK_CREATOR_MESSAGE_FILENAME}`, echoBody)
  }

  const world = worldMdBody(extra?.worldviewMarkdown ?? '')
  const docs = extra?.knowledgeMarkdownFiles ?? []
  if (docs.length > 0) {
    for (const d of docs) {
      const p = normalizeKnowledgePath(d.path)
      const body = worldMdBody(d.content)
      if (!body.trim()) continue
      files.set(`${id}/${p}`, body)
    }
  } else if (world) {
    files.set(`${id}/knowledge/world.md`, world)
  }
  if (![...files.keys()].some((k) => k.startsWith(`${id}/knowledge/`) && k.endsWith('.md'))) {
    // keep directory semantic for empty knowledge packs
    files.set(`${id}/knowledge/.oclive_placeholder.txt`, KNOWLEDGE_PLACEHOLDER)
  } else {
    files.delete(`${id}/knowledge/.oclive_placeholder.txt`)
  }

  for (const sid of scenes) {
    files.set(`${id}/scenes/${sid}/scene.json`, minimalSceneJson(sid))
    files.set(`${id}/scenes/${sid}/description.txt`, SCENE_DESC_PLACEHOLDER)
  }

  const expertNorm = extra?.expertOclexpertJson?.trim()
    ? normalizeOclexpertForDisk(extra.expertOclexpertJson)
    : null
  if (expertNorm) {
    files.set(`${id}/expert/default.oclexpert`, expertNorm)
  }

  return files
}

export async function buildRolePackZipBlob(
  roleId: string,
  manifest: ExportableManifest,
  settings: ExportableSettings,
  extra?: Partial<PackExtraFiles>,
): Promise<Blob> {
  const files = buildRolePackFiles(roleId, manifest, settings, extra)
  const zip = new JSZip()
  for (const [path, content] of files) {
    zip.file(path, content)
  }
  const id = roleId.trim()
  const imgs = extra?.emotionImages ?? []
  for (const f of imgs) {
    const buf = await f.arrayBuffer()
    zip.file(`${id}/assets/images/${f.name}`, buf)
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
