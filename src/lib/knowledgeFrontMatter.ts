import type { KnowledgeMarkdownFile } from './knowledgeFiles'

export type KnowledgeMeta = {
  id: string
  tags: string[]
  scenes: string[]
  eventHints: string[]
  weight: number
}

const DEFAULT_META: KnowledgeMeta = {
  id: 'knowledge_id',
  tags: [],
  scenes: [],
  eventHints: [],
  weight: 1,
}

export function parseKnowledgeMarkdown(content: string): { meta: KnowledgeMeta; body: string } {
  const raw = content ?? ''
  const t = raw.trimStart()
  if (!t.startsWith('---')) {
    return { meta: { ...DEFAULT_META }, body: raw }
  }
  const after = t.slice(3)
  const end = after.indexOf('\n---')
  if (end < 0) return { meta: { ...DEFAULT_META }, body: raw }
  const fm = after.slice(0, end)
  const body = after.slice(end + 4).replace(/^\s*\n?/, '')
  const meta: KnowledgeMeta = { ...DEFAULT_META }
  for (const line of fm.split('\n')) {
    const idx = line.indexOf(':')
    if (idx < 0) continue
    const k = line.slice(0, idx).trim()
    const v = line.slice(idx + 1).trim()
    if (k === 'id') meta.id = v.replace(/^['"]|['"]$/g, '') || meta.id
    if (k === 'weight') {
      const n = Number(v)
      if (Number.isFinite(n) && n > 0) meta.weight = n
    }
    if (k === 'tags') meta.tags = parseInlineArray(v)
    if (k === 'scenes') meta.scenes = parseInlineArray(v)
    if (k === 'event_hints') meta.eventHints = parseInlineArray(v)
  }
  return { meta, body }
}

function parseInlineArray(raw: string): string[] {
  const t = raw.trim()
  if (!t.startsWith('[') || !t.endsWith(']')) return []
  return t
    .slice(1, -1)
    .split(',')
    .map((x) => x.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
}

function toInlineArray(v: string[]): string {
  return `[${v.map((x) => JSON.stringify(x)).join(', ')}]`
}

export function buildKnowledgeMarkdown(meta: KnowledgeMeta, body: string): string {
  const cleanMeta: KnowledgeMeta = {
    id: (meta.id || 'knowledge_id').trim(),
    tags: meta.tags.map((x) => x.trim()).filter(Boolean),
    scenes: meta.scenes.map((x) => x.trim()).filter(Boolean),
    eventHints: meta.eventHints.map((x) => x.trim()).filter(Boolean),
    weight: Number.isFinite(meta.weight) && meta.weight > 0 ? meta.weight : 1,
  }
  const parts = [
    '---',
    `id: ${cleanMeta.id}`,
    `tags: ${toInlineArray(cleanMeta.tags)}`,
    `scenes: ${toInlineArray(cleanMeta.scenes)}`,
    `event_hints: ${toInlineArray(cleanMeta.eventHints)}`,
    `weight: ${cleanMeta.weight}`,
    '---',
    '',
    body.replace(/\r\n/g, '\n').trimEnd(),
    '',
  ]
  return parts.join('\n')
}

export function validateKnowledgeFiles(files: KnowledgeMarkdownFile[]): string[] {
  const errs: string[] = []
  const ids = new Set<string>()
  for (const f of files) {
    if (!f.path.startsWith('knowledge/') || !f.path.endsWith('.md')) {
      errs.push(`知识文件路径非法：${f.path}（需为 knowledge/*.md）`)
    }
    if (!f.content.trim()) continue
    const { meta } = parseKnowledgeMarkdown(f.content)
    if (!meta.id.trim()) errs.push(`知识文件缺少 id：${f.path}`)
    if (ids.has(meta.id)) errs.push(`知识块 id 重复：${meta.id}`)
    ids.add(meta.id)
  }
  return errs
}

