import { describe, expect, it } from 'vitest'
import { buildKnowledgeMarkdown, parseKnowledgeMarkdown, validateKnowledgeFiles } from './knowledgeFrontMatter'

describe('knowledgeFrontMatter', () => {
  it('parses and rebuilds metadata', () => {
    const src = `---\nid: lore_city\ntags: ["a", "b"]\nscenes: ["home"]\nevent_hints: ["arrive", "leave"]\nweight: 1.5\n---\n\n正文`
    const p = parseKnowledgeMarkdown(src)
    expect(p.meta.id).toBe('lore_city')
    expect(p.meta.tags).toEqual(['a', 'b'])
    expect(p.meta.eventHints).toEqual(['arrive', 'leave'])
    const out = buildKnowledgeMarkdown(p.meta, p.body)
    expect(out).toContain('id: lore_city')
    expect(out).toContain('event_hints: ["arrive", "leave"]')
    expect(out).toContain('weight: 1.5')
  })

  it('validates duplicate ids', () => {
    const files = [
      {
        path: 'knowledge/a.md',
        content: buildKnowledgeMarkdown(
          { id: 'x', tags: [], scenes: [], eventHints: [], weight: 1 },
          '1',
        ),
      },
      {
        path: 'knowledge/b.md',
        content: buildKnowledgeMarkdown(
          { id: 'x', tags: [], scenes: [], eventHints: [], weight: 1 },
          '2',
        ),
      },
    ]
    const errs = validateKnowledgeFiles(files)
    expect(errs.some((e) => e.includes('重复'))).toBe(true)
  })
})

