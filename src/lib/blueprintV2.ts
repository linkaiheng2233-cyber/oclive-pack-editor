/**
 * v2 角色包 SSOT：`pipeline.ocblueprint`（与 oclivenewnew `oclive_validation` 迁移逻辑对齐）。
 */

export const PIPELINE_BLUEPRINT_FILENAME = 'pipeline.ocblueprint'
export const REPLY_QUALITY_ANCHOR_REL_PATH = 'prompts/reply_quality_anchor.md'

export type BlueprintIncludeEntry = {
  id?: string
  path: string
  target: string
  mode: 'merge' | 'replace' | string
}

export type BlueprintSlotGroupEntry = {
  label: string
  description?: string
  type: string
  members: string[]
}

export type BlueprintExpertOverlay = {
  routing_path?: string
  [key: string]: unknown
}

export type BlueprintV2 = {
  schema_version: 2
  meta: Record<string, unknown>
  slot_registry: Record<string, BlueprintSlotEntry>
  includes?: BlueprintIncludeEntry[]
  expert_overlay?: BlueprintExpertOverlay
  groups?: Record<string, BlueprintSlotGroupEntry>
  runtime_config?: Record<string, unknown>
}

const EDITOR_PRESERVED_BLUEPRINT_KEYS = [
  'meta',
  'slot_registry',
  'includes',
  'groups',
  'expert_overlay',
  'runtime_config',
] as const

const EDITOR_MANAGED_META_KEYS = [
  'id',
  'name',
  'version',
  'author',
  'description',
  'personality',
  'relations',
  'default_relation',
  'scenes',
  'evolution',
  'memory_config',
  'identity_binding',
  'dev_only',
  'knowledge',
  'ollama_model',
  'min_runtime_version',
  'life_trajectory',
  'life_schedule',
  'interaction_mode',
  'remote_presence',
  'autonomous_scene',
  'reply_quality_anchor',
  'featured',
  'preset_order',
  'creator_message_to_downloader',
] as const

export function pickEditorPreservedBlueprintFields(
  blueprint: BlueprintV2,
): Record<string, unknown> {
  const source = blueprint as unknown as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const key of EDITOR_PRESERVED_BLUEPRINT_KEYS) {
    if (source[key] !== undefined && source[key] !== null) result[key] = source[key]
  }
  return result
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Reapply fields the legacy-shaped editor does not model without discarding user edits.
 * Multi-instance slot registries retain every original instance; the first instance of each
 * editable type receives backend/plugin changes from the simple editor.
 */
export function mergeEditorPreservedBlueprintFields(
  blueprint: BlueprintV2,
  preserved?: Record<string, unknown>,
): BlueprintV2 {
  if (!preserved) return blueprint

  if (isRecord(preserved.meta)) {
    const mergedMeta: Record<string, unknown> = { ...preserved.meta }
    for (const key of EDITOR_MANAGED_META_KEYS) {
      const value = blueprint.meta[key]
      if (value === undefined || value === null) delete mergedMeta[key]
      else mergedMeta[key] = value
    }
    blueprint.meta = mergedMeta
  }

  if (isRecord(preserved.slot_registry)) {
    const original = preserved.slot_registry as Record<string, BlueprintSlotEntry>
    const merged: Record<string, BlueprintSlotEntry> = {}
    for (const [key, value] of Object.entries(original)) {
      if (isRecord(value)) merged[key] = { ...(value as BlueprintSlotEntry) }
    }
    for (const [generatedKey, generated] of Object.entries(blueprint.slot_registry)) {
      const target = Object.entries(merged).find(([, entry]) => entry.type === generated.type)
      if (!target) {
        merged[generatedKey] = generated
        continue
      }
      if (generated.type === 'complex_emotion') continue
      const [targetKey, current] = target
      merged[targetKey] = {
        ...current,
        backend: generated.backend,
        plugin: generated.plugin,
        local_memory_provider_id: generated.local_memory_provider_id,
      }
    }
    blueprint.slot_registry = merged
  }

  for (const key of ['includes', 'groups', 'expert_overlay', 'runtime_config'] as const) {
    const value = preserved[key]
    if (value !== undefined && value !== null) {
      ;(blueprint as unknown as Record<string, unknown>)[key] = value
    }
  }
  return blueprint
}

export type BlueprintSlotEntry = {
  type: string
  label: string
  backend: string
  position: number
  plugin?: string | null
  plugins?: string[] | null
  model?: string | null
  url?: string | null
  local_memory_provider_id?: string | null
}

type PluginBackendsShape = {
  memory?: string
  emotion?: string
  event?: string
  prompt?: string
  llm?: string
  agent?: string
  directory_plugins?: Record<string, string>
  local_memory_provider_id?: string
}

function backendSnake(v: unknown): string {
  if (typeof v === 'string' && v.trim()) return v.trim()
  return 'builtin'
}

export function pluginBackendsToSlotRegistry(
  pb: PluginBackendsShape,
): Record<string, BlueprintSlotEntry> {
  const dir = pb.directory_plugins ?? {}
  const entry = (
    slotType: string,
    backend: string,
    position: number,
  ): BlueprintSlotEntry => ({
    type: slotType,
    label: slotType,
    backend,
    position,
    plugin:
      slotType === 'memory'
        ? dir.memory ?? null
        : slotType === 'emotion'
          ? dir.emotion ?? null
          : slotType === 'event'
            ? dir.event ?? null
            : slotType === 'prompt'
              ? dir.prompt ?? null
              : slotType === 'llm'
                ? dir.llm ?? null
                : slotType === 'agent'
                  ? dir.agent ?? null
                  : null,
    plugins: null,
    model: null,
    url: null,
    local_memory_provider_id:
      slotType === 'memory' ? pb.local_memory_provider_id ?? null : null,
  })

  return {
    memory: entry('memory', backendSnake(pb.memory), 0),
    emotion: entry('emotion', backendSnake(pb.emotion), 0),
    complex_emotion: {
      type: 'complex_emotion',
      label: 'Complex emotion',
      backend: 'builtin',
      position: 1,
      plugin: null,
      plugins: null,
      model: null,
      url: null,
      local_memory_provider_id: null,
    },
    event: entry('event', backendSnake(pb.event), 0),
    prompt: entry('prompt', backendSnake(pb.prompt), 0),
    llm: entry('llm', backendSnake(pb.llm ?? 'ollama'), 0),
    agent: entry('agent', backendSnake(pb.agent), 0),
  }
}

function slotRegistryToPluginBackends(
  reg: Record<string, BlueprintSlotEntry>,
): PluginBackendsShape {
  const pick = (type: string): BlueprintSlotEntry | undefined =>
    Object.values(reg).find((e) => e.type === type)

  const dir: Record<string, string> = {}
  for (const [key, e] of Object.entries(reg)) {
    if (e.plugin?.trim()) {
      if (e.type === 'memory' && !dir.memory) dir.memory = e.plugin
      if (e.type === 'emotion' && !dir.emotion) dir.emotion = e.plugin
      if (e.type === 'event' && !dir.event) dir.event = e.plugin
      if (e.type === 'prompt' && !dir.prompt) dir.prompt = e.plugin
      if (e.type === 'llm' && !dir.llm) dir.llm = e.plugin
      if (e.type === 'agent' && !dir.agent) dir.agent = e.plugin
    }
    void key
  }

  const mem = pick('memory')
  return {
    memory: mem?.backend ?? 'builtin',
    emotion: pick('emotion')?.backend ?? 'builtin',
    event: pick('event')?.backend ?? 'builtin',
    prompt: pick('prompt')?.backend ?? 'builtin',
    llm: pick('llm')?.backend ?? 'ollama',
    agent: pick('agent')?.backend ?? 'builtin',
    directory_plugins: Object.keys(dir).length ? dir : undefined,
    local_memory_provider_id: mem?.local_memory_provider_id ?? undefined,
  }
}

/** 从 legacy manifest + settings 构建 v2 蓝图（内存中，不写盘）。 */
export function buildBlueprintV2FromLegacy(
  manifest: Record<string, unknown>,
  settings: Record<string, unknown>,
): BlueprintV2 {
  const mergedManifest = { ...manifest }
  const model = settings.model ?? settings.ollama_model
  if (settings.ollama_model != null) mergedManifest.ollama_model = settings.ollama_model
  else if (model != null) mergedManifest.ollama_model = model

  const personality = Array.isArray(manifest.default_personality)
    ? manifest.default_personality
    : manifest.personality

  const meta: Record<string, unknown> = {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    author: manifest.author,
    description: manifest.description,
    personality,
    relations: manifest.user_relations ?? manifest.relations,
    default_relation: manifest.default_relation,
    scenes: manifest.scenes,
    evolution: manifest.evolution ?? settings.evolution,
    memory_config: manifest.memory_config ?? settings.memory_config,
    identity_binding: settings.identity_binding ?? manifest.identity_binding,
    dev_only: manifest.dev_only,
    knowledge: manifest.knowledge ?? settings.knowledge,
  }

  if (mergedManifest.ollama_model != null && String(mergedManifest.ollama_model).trim()) {
    meta.ollama_model = mergedManifest.ollama_model
  }
  if (manifest.min_runtime_version != null) meta.min_runtime_version = manifest.min_runtime_version
  if (manifest.life_trajectory != null) meta.life_trajectory = manifest.life_trajectory
  if (manifest.life_schedule != null) meta.life_schedule = manifest.life_schedule
  if (settings.interaction_mode != null) meta.interaction_mode = settings.interaction_mode
  if (settings.remote_presence != null) meta.remote_presence = settings.remote_presence
  if (settings.autonomous_scene != null) meta.autonomous_scene = settings.autonomous_scene
  const anchor =
    typeof settings.reply_quality_anchor === 'string'
      ? String(settings.reply_quality_anchor).trim()
      : ''
  if (anchor) meta.reply_quality_anchor = anchor
  if (manifest.featured != null) meta.featured = manifest.featured
  if (manifest.preset_order != null) meta.preset_order = manifest.preset_order
  if (manifest.creator_message_to_downloader != null) {
    meta.creator_message_to_downloader = manifest.creator_message_to_downloader
  }

  const pb = (settings.plugin_backends ?? {}) as PluginBackendsShape
  if (settings.local_memory_provider_id && !pb.local_memory_provider_id) {
    pb.local_memory_provider_id = String(settings.local_memory_provider_id)
  }

  return {
    schema_version: 2,
    meta,
    slot_registry: pluginBackendsToSlotRegistry(pb),
  }
}

export function serializeBlueprintV2(bp: BlueprintV2): string {
  return `${JSON.stringify(bp, null, 2)}\n`
}

/** 将 v2 蓝图拆回编写器使用的 manifest/settings 形状（JSON 编辑器 / 表单）。 */
export function blueprintToLegacyParts(bp: BlueprintV2): {
  manifest: Record<string, unknown>
  settings: Record<string, unknown>
} {
  const meta = { ...bp.meta }
  const manifest: Record<string, unknown> = {
    id: meta.id,
    name: meta.name,
    version: meta.version,
    author: meta.author,
    description: meta.description,
    default_personality: meta.personality,
    user_relations: meta.relations,
    default_relation: meta.default_relation,
    scenes: meta.scenes,
    evolution: meta.evolution,
    memory_config: meta.memory_config,
    identity_binding: meta.identity_binding,
    dev_only: meta.dev_only,
    knowledge: meta.knowledge,
    life_trajectory: meta.life_trajectory,
    life_schedule: meta.life_schedule,
    min_runtime_version: meta.min_runtime_version,
    creator_message_to_downloader: meta.creator_message_to_downloader,
    featured: meta.featured,
    preset_order: meta.preset_order,
  }
  if (meta.ollama_model != null && String(meta.ollama_model).trim()) {
    manifest.ollama_model = meta.ollama_model
  }

  const plugin_backends = slotRegistryToPluginBackends(bp.slot_registry)
  const settings: Record<string, unknown> = {
    schema_version: 1,
    identity_binding: meta.identity_binding ?? 'per_scene',
    interaction_mode: meta.interaction_mode ?? 'immersive',
    evolution: meta.evolution,
    memory_config: meta.memory_config,
    remote_presence: meta.remote_presence,
    autonomous_scene: meta.autonomous_scene,
    plugin_backends,
  }
  if (typeof meta.reply_quality_anchor === 'string' && meta.reply_quality_anchor.trim()) {
    settings.reply_quality_anchor = meta.reply_quality_anchor
  }
  if (bp.runtime_config) {
    Object.assign(settings, bp.runtime_config)
  }
  return { manifest, settings }
}

export function parseBlueprintV2Json(raw: string): BlueprintV2 {
  const v = JSON.parse(raw) as BlueprintV2
  if (v.schema_version !== 2) {
    if (v.schema_version === 3) {
      throw new Error(
        '检测到 v3 / dual-core 蓝图；编写器当前仅支持 v2 编辑，请先在主程序完成 v3 集成配置。',
      )
    }
    throw new Error(`pipeline.ocblueprint schema_version 须为 2（当前 ${v.schema_version}）`)
  }
  if (!v.meta || typeof v.meta !== 'object') {
    throw new Error('pipeline.ocblueprint 缺少 meta')
  }
  if (!v.slot_registry || typeof v.slot_registry !== 'object') {
    throw new Error('pipeline.ocblueprint 缺少 slot_registry')
  }
  return v
}

/** v2 蓝图最小校验（编写器 TS 兜底；完整校验走 wasm / pack validate）。 */
export function validateBlueprintV2Typescript(bp: BlueprintV2, roleId?: string): string[] {
  const errors: string[] = []
  const id = String(bp.meta.id ?? '').trim()
  if (!id) errors.push('meta.id 不能为空')
  if (roleId && id && roleId.trim() !== id) {
    errors.push(`meta.id（${id}）与目录名（${roleId}）不一致`)
  }
  const llmSlots = Object.values(bp.slot_registry).filter((s) => s.type === 'llm')
  if (llmSlots.length === 0) errors.push('slot_registry 须至少包含一个 type: llm 实例')
  return errors
}

export function isLegacyRolePackLayout(paths: string[]): boolean {
  return paths.some((p) => /(^|\/)manifest\.json$/.test(p.replace(/\\/g, '/')))
}

export function isV2RolePackLayout(paths: string[]): boolean {
  return paths.some((p) =>
    p.replace(/\\/g, '/').endsWith(`/${PIPELINE_BLUEPRINT_FILENAME}`),
  )
}

/** 测试与示例 zip 用的最小 v2 蓝图 JSON 文本。 */
export function minimalBlueprintJsonForRole(roleId: string, name = 'H'): string {
  const bp = buildBlueprintV2FromLegacy(
    {
      id: roleId,
      name,
      scenes: ['home'],
      user_relations: { f: { favor_multiplier: 1, initial_favorability: 40 } },
      default_relation: 'f',
    },
    { schema_version: 1, plugin_backends: { llm: 'ollama' } },
  )
  return serializeBlueprintV2(bp)
}
