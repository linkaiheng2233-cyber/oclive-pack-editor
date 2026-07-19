export const DEFAULT_MEMORY_SEED_JSON = `{
  "schema_version": 1,
  "memories": [],
  "extensions": {}
}\n`

const ROOT_KEYS = new Set(['schema_version', 'memories', 'extensions'])
const ENTRY_KEYS = new Set(['id', 'content', 'importance', 'scene_id'])
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024
const MAX_MEMORY_ENTRIES = 10_000
const MAX_MEMORY_CONTENT_CHARS = 4_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/** TypeScript mirror of `oclive_validation::parse_memory_seed` for browser checks. */
export function validateMemorySeedJson(raw: string): string[] {
  if (!raw.trim()) return []
  if (new TextEncoder().encode(raw).byteLength > MAX_DOCUMENT_BYTES) {
    return [`memory_seed.json 不得超过 ${MAX_DOCUMENT_BYTES} bytes`]
  }

  let root: unknown
  try {
    root = JSON.parse(raw)
  } catch (error) {
    return [`memory_seed.json 解析失败: ${error instanceof Error ? error.message : String(error)}`]
  }
  if (!isRecord(root)) return ['memory_seed.json 顶层须为对象']

  const errors: string[] = []
  for (const key of Object.keys(root)) {
    if (!ROOT_KEYS.has(key)) errors.push(`memory_seed.json 未知顶层键「${key}」`)
  }
  if (root.schema_version !== 1) errors.push('memory_seed.json schema_version 须为 1')
  if (root.extensions !== undefined && !isRecord(root.extensions)) {
    errors.push('memory_seed.json extensions 须为对象')
  }
  if (!Array.isArray(root.memories)) {
    errors.push('memory_seed.json memories 须为数组')
    return errors
  }
  if (root.memories.length > MAX_MEMORY_ENTRIES) {
    errors.push(`memory_seed：条目数不得超过 ${MAX_MEMORY_ENTRIES}`)
  }

  const ids = new Set<string>()
  for (const [index, value] of root.memories.entries()) {
    if (!isRecord(value)) {
      errors.push(`memory_seed：第 ${index + 1} 条须为对象`)
      continue
    }
    for (const key of Object.keys(value)) {
      if (!ENTRY_KEYS.has(key)) errors.push(`memory_seed：第 ${index + 1} 条含未知键「${key}」`)
    }
    const id = typeof value.id === 'string' ? value.id.trim() : ''
    if (!id) errors.push('memory_seed：id 不得为空')
    else if (ids.has(id)) errors.push(`memory_seed：重复 id「${id}」`)
    else ids.add(id)

    const content = typeof value.content === 'string' ? value.content.trim() : ''
    if (!content) errors.push(`memory_seed：条目「${id}」content 不得为空`)
    else if ([...content].length > MAX_MEMORY_CONTENT_CHARS) {
      errors.push(`memory_seed：条目「${id}」content 不得超过 ${MAX_MEMORY_CONTENT_CHARS} 字符`)
    }
    const importance = value.importance === undefined ? 0.5 : value.importance
    if (typeof importance !== 'number' || !Number.isFinite(importance) || importance < 0 || importance > 1) {
      errors.push(`memory_seed：条目「${id}」importance 须在 0..=1`)
    }
    if (value.scene_id !== undefined && typeof value.scene_id !== 'string') {
      errors.push(`memory_seed：条目「${id}」scene_id 须为字符串`)
    }
  }
  return errors
}
