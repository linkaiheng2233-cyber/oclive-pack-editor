/**
 * Pack-editor subset of `.oclexpert` handling (aligned with oclivenewnew `src/lib/oclexpert.ts`).
 * Keeps the editor self-contained without importing the main app.
 */

export const OCLEXPERT_FORMAT = 'oclexpert' as const
export const OCLEXPERT_FILE_VERSION = 1 as const

const ALLOWED_NODE_TYPES = new Set([
  'base_model',
  'lora_adapter',
  'prompt_style',
  'cloud_model',
  'event_trigger',
])

export class OclexpertPackError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OclexpertPackError'
  }
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

export function validateExpertGraphNodes(graph: { nodes?: unknown[] }): void {
  const nodes = graph.nodes ?? []
  for (let i = 0; i < nodes.length; i += 1) {
    const n = nodes[i] as { type?: string }
    const t = String(n?.type ?? '').trim()
    if (!t || !ALLOWED_NODE_TYPES.has(t)) {
      throw new OclexpertPackError(
        `Invalid or unknown expert node type at index ${i}: ${t || '(missing)'}`,
      )
    }
  }
}

export type ParsedOclexpertPack = {
  graph: Record<string, unknown>
  promptStyle: Record<string, unknown> | null
  suggestedName?: string
}

export function parseOclexpertPackJson(raw: string): ParsedOclexpertPack {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new OclexpertPackError('File is not valid JSON.')
  }
  if (!isRecord(data)) {
    throw new OclexpertPackError('Root JSON must be an object.')
  }

  if (data.format === OCLEXPERT_FORMAT) {
    const fv = data.fileVersion
    if (fv !== 1) {
      throw new OclexpertPackError(
        `Unsupported .oclexpert fileVersion: ${String(fv)} (this tool supports version 1).`,
      )
    }
    const graph = data.graph as { nodes?: unknown[] } | undefined
    if (!graph || !Array.isArray(graph.nodes)) {
      throw new OclexpertPackError('Missing graph.nodes in .oclexpert file.')
    }
    validateExpertGraphNodes(graph)
    const name = typeof data.name === 'string' ? data.name.trim() : ''
    const ps = data.promptStyle
    const promptStyle =
      ps && typeof ps === 'object' && !Array.isArray(ps)
        ? (ps as Record<string, unknown>)
        : null
    return {
      graph: JSON.parse(JSON.stringify(graph)) as Record<string, unknown>,
      promptStyle,
      suggestedName: name || undefined,
    }
  }

  if (Array.isArray(data.nodes)) {
    validateExpertGraphNodes(data as { nodes?: unknown[] })
    return {
      graph: JSON.parse(JSON.stringify(data)) as Record<string, unknown>,
      promptStyle: null,
    }
  }

  throw new OclexpertPackError(
    'Unrecognized file: expected format "oclexpert" or a bare ExpertGraph with nodes[].',
  )
}

export function buildOclexpertFileV1(
  graph: Record<string, unknown>,
  promptStyle: Record<string, unknown> | null | undefined,
  name?: string,
): Record<string, unknown> {
  return {
    format: OCLEXPERT_FORMAT,
    fileVersion: OCLEXPERT_FILE_VERSION,
    ...(name?.trim() ? { name: name.trim() } : {}),
    graph: JSON.parse(JSON.stringify(graph)) as Record<string, unknown>,
    promptStyle: promptStyle ? { ...promptStyle } : null,
  }
}

export function defaultOclexpertJsonForPack(roleLabel: string): string {
  const label = roleLabel.trim() || 'role pack'
  const body = buildOclexpertFileV1({ version: 1, nodes: [], edges: [] }, null, `${label} · default`)
  return `${JSON.stringify(body, null, 2)}\n`
}

/** Pretty-printed `.oclexpert` body for `roles/{id}/expert/default.oclexpert`, or `null` if invalid. */
export function normalizeOclexpertForDisk(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  try {
    const parsed = parseOclexpertPackJson(t)
    const wrapped = buildOclexpertFileV1(
      parsed.graph,
      parsed.promptStyle,
      parsed.suggestedName,
    )
    return `${JSON.stringify(wrapped, null, 2)}\n`
  } catch {
    return null
  }
}

export type OclexpertSummary = {
  ok: boolean
  error?: string
  fileName?: string
  nodeCounts: Record<string, number>
  edgeCount: number
  cloudHint?: string
}

function countNodeTypes(graph: Record<string, unknown>): Record<string, number> {
  const nodes = (graph.nodes as unknown[] | undefined) ?? []
  const counts: Record<string, number> = {}
  for (const n of nodes) {
    if (!n || typeof n !== 'object' || Array.isArray(n)) continue
    const t = String((n as { type?: string }).type ?? '').trim() || '(unknown)'
    counts[t] = (counts[t] ?? 0) + 1
  }
  return counts
}

function firstCloudHint(graph: Record<string, unknown>): string | undefined {
  const nodes = (graph.nodes as unknown[] | undefined) ?? []
  for (const n of nodes) {
    if (!n || typeof n !== 'object' || Array.isArray(n)) continue
    const o = n as Record<string, unknown>
    if (o.type !== 'cloud_model') continue
    const preset = typeof o.preset === 'string' ? o.preset.trim() : ''
    const model = typeof o.model === 'string' ? o.model.trim() : ''
    const parts = [preset, model].filter(Boolean)
    if (parts.length) return parts.join(' · ')
  }
  return undefined
}

/** Non-empty invalid JSON → error message; valid or empty → `null`. */
export function expertPackValidationError(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  try {
    parseOclexpertPackJson(t)
    return null
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}

export function summarizeOclexpertEditorJson(raw: string): OclexpertSummary {
  const t = raw.trim()
  if (!t) {
    return { ok: true, nodeCounts: {}, edgeCount: 0 }
  }
  try {
    const parsed = parseOclexpertPackJson(t)
    const edges = (parsed.graph.edges as unknown[] | undefined) ?? []
    return {
      ok: true,
      fileName: parsed.suggestedName,
      nodeCounts: countNodeTypes(parsed.graph),
      edgeCount: Array.isArray(edges) ? edges.length : 0,
      cloudHint: firstCloudHint(parsed.graph),
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      nodeCounts: {},
      edgeCount: 0,
    }
  }
}
