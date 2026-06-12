import { describe, expect, it } from 'vitest'
import { appendAssetPlaceholdersForValidate } from './exportValidate'
import { buildRolePackFiles } from './exportPack'
import { DEFAULT_MANIFEST_JSON, DEFAULT_SETTINGS_JSON } from '../defaults'

describe('exportValidate', () => {
  it('appendAssetPlaceholdersForValidate writes catalog and live2d paths', () => {
    const manifest = JSON.parse(DEFAULT_MANIFEST_JSON) as Record<string, unknown>
    const settings = JSON.parse(DEFAULT_SETTINGS_JSON) as Record<string, unknown>
    const catalog = JSON.stringify({
      schema_version: 1,
      assets: [
        { id: 'happy_default', path: 'assets/images/happy.webp', tags: ['happy'], kind: 'image' },
        { id: 'l2d', path: 'assets/live2d/m.model3.json', tags: [], kind: 'live2d' },
      ],
    })
    const config = JSON.stringify({
      portrait_catalog: { enabled: true },
      visual_presentation: {
        enabled: true,
        backend: 'live2d',
        resources: { live2d_model: 'assets/live2d/stage.model3.json' },
      },
    })
    const base = buildRolePackFiles('demo', manifest, settings, {
      portraitCatalogJson: catalog,
      configJson: config,
      emotionImages: [new File(['x'], 'happy.webp')],
      catalogAssets: [
        { relPath: 'assets/images/happy.webp', file: new File(['x'], 'happy.webp') },
        {
          relPath: 'assets/live2d/m.model3.json',
          file: new File(['{}'], 'm.model3.json', { type: 'application/json' }),
        },
      ],
    })
    const out = appendAssetPlaceholdersForValidate(base, 'demo', {
      portraitCatalogJson: catalog,
      configJson: config,
      catalogAssets: [
        { relPath: 'assets/images/happy.webp', file: new File(['x'], 'happy.webp') },
      ],
    })
    expect(out.has('demo/assets/images/happy.webp')).toBe(true)
    expect(out.has('demo/assets/live2d/m.model3.json')).toBe(true)
    expect(out.has('demo/assets/live2d/stage.model3.json')).toBe(true)
  })
})
