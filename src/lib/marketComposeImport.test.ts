import { describe, expect, it } from 'vitest'
import { mergeMarketComposeIntoEditor, parseMarketComposeV1 } from './marketComposeImport'

describe('parseMarketComposeV1', () => {
  it('accepts valid payload', () => {
    const raw = JSON.stringify({
      version: 1,
      source: 'oclive-plugin-market',
      assembled: { scene: 'S', persona: 'P', identity: 'I', world: 'W', schedule: 'D' },
    })
    const r = parseMarketComposeV1(raw)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.assembled.persona).toBe('P')
  })

  it('rejects bad json', () => {
    const r = parseMarketComposeV1('not json')
    expect(r.ok).toBe(false)
  })
})

describe('mergeMarketComposeIntoEditor', () => {
  it('appends blocks', () => {
    const next = mergeMarketComposeIntoEditor(
      {
        version: 1,
        source: 'oclive-plugin-market',
        assembled: {
          scene: '雨夜',
          persona: '寡言',
          identity: '旧友',
          world: '架空城',
          schedule: '夜班',
        },
      },
      { corePersonalityText: 'base', worldviewMarkdown: 'w0', relationPromptHint: 'h0' },
    )
    expect(next.corePersonalityText).toContain('【场景】')
    expect(next.corePersonalityText).toContain('雨夜')
    expect(next.worldviewMarkdown).toContain('架空城')
    expect(next.relationPromptHint).toContain('旧友')
  })
})
