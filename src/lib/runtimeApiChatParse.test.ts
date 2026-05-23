import { describe, expect, it } from 'vitest'
import { parseRuntimeChatJson } from './runtimeApiHelpers'

describe('parseRuntimeChatJson (T05 runtime API mapping)', () => {
  it('maps reply and session_id from chat JSON', () => {
    const res = parseRuntimeChatJson(
      JSON.stringify({ reply: 'hi', session_id: 'sess-1', bot_emotion: 'neutral' }),
    )
    expect(res.reply).toBe('hi')
    expect(res.sessionId).toBe('sess-1')
    expect(res.meta?.bot_emotion).toBe('neutral')
  })

  it('rejects missing reply', () => {
    expect(() => parseRuntimeChatJson('{}')).toThrow(/reply/)
  })

  it('rejects invalid JSON', () => {
    expect(() => parseRuntimeChatJson('not-json')).toThrow(/JSON/)
  })
})
