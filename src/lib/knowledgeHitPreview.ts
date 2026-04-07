import type { KnowledgeMarkdownFile } from './knowledgeFiles'
import { parseKnowledgeMarkdown } from './knowledgeFrontMatter'

export type KnowledgeHit = {
  path: string
  id: string
  score: number
  baseScore: number
  weight: number
  sceneMatched: boolean
  reasons: string[]
  snippets: string[]
}

export type KnowledgePreviewOptions = {
  sceneId?: string
  strictScene?: boolean
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[\s,.;:!?()[\]{}"'`~|/\\\-_\n\r\t]+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 2)
}

function extractBodySnippets(body: string, terms: string[]): string[] {
  const src = body.replace(/\s+/g, ' ').trim()
  if (!src) return []
  const out: string[] = []
  const lc = src.toLowerCase()
  for (const t of terms) {
    const i = lc.indexOf(t)
    if (i < 0) continue
    const start = Math.max(0, i - 16)
    const end = Math.min(src.length, i + t.length + 20)
    const prefix = start > 0 ? '...' : ''
    const suffix = end < src.length ? '...' : ''
    const seg = src.slice(start, end)
    const hl = seg.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), (m) => `[${m}]`)
    out.push(`${prefix}${hl}${suffix}`)
    if (out.length >= 2) break
  }
  return Array.from(new Set(out))
}

export function previewKnowledgeHits(
  files: KnowledgeMarkdownFile[],
  query: string,
  options: KnowledgePreviewOptions = {},
): KnowledgeHit[] {
  const terms = tokenize(query)
  if (terms.length === 0) return []
  const scene = (options.sceneId || '').trim().toLowerCase()
  const hits: KnowledgeHit[] = []
  for (const f of files) {
    const { meta, body } = parseKnowledgeMarkdown(f.content)
    const sceneMatched =
      !scene ||
      meta.scenes.length === 0 ||
      meta.scenes.some((x) => x.toLowerCase() === scene || x.toLowerCase().includes(scene))
    if (options.strictScene && scene && !sceneMatched) continue
    const bodyLc = body.toLowerCase()
    let baseScore = 0
    const reasons: string[] = []
    if (scene && sceneMatched) {
      reasons.push(`场景过滤通过 "${scene}"`)
    }
    for (const t of terms) {
      if (meta.id.toLowerCase().includes(t)) {
        baseScore += 4
        reasons.push(`id 命中 "${t}"`)
      }
      if (meta.tags.some((x) => x.toLowerCase().includes(t))) {
        baseScore += 3
        reasons.push(`tags 命中 "${t}"`)
      }
      if (meta.scenes.some((x) => x.toLowerCase().includes(t))) {
        baseScore += 3
        reasons.push(`scenes 命中 "${t}"`)
      }
      if (meta.eventHints.some((x) => x.toLowerCase().includes(t))) {
        baseScore += 3
        reasons.push(`event_hints 命中 "${t}"`)
      }
      if (bodyLc.includes(t)) {
        baseScore += 1
        reasons.push(`正文命中 "${t}"`)
      }
    }
    const weight = Math.max(meta.weight, 0.01)
    const score = Number((baseScore * weight).toFixed(2))
    if (score > 0) {
      const snippets = extractBodySnippets(body, terms)
      hits.push({
        path: f.path,
        id: meta.id,
        score,
        baseScore,
        weight,
        sceneMatched,
        reasons: Array.from(new Set(reasons)).slice(0, 5),
        snippets,
      })
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 8)
}

