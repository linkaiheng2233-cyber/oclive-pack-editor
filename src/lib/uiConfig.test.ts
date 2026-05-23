import { describe, it, expect } from 'vitest'
import { parseUiConfigJson, serializeUiConfig } from './uiConfig'
import { defaultUiConfig } from '../types/uiConfig'

describe('uiConfig parse/serialize (T13)', () => {
  it('returns defaults for invalid json', () => {
    const cfg = parseUiConfigJson('{not json')
    expect(cfg.shell).toBe(defaultUiConfig().shell)
  })

  it('round-trips slot order and visible lists', () => {
    const raw = JSON.stringify({
      slots: {
        chat_toolbar: { order: ['a', 'b'], visible: ['a'] },
      },
    })
    const parsed = parseUiConfigJson(raw)
    expect(parsed.slots.chat_toolbar.order).toEqual(['a', 'b'])
    const disk = JSON.parse(serializeUiConfig(parsed))
    expect(disk.slots.chat_toolbar.order).toEqual(['a', 'b'])
  })
})
