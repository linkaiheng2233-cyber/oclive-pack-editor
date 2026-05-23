/**
 * 试聊 API 地址校验：仅允许 http(s)，降低误填 file://、javascript: 等导致的异常请求。
 */
export function normalizeHttpBaseUrl(base: string): string {
  const raw = base.trim()
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    throw new Error('API 根地址不是合法 URL')
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('API 根地址仅支持 http:// 或 https://')
  }
  return u.href.replace(/\/$/, '')
}

export type RuntimePersonalitySource = 'vector' | 'profile'

export interface RuntimeChatMeta {
  api_version?: number
  schema?: number
  presence_mode?: string
  relation_state?: string
  emotion?: Record<string, number>
  bot_emotion?: string
  portrait_emotion?: string
  favorability_delta?: number
  favorability_current?: number
  events?: { event_type: string; confidence: number }[]
  scene_id?: string
  offer_destination_picker?: boolean
  offer_together_travel?: boolean
  reply_is_fallback?: boolean
  knowledge_chunks_in_prompt?: number
  timestamp?: number
  personality_source?: RuntimePersonalitySource
}

export interface RuntimeChatResult {
  reply: string
  sessionId?: string | null
  meta?: RuntimeChatMeta
}

const CHAT_META_KEYS: (keyof RuntimeChatMeta)[] = [
  'api_version',
  'schema',
  'presence_mode',
  'relation_state',
  'emotion',
  'bot_emotion',
  'portrait_emotion',
  'favorability_delta',
  'favorability_current',
  'events',
  'scene_id',
  'offer_destination_picker',
  'offer_together_travel',
  'reply_is_fallback',
  'knowledge_chunks_in_prompt',
  'timestamp',
  'personality_source',
]

/** Parses oclive `--api` `/chat` JSON (subset aligned with SendMessageResponse). */
export function parseRuntimeChatJson(text: string): RuntimeChatResult {
  let j: unknown
  try {
    j = JSON.parse(text) as unknown
  } catch {
    throw new Error(`响应不是合法 JSON：${text.slice(0, 200)}`)
  }
  if (typeof j !== 'object' || j === null || !('reply' in j)) {
    throw new Error('响应缺少 reply 字段')
  }
  const reply = (j as { reply: unknown }).reply
  if (typeof reply !== 'string') {
    throw new Error('reply 须为字符串')
  }
  const o = j as Record<string, unknown>
  const sid = o.session_id
  const sessionId =
    sid === null || sid === undefined
      ? undefined
      : typeof sid === 'string'
        ? sid
        : undefined

  const meta: RuntimeChatMeta = {}
  let hasMeta = false
  for (const k of CHAT_META_KEYS) {
    if (k in o && o[k as string] !== undefined) {
      ;(meta as Record<string, unknown>)[k as string] = o[k as string]
      hasMeta = true
    }
  }
  return {
    reply,
    sessionId,
    meta: hasMeta ? meta : undefined,
  }
}
