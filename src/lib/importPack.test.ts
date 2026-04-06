import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { importRolePackFromZip, isSafePathUnderRole } from './importPack'

async function zipToFile(zip: JSZip, name: string): Promise<File> {
  const blob = await zip.generateAsync({ type: 'blob' })
  return new File([blob], name, { type: 'application/zip' })
}

describe('isSafePathUnderRole', () => {
  it('accepts normal files under role', () => {
    expect(isSafePathUnderRole('myrole/manifest.json', 'myrole')).toBe(true)
    expect(isSafePathUnderRole('myrole/assets/images/a.png', 'myrole')).toBe(true)
  })

  it('rejects parent segments', () => {
    expect(isSafePathUnderRole('myrole/assets/images/../../../x.png', 'myrole')).toBe(false)
    expect(isSafePathUnderRole('myrole/../manifest.json', 'myrole')).toBe(false)
  })

  it('rejects escape from role prefix', () => {
    expect(isSafePathUnderRole('otherrole/manifest.json', 'myrole')).toBe(false)
  })
})

describe('importRolePackFromZip', () => {
  it('imports minimal valid pack', async () => {
    const z = new JSZip()
    z.file('hero/manifest.json', '{"id":"hero","name":"H"}\n')
    z.file('hero/settings.json', '{"schema_version":1}\n')
    z.file('hero/core_personality.txt', 'hello')
    const f = await zipToFile(z, 'p.zip')
    const r = await importRolePackFromZip(f)
    expect(r.roleId).toBe('hero')
    expect(r.manifestJson).toContain('hero')
    expect(r.corePersonality).toContain('hello')
    expect(r.emotionImageFiles).toHaveLength(0)
  })

  it('loads emotion images under assets/images', async () => {
    const z = new JSZip()
    z.file('hero/manifest.json', '{"id":"hero","name":"H"}\n')
    z.file('hero/settings.json', '{}')
    z.file('hero/core_personality.txt', 'x')
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    z.file('hero/assets/images/smile.png', png)
    const f = await zipToFile(z, 'p.zip')
    const r = await importRolePackFromZip(f)
    expect(r.emotionImageFiles).toHaveLength(1)
    expect(r.emotionImageFiles[0]!.name).toBe('smile.png')
  })

  it('reads knowledge/world.md when present', async () => {
    const z = new JSZip()
    z.file('r/manifest.json', '{"id":"r","name":"R"}\n')
    z.file('r/settings.json', '{}')
    z.file('r/core_personality.txt', 'c')
    z.file('r/knowledge/world.md', '---\nid: w\n---\n\nbody')
    const f = await zipToFile(z, 'p.zip')
    const r = await importRolePackFromZip(f)
    expect(r.worldviewMarkdown).toContain('body')
  })

  it('throws when manifest missing', async () => {
    const z = new JSZip()
    z.file('a/readme.txt', 'x')
    const f = await zipToFile(z, 'p.zip')
    await expect(importRolePackFromZip(f)).rejects.toThrow(/未找到/)
  })

  it('throws when manifest is empty', async () => {
    const z = new JSZip()
    z.file('hero/manifest.json', '   \n')
    z.file('hero/settings.json', '{}')
    z.file('hero/core_personality.txt', 'x')
    const f = await zipToFile(z, 'p.zip')
    await expect(importRolePackFromZip(f)).rejects.toThrow(/为空/)
  })

  it('skips zip-slip entries under assets/images', async () => {
    const z = new JSZip()
    z.file('hero/manifest.json', '{"id":"hero","name":"H"}\n')
    z.file('hero/settings.json', '{}')
    z.file('hero/core_personality.txt', 'x')
    z.file('hero/assets/images/../../../evil.png', 'bad')
    const f = await zipToFile(z, 'p.zip')
    const r = await importRolePackFromZip(f)
    expect(r.emotionImageFiles).toHaveLength(0)
  })

  it('skips nested paths masquerading as filename', async () => {
    const z = new JSZip()
    z.file('hero/manifest.json', '{"id":"hero","name":"H"}\n')
    z.file('hero/settings.json', '{}')
    z.file('hero/core_personality.txt', 'x')
    z.file('hero/assets/images/sub/hack.png', 'bad')
    const f = await zipToFile(z, 'p.zip')
    const r = await importRolePackFromZip(f)
    expect(r.emotionImageFiles).toHaveLength(0)
  })
})
