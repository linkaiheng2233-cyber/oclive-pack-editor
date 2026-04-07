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
