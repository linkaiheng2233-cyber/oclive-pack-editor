import { describe, expect, it } from 'vitest'
import { buildKnowledgeMarkdown } from './knowledgeFrontMatter'
import { previewKnowledgeHits } from './knowledgeHitPreview'

describe('previewKnowledgeHits', () => {
  it('ranks hits by metadata and weight', () => {
    const files = [
      {
        path: 'knowledge/a.md',
        content: buildKnowledgeMarkdown(
          {
            id: 'city_transport',
            tags: ['city', 'traffic'],
            scenes: ['street'],
            eventHints: ['arrive_station'],
            weight: 2,
          },
          'city subway and buses',
        ),
      },
      {
        path: 'knowledge/b.md',
        content: buildKnowledgeMarkdown(
          {
            id: 'forest',
            tags: ['nature'],
            scenes: ['woods'],
            eventHints: [],
            weight: 1,
          },
          'city is far away',
        ),
      },
    ]
    const hits = previewKnowledgeHits(files, 'city arrive')
    expect(hits[0]?.path).toBe('knowledge/a.md')
    expect(hits[0]?.reasons.some((x) => x.includes('event_hints'))).toBe(true)
    expect(hits[0]?.baseScore).toBeGreaterThan(0)
    expect(hits[0]?.weight).toBe(2)
    expect(hits[0]?.snippets.length).toBeGreaterThanOrEqual(1)
  })

  it('supports strict scene filtering', () => {
    const files = [
      {
        path: 'knowledge/a.md',
        content: buildKnowledgeMarkdown(
          {
            id: 'city_transport',
            tags: ['city'],
            scenes: ['station'],
            eventHints: [],
            weight: 1,
          },
          'subway',
        ),
      },
      {
        path: 'knowledge/b.md',
        content: buildKnowledgeMarkdown(
          {
            id: 'city_food',
            tags: ['city'],
            scenes: ['market'],
            eventHints: [],
            weight: 1,
          },
          'street food',
        ),
      },
    ]
    const loose = previewKnowledgeHits(files, 'city', { sceneId: 'station', strictScene: false })
    const strict = previewKnowledgeHits(files, 'city', { sceneId: 'station', strictScene: true })
    expect(loose.length).toBeGreaterThan(strict.length)
    expect(strict.every((x) => x.sceneMatched)).toBe(true)
  })
})

