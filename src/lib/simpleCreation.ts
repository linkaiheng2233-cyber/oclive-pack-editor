/**
 * 简单创作：表单字段写入 manifest/settings JSON，创作者无需直接编辑代码。
 * 未知字段在合并时保留；简单模式仅维护「一个用户身份」槽（多身份请用高级创作）。
 */

export const PERSONALITY_KEYS = [
  'stubbornness',
  'clinginess',
  'sensitivity',
  'assertiveness',
  'forgiveness',
  'talkativeness',
  'warmth',
] as const

export const PERSONALITY_LABELS_ZH: Record<(typeof PERSONALITY_KEYS)[number], string> = {
  stubbornness: '倔强',
  clinginess: '黏人',
  sensitivity: '敏感',
  assertiveness: '强势',
  forgiveness: '宽容',
  talkativeness: '话多',
  warmth: '温暖',
}

export type PluginBackendOpt = 'builtin' | 'builtin_v2' | 'remote'
export type LlmBackendOpt = 'ollama' | 'remote'

export type SimpleManifestForm = {
  id: string
  name: string
  version: string
  author: string
  description: string
  /** 最低 oclive 版本（semver，如 0.2.0）；空字符串表示不写 manifest.min_runtime_version */
  minRuntimeVersion: string
  /** 逗号分隔，如 home, school */
  scenesCsv: string
  defaultPersonality: number[]
  relationKey: string
  relationDisplayName: string
  relationPromptHint: string
  relationInitialFavorability: number
  relationFavorMultiplier: number
}

export type SimpleSettingsForm = {
  schemaVersion: number
  model: string
  eventImpactFactor: number
  identityBinding: 'global' | 'per_scene'
  interactionMode: 'immersive' | 'pure_chat'
  remoteDefaultEnabled: boolean
  sceneWeightMultiplier: number
  pluginMemory: PluginBackendOpt
  pluginEmotion: PluginBackendOpt
  pluginEvent: PluginBackendOpt
  pluginPrompt: PluginBackendOpt
  pluginLlm: LlmBackendOpt
}

const DEFAULT_PERSONALITY = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]

export function defaultSimpleManifestForm(): SimpleManifestForm {
  return {
    id: 'my_role_id',
    name: '示例角色',
    version: '1.0.0',
    author: '',
    description: '一句话简介',
    minRuntimeVersion: '',
    scenesCsv: 'home',
    defaultPersonality: [...DEFAULT_PERSONALITY],
    relationKey: 'friend',
    relationDisplayName: '好友',
    relationPromptHint: '你们是好朋友',
    relationInitialFavorability: 50,
    relationFavorMultiplier: 1,
  }
}

export function defaultSimpleSettingsForm(): SimpleSettingsForm {
  return {
    schemaVersion: 1,
    model: 'qwen2.5:7b',
    eventImpactFactor: 1,
    identityBinding: 'per_scene',
    interactionMode: 'immersive',
    remoteDefaultEnabled: false,
    sceneWeightMultiplier: 1.2,
    pluginMemory: 'builtin',
    pluginEmotion: 'builtin',
    pluginEvent: 'builtin',
    pluginPrompt: 'builtin',
    pluginLlm: 'ollama',
  }
}

function clampPersonality(v: number[]): number[] {
  return PERSONALITY_KEYS.map((_, i) => {
    const x = v[i]
    if (!Number.isFinite(x)) return 0.5
    return Math.max(0, Math.min(1, x))
  })
}

/** 从已解析的 manifest 提取简单表单（多身份时以 default_relation 为主，否则取第一个键） */
export function manifestRecordToSimpleForm(m: Record<string, unknown>): SimpleManifestForm {
  const rels = (m.user_relations ?? {}) as Record<string, Record<string, unknown>>
  const keys = Object.keys(rels).filter((k) => k.trim())
  const dr = String(m.default_relation ?? '').trim()
  const primaryKey =
    dr && keys.includes(dr) ? dr : keys.length ? keys[0]! : 'friend'
  const ur = rels[primaryKey] ?? {}
  const dp = Array.isArray(m.default_personality)
    ? clampPersonality(m.default_personality as number[])
    : [...DEFAULT_PERSONALITY]
  const scenes = Array.isArray(m.scenes) ? (m.scenes as string[]).map((s) => String(s).trim()).filter(Boolean) : ['home']

  return {
    id: String(m.id ?? '').trim() || 'my_role_id',
    name: String(m.name ?? '').trim() || '示例角色',
    version: String(m.version ?? '').trim() || '1.0.0',
    author: String(m.author ?? ''),
    description: String(m.description ?? ''),
    minRuntimeVersion:
      typeof m.min_runtime_version === 'string' ? String(m.min_runtime_version).trim() : '',
    scenesCsv: scenes.join(', '),
    defaultPersonality: dp,
    relationKey: primaryKey || 'friend',
    relationDisplayName: String(ur.display_name ?? '好友'),
    relationPromptHint: String(ur.prompt_hint ?? ''),
    relationInitialFavorability: Number.isFinite(ur.initial_favorability as number)
      ? Math.max(0, Math.min(100, Number(ur.initial_favorability)))
      : 50,
    relationFavorMultiplier: Number.isFinite(ur.favor_multiplier as number)
      ? Math.max(0.01, Number(ur.favor_multiplier))
      : 1,
  }
}

export function settingsRecordToSimpleForm(s: Record<string, unknown>): SimpleSettingsForm {
  const evo = (s.evolution ?? {}) as Record<string, unknown>
  const mem = (s.memory_config ?? {}) as Record<string, unknown>
  const rp = (s.remote_presence ?? {}) as Record<string, unknown>
  const pb = (s.plugin_backends ?? {}) as Record<string, unknown>

  const eif = Number(evo.event_impact_factor)
  const swm = Number(mem.scene_weight_multiplier)

  return {
    schemaVersion: Number.isFinite(s.schema_version as number) ? Number(s.schema_version) : 1,
    model: String(s.model ?? 'qwen2.5:7b'),
    eventImpactFactor: Number.isFinite(eif) ? Math.max(0.05, Math.min(5, eif)) : 1,
    identityBinding: s.identity_binding === 'global' ? 'global' : 'per_scene',
    interactionMode: s.interaction_mode === 'pure_chat' ? 'pure_chat' : 'immersive',
    remoteDefaultEnabled: Boolean(rp.default_enabled),
    sceneWeightMultiplier: Number.isFinite(swm) ? Math.max(0.1, swm) : 1.2,
    pluginMemory: (pb.memory as PluginBackendOpt) === 'builtin_v2' || (pb.memory as PluginBackendOpt) === 'remote' ? (pb.memory as PluginBackendOpt) : 'builtin',
    pluginEmotion: (pb.emotion as PluginBackendOpt) === 'builtin_v2' || (pb.emotion as PluginBackendOpt) === 'remote' ? (pb.emotion as PluginBackendOpt) : 'builtin',
    pluginEvent: (pb.event as PluginBackendOpt) === 'builtin_v2' || (pb.event as PluginBackendOpt) === 'remote' ? (pb.event as PluginBackendOpt) : 'builtin',
    pluginPrompt: (pb.prompt as PluginBackendOpt) === 'builtin_v2' || (pb.prompt as PluginBackendOpt) === 'remote' ? (pb.prompt as PluginBackendOpt) : 'builtin',
    pluginLlm: pb.llm === 'remote' ? 'remote' : 'ollama',
  }
}

/** 将简单表单合并进现有 manifest JSON 字符串，保留其他键。简单模式将 user_relations 重写为单键。 */
export function applySimpleManifestToJson(currentJson: string, form: SimpleManifestForm): string {
  let base: Record<string, unknown>
  try {
    base = JSON.parse(currentJson) as Record<string, unknown>
  } catch {
    base = {}
  }

  const scenes = form.scenesCsv
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (scenes.length === 0) scenes.push('home')

  const key = form.relationKey.trim() || 'friend'

  base.id = form.id.trim()
  base.name = form.name.trim()
  base.version = form.version.trim()
  base.author = form.author.trim()
  base.description = form.description.trim()
  const minRt = form.minRuntimeVersion.trim()
  if (minRt) {
    base.min_runtime_version = minRt
  } else {
    delete base.min_runtime_version
  }
  base.scenes = scenes
  base.default_personality = clampPersonality(form.defaultPersonality)
  base.default_relation = key
  base.user_relations = {
    [key]: {
      display_name: form.relationDisplayName.trim() || key,
      prompt_hint: form.relationPromptHint.trim(),
      favor_multiplier: form.relationFavorMultiplier,
      initial_favorability: form.relationInitialFavorability,
    },
  }

  return JSON.stringify(base, null, 2) + '\n'
}

export function applySimpleSettingsToJson(currentJson: string, form: SimpleSettingsForm): string {
  let base: Record<string, unknown>
  try {
    base = JSON.parse(currentJson) as Record<string, unknown>
  } catch {
    base = {}
  }

  base.schema_version = form.schemaVersion
  base.model = form.model.trim()
  base.identity_binding = form.identityBinding
  base.interaction_mode = form.interactionMode
  const evoPrev =
    base.evolution && typeof base.evolution === 'object'
      ? (base.evolution as Record<string, unknown>)
      : {}
  base.evolution = {
    ...evoPrev,
    event_impact_factor: form.eventImpactFactor,
    ai_analysis_interval: Number(evoPrev.ai_analysis_interval) || 15,
    max_change_per_event: Number(evoPrev.max_change_per_event) || 0.05,
    max_total_change: Number(evoPrev.max_total_change) || 0.5,
  }
  const memPrev =
    base.memory_config && typeof base.memory_config === 'object'
      ? (base.memory_config as Record<string, unknown>)
      : {}
  base.memory_config = {
    ...memPrev,
    scene_weight_multiplier: form.sceneWeightMultiplier,
  }
  base.remote_presence = {
    ...((base.remote_presence as object) ?? {}),
    default_enabled: form.remoteDefaultEnabled,
  }
  base.plugin_backends = {
    memory: form.pluginMemory,
    emotion: form.pluginEmotion,
    event: form.pluginEvent,
    prompt: form.pluginPrompt,
    llm: form.pluginLlm,
  }

  return JSON.stringify(base, null, 2) + '\n'
}

/** 当前 manifest 是否包含多个用户身份（简单模式会覆盖为单身份） */
export function countUserRelationKeys(manifestJson: string): number {
  try {
    const m = JSON.parse(manifestJson) as { user_relations?: Record<string, unknown> }
    return Object.keys(m.user_relations ?? {}).length
  } catch {
    return 0
  }
}
