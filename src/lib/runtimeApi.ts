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
): Promise<string> {
  const base = normalizeHttpBaseUrl(baseUrl)
  const sid = sessionId && sessionId.trim() ? sessionId.trim() : null
  if (isTauriRuntime()) {
    try {
      return await invoke<string>('runtime_api_chat', {
        base_url: base,
        role_path: rolePath,
        message,
        session_id: sid,
      })
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
      }),
      signal: ac.signal,
    })
    const text = await r.text()
    if (!r.ok) {
      throw new Error(formatRuntimeApiError(text || `HTTP ${r.status}`))
    }
    let j: unknown
    try {
      j = JSON.parse(text) as unknown
    } catch {
      throw new Error(`响应不是合法 JSON：${text.slice(0, 200)}`)
    }
    if (
      typeof j !== 'object' ||
      j === null ||
      !('reply' in j) ||
      typeof (j as { reply: unknown }).reply !== 'string'
    ) {
      throw new Error('响应缺少 reply 字符串字段')
    }
    return (j as { reply: string }).reply
  } catch (e) {
    if (
      (e instanceof DOMException || e instanceof Error) &&
      (e as Error).name === 'AbortError'
    ) {
      throw new Error(`请求超时（>${CHAT_FETCH_MS / 1000}s）`)
    }
    throw e
  } finally {
    clearTimeout(t)
  }
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
