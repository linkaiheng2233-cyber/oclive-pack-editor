import { describe, it, expect } from 'vitest'
import { emptyAuthorRecRow, parseAuthorImport, buildAuthorJsonDisk } from './authorPack'
import { defaultUiConfig } from '../types/uiConfig'

describe('authorPack helpers (T13)', () => {
  it('parseAuthorImport returns null for empty string', () => {
    expect(parseAuthorImport('   ')).toBeNull()
  })

  it('parseAuthorImport extracts recommended plugin rows', () => {
    const parsed = parseAuthorImport(
      JSON.stringify({
        summary: 'hi',
        recommended_plugins: [{ id: 'p.a', version_range: '>=1.0', note: 'n' }],
      }),
    )
    expect(parsed?.rows[0]?.id).toBe('p.a')
  })

  it('buildAuthorJsonDisk omits empty summary-only payload', () => {
    const disk = buildAuthorJsonDisk({
      summary: '',
      detailMarkdown: '',
      rows: [emptyAuthorRecRow()],
      includeSuggestedUi: false,
      uiConfig: defaultUiConfig(),
      suggestedPluginBackendsJson: '',
    })
    expect(disk).toBeUndefined()
  })
})
