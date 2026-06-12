import { describe, expect, it } from 'vitest'
import {
  buildExtraEntryFromUserChoices,
  inferExtraEntryUserChoices,
  uniqueExtraEntryId,
} from './portraitExtraUser'

describe('portraitExtraUser', () => {
  it('builds human-readable desc from three choices', () => {
    const entry = buildExtraEntryFromUserChoices(
      {
        clusterMode: 'builtin',
        clusterTag: 'happy',
        customClusterLabel: '',
        intensity: 'mild',
      },
      [],
      new File(['x'], 'smile.webp', { type: 'image/webp' }),
    )
    expect(entry.id).toBe('happy_mild')
    expect(entry.desc).toContain('开心')
    expect(entry.desc).toContain('轻微')
    expect(entry.cluster).toBe('happy')
    expect(entry.path).toBe('assets/images/smile.webp')
  })

  it('dedupes ids when same cluster and intensity', () => {
    expect(uniqueExtraEntryId('happy', 'mild', new Set(['happy_mild']))).toBe('happy_mild_2')
  })

  it('stays in custom mode when user picks custom before naming', () => {
    const built = buildExtraEntryFromUserChoices(
      {
        clusterMode: 'custom',
        clusterTag: 'custom',
        customClusterLabel: '',
        intensity: 'mild',
      },
      [],
    )
    expect(built.cluster).toBe('custom')
    const inferred = inferExtraEntryUserChoices(built)
    expect(inferred.clusterMode).toBe('custom')
    expect(inferred.customClusterLabel).toBe('')
  })

  it('roundtrips custom cluster through infer', () => {
    const built = buildExtraEntryFromUserChoices(
      {
        clusterMode: 'custom',
        clusterTag: '',
        customClusterLabel: '紧张',
        intensity: 'severe',
      },
      [],
    )
    const inferred = inferExtraEntryUserChoices(built)
    expect(inferred.clusterMode).toBe('custom')
    expect(inferred.customClusterLabel).toBe('紧张')
    expect(inferred.intensity).toBe('severe')
  })

  it('infers builtin cluster from loaded entry', () => {
    const inferred = inferExtraEntryUserChoices({
      id: 'happy_alt',
      path: 'assets/images/happy_alt.webp',
      desc: '开心，轻微程度，对话时按此选用',
      tags: ['happy'],
      kind: 'image',
      cluster: 'happy',
    })
    expect(inferred.clusterMode).toBe('builtin')
    expect(inferred.clusterTag).toBe('happy')
    expect(inferred.intensity).toBe('mild')
  })
})
