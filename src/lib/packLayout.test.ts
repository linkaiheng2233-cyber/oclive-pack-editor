import { describe, expect, it } from 'vitest'
import { mergedSceneIds, rolePackRelativePaths } from './packLayout'

describe('rolePackRelativePaths', () => {
  it('matches roles-root layout (OCLIVE_ROLES_DIR)', () => {
    const paths = rolePackRelativePaths('demo', ['home'])
    expect(paths).toContain('demo/manifest.json')
    expect(paths).toContain('demo/settings.json')
    expect(paths).toContain('demo/knowledge/.oclive_placeholder.txt')
    expect(paths).toContain('demo/scenes/home/scene.json')
    expect(paths).toContain('demo/scenes/home/description.txt')
  })
})

describe('mergedSceneIds', () => {
  it('dedupes and trims', () => {
    expect(mergedSceneIds([' home ', 'home'], ['x'])).toEqual(['home', 'x'])
  })
})
