import JSZip from 'jszip'
import {
  buildCreatorMessageFileContent,
  ROLE_PACK_CREATOR_MESSAGE_FILENAME,
  type CreatorMessageExportMode,
} from './rolePackCreatorMessage'
import { mergedSceneIds, rolePackRelativePaths } from './packLayout'
import { normalizeKnowledgePath, type KnowledgeMarkdownFile } from './knowledgeFiles'
import {
  buildBlueprintV2FromLegacy,
  PIPELINE_BLUEPRINT_FILENAME,
  REPLY_QUALITY_ANCHOR_REL_PATH,
  serializeBlueprintV2,
} from './blueprintV2'
import { mergeEditorReplyQualityAnchor } from './replyQualityAnchorPreset'

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
  /** 写入 prompts/reply_quality_anchor.md（人类可读镜像；运行时 SSOT 为 meta.reply_quality_anchor） */
  replyQualityAnchorMarkdown?: string
  /** 为 true 时若 settings 无锚点则写入编辑器默认锚点 */
  includeDefaultReplyQualityAnchor?: boolean
  /** 可选：`roles/{id}/config.json` 全文 */
  configJson?: string
  /** 可选：`roles/{id}/user_identities/index.json` 全文 */
  userIdentitiesIndexJson?: string
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

  const settingsForBlueprint = extra?.includeDefaultReplyQualityAnchor
    ? mergeEditorReplyQualityAnchor(settings, true)
    : { ...settings }

  const anchorFromSettings =
    typeof settingsForBlueprint.reply_quality_anchor === 'string'
      ? String(settingsForBlueprint.reply_quality_anchor)
      : ''
  const anchorBody =
    extra?.replyQualityAnchorMarkdown?.trim() ||
    anchorFromSettings.trim() ||
    ''

  const blueprint = buildBlueprintV2FromLegacy(m, settingsForBlueprint)
  blueprint.meta.id = id
  const files = new Map<string, string>()

  files.set(`${id}/${PIPELINE_BLUEPRINT_FILENAME}`, serializeBlueprintV2(blueprint))

  const scenes = mergedSceneIds(m['scenes'] as string[] | undefined, [])

  if (anchorBody) {
    files.set(`${id}/${REPLY_QUALITY_ANCHOR_REL_PATH}`, `${anchorBody.trim()}\n`)
  } else {
    files.set(
      `${id}/prompts/.oclive_placeholder.txt`,
      '可选：在此目录放置 reply_quality_anchor.md 等创作辅助 Markdown。\n',
    )
  }

  const configRaw = extra?.configJson?.trim()
  if (configRaw) {
    files.set(`${id}/config.json`, configRaw.endsWith('\n') ? configRaw : `${configRaw}\n`)
  }

  const uiRaw = extra?.uiConfigJson?.trim()
  if (uiRaw) {
    files.set(`${id}/ui.json`, uiRaw.endsWith('\n') ? uiRaw : `${uiRaw}\n`)
  }

  const authorRaw = extra?.authorJson?.trim()
  if (authorRaw) {
    files.set(`${id}/author.json`, authorRaw.endsWith('\n') ? authorRaw : `${authorRaw}\n`)
  }

  const uiIndexRaw = extra?.userIdentitiesIndexJson?.trim()
  if (uiIndexRaw) {
    files.set(
      `${id}/user_identities/index.json`,
      uiIndexRaw.endsWith('\n') ? uiIndexRaw : `${uiIndexRaw}\n`,
    )
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
