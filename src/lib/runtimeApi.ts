/**
 * 调用本机 oclive HTTP API（`--api`）。桌面版走 Tauri `reqwest`；浏览器开发态用 `fetch`（需 oclive 已配置 CORS）。
 */

import { invoke } from '@tauri-apps/api/tauri'
import { isTauriRuntime } from './exportFolder'
import { normalizeHttpBaseUrl } from './runtimeApiHelpers'

/** 桌面版：探测 host:port 是否有 TCP 监听（短超时）。浏览器始终返回 `false`。 */
export async function runtimeTcpListening(host: string, port: number): Promise<boolean> {
  if (!isTauriRuntime()) return false
  return invoke<boolean>('runtime_tcp_listening', {
    host: host.trim() || '127.0.0.1',
    port,
  })
}

const HEALTH_FETCH_MS = 12_000
const CHAT_FETCH_MS = 300_000
const FEEDBACK_FETCH_MS = 20_000

/** 与 oclive `SendMessageResponse` 对齐的子集（HTTP 试聊 JSON），并含 `--api` 回包顶层的 `personality_source`。字段均可能缺失以兼容旧运行时。 */
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
  /** `evolution.personality_source`；较新 oclive `--api` 在每条 `/chat` 响应中附带 */
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

function parseRuntimeChatJson(text: string): RuntimeChatResult {
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

function formatRuntimeApiError(raw: string): string {
  const text = raw.trim()
  if (!text) return '运行时返回空错误信息'
  try {
    const parsed = JSON.parse(text) as unknown
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'error' in parsed &&
      typeof (parsed as { error: unknown }).error === 'object' &&
      (parsed as { error: unknown }).error !== null
    ) {
      const e = (parsed as { error: { code?: unknown; message?: unknown; hint?: unknown } }).error
      const code = typeof e.code === 'string' ? e.code : 'unknown_error'
      const message = typeof e.message === 'string' ? e.message : '运行时请求失败'
      const hint = typeof e.hint === 'string' ? e.hint : ''
      return hint ? `[${code}] ${message}（建议：${hint}）` : `[${code}] ${message}`
    }
  } catch {
    /* not json */
  }
  return text
}

export async function fetchRuntimeHealth(baseUrl: string): Promise<string> {
  const base = normalizeHttpBaseUrl(baseUrl)
  if (isTauriRuntime()) {
    try {
      return await invoke<string>('runtime_api_health', { base_url: base })
    } catch (e) {
      const text = e instanceof Error ? e.message : String(e)
      throw new Error(formatRuntimeApiError(text))
    }
  }
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), HEALTH_FETCH_MS)
  try {
    const r = await fetch(`${base}/health`, { signal: ac.signal })
    if (!r.ok) {
      throw new Error(`HTTP ${r.status}`)
    }
    return r.text()
  } catch (e) {
    if (
      (e instanceof DOMException || e instanceof Error) &&
      (e as Error).name === 'AbortError'
    ) {
      throw new Error(`检测请求超时（>${HEALTH_FETCH_MS / 1000}s）`)
    }
    if (e instanceof TypeError) {
      throw new Error(
        `无法连接 ${base}/health（${e.message}）。请确认 oclive 已用 --api 启动且端口与上方一致；浏览器试聊需本机 CORS 已放行。`,
      )
    }
    throw e
  } finally {
    clearTimeout(t)
  }
}

export async function fetchRuntimeChat(
  baseUrl: string,
  rolePath: string,
  message: string,
  sessionId?: string | null,
  sceneId?: string | null,
): Promise<RuntimeChatResult> {
  const base = normalizeHttpBaseUrl(baseUrl)
  const sid = sessionId && sessionId.trim() ? sessionId.trim() : null
  const scid = sceneId && sceneId.trim() ? sceneId.trim() : null
  if (isTauriRuntime()) {
    try {
      const text = await invoke<string>('runtime_api_chat', {
        base_url: base,
        role_path: rolePath,
        message,
        session_id: sid,
        scene_id: scid,
      })
      return parseRuntimeChatJson(text)
    } catch (e) {
      const text = e instanceof Error ? e.message : String(e)
      throw new Error(formatRuntimeApiError(text))
    }
  }
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), CHAT_FETCH_MS)
  try {
    const r = await fetch(`${base}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role_path: rolePath,
        message,
        session_id: sid,
        scene_id: scid,
      }),
      signal: ac.signal,
    })
    const text = await r.text()
    if (!r.ok) {
      throw new Error(formatRuntimeApiError(text || `HTTP ${r.status}`))
    }
    return parseRuntimeChatJson(text)
  } catch (e) {
    if (
      (e instanceof DOMException || e instanceof Error) &&
      (e as Error).name === 'AbortError'
    ) {
      throw new Error(`请求超时（>${CHAT_FETCH_MS / 1000}s）`)
    }
    if (e instanceof TypeError) {
      throw new Error(
        `无法连接 ${base}/chat（${e.message}）。请确认 oclive 已用 --api 启动、角色路径正确；浏览器试聊需访问 127.0.0.1 且 CORS 可用。`,
      )
    }
    throw e
  } finally {
    clearTimeout(t)
  }
}

export interface RuntimeRoleFeedbackItem {
  id: number
  role_id: string
  session_id?: string | null
  mood_tag?: string | null
  message: string
  created_at: string
}

export interface RuntimeRoleFeedbackList {
  items: RuntimeRoleFeedbackItem[]
}

function parseRoleFeedbackListJson(text: string): RuntimeRoleFeedbackList {
  let j: unknown
  try {
    j = JSON.parse(text) as unknown
  } catch {
    throw new Error(`响应不是合法 JSON：${text.slice(0, 200)}`)
  }
  if (typeof j !== 'object' || j === null || !('items' in j)) {
    throw new Error('响应缺少 items 字段')
  }
  const items = (j as { items: unknown }).items
  if (!Array.isArray(items)) {
    throw new Error('items 须为数组')
  }
  return { items: items as RuntimeRoleFeedbackItem[] }
}

export async function fetchRuntimeRoleFeedback(
  baseUrl: string,
  roleId: string,
  limit = 50,
  offset = 0,
): Promise<RuntimeRoleFeedbackItem[]> {
  const base = normalizeHttpBaseUrl(baseUrl)
  const rid = roleId.trim()
  if (!rid) return []
  const lim = Math.min(200, Math.max(1, Math.floor(Number(limit) || 50)))
  const off = Math.max(0, Math.floor(Number(offset) || 0))

  const url = `${base}/role-feedback?role_id=${encodeURIComponent(rid)}&limit=${lim}&offset=${off}`
  if (isTauriRuntime()) {
    // 桌面版编写器仍走 fetch：API 仅绑定 127.0.0.1，不涉及跨域；也便于复用同一解析逻辑
  }
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FEEDBACK_FETCH_MS)
  try {
    const r = await fetch(url, { signal: ac.signal })
    const text = await r.text()
    if (!r.ok) {
      throw new Error(formatRuntimeApiError(text || `HTTP ${r.status}`))
    }
    return parseRoleFeedbackListJson(text).items
  } catch (e) {
    if (
      (e instanceof DOMException || e instanceof Error) &&
      (e as Error).name === 'AbortError'
    ) {
      throw new Error(`请求超时（>${FEEDBACK_FETCH_MS / 1000}s）`)
    }
    if (e instanceof TypeError) {
      throw new Error(`无法连接 ${base}/role-feedback（${e.message}）。请确认 oclive 已用 --api 启动。`)
    }
    throw e
  } finally {
    clearTimeout(t)
  }
}

/** 桌面版：读取角色目录 `manifest.json` 的 `scenes`；浏览器始终解析失败（可静默用空列表）。 */
export async function readRoleManifestScenes(roleDir: string): Promise<string[]> {
  if (!isTauriRuntime()) return []
  const dir = roleDir.trim()
  if (!dir) return []
  return invoke<string[]>('read_role_manifest_scenes', { role_dir: dir })
}

export async function spawnOcliveApi(
  exePath: string,
  port: number,
  host = '127.0.0.1',
): Promise<void> {
  if (!isTauriRuntime()) {
    throw new Error('自动启动仅支持桌面版编写器')
  }
  const p = Math.min(65535, Math.max(1, Math.floor(Number(port))))
  await invoke('spawn_oclive_api', {
    exe_path: exePath,
    port: p,
    host: host.trim() || '127.0.0.1',
  })
}
