import { describe, expect, it } from 'vitest'
import { prepareExportPayload } from './exportPrepare'

describe('prepareExportPayload', () => {
  it('returns error when role meta JSON invalid', () => {
    const r = prepareExportPayload('{', '{}')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toContain('角色门面')
  })

  it('returns error when id empty', () => {
    const r = prepareExportPayload(
      JSON.stringify({ id: '   ', name: 'N' }),
      '{}',
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toContain('manifest.id')
  })

  it('returns roleId and objects when valid', () => {
    const r = prepareExportPayload(
      JSON.stringify({ id: 'hero', name: 'Hero' }),
      '{"schema_version":1}',
    )
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.roleId).toBe('hero')
      expect(r.manifest.id).toBe('hero')
    }
  })
})
