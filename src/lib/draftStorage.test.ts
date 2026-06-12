import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearDraftSnapshot,
  DRAFT_STORAGE_KEY,
  draftMetaFromSnapshot,
  hasDraftSnapshot,
  placeholderFileFromMeta,
  readDraftMeta,
  readDraftSnapshot,
  saveDraftSnapshot,
  type PackDraftSnapshot,
} from './draftStorage'
import { DEFAULT_MANIFEST_JSON, DEFAULT_SETTINGS_JSON } from '../defaults'
import { defaultUiConfig } from '../types/uiConfig'

function sampleSnapshot(overrides: Partial<PackDraftSnapshot> = {}): PackDraftSnapshot {
  return {
    version: 2,
    savedAt: '2026-06-12T10:00:00.000Z',
    creationMode: 'simple',
    advancedTab: 'manifest',
    manifestText: DEFAULT_MANIFEST_JSON,
    settingsText: DEFAULT_SETTINGS_JSON,
    corePersonalityText: 'hello',
    worldviewMarkdown: '',
    knowledgeMarkdownFiles: [],
    creatorMessageToOthers: '',
    creatorMessageMode: 'unified',
    creatorMessageToDownloaderManifest: '',
    authorSummary: '',
    authorDetailMarkdown: '',
    authorRecommendedRows: [],
    authorIncludeSuggestedUi: false,
    authorSuggestedBackendsJson: '',
    uiConfig: defaultUiConfig(),
    portraitSlotMeta: { happy_default: { fileName: 'happy.png' } },
    portraitExtraMeta: [
      {
        id: 'extra_live2d',
        path: 'assets/live2d/model.model3.json',
        desc: 'live2d',
        tags: ['neutral'],
        kind: 'live2d',
        fileName: 'model.model3.json',
      },
    ],
    visualPresentationEnabled: true,
    visualPresentationBackend: 'live2d',
    visualPresentationLive2dModel: 'assets/live2d/model.model3.json',
    exportProfile: 'theater',
    ...overrides,
  }
}

describe('draftStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips v2 snapshot and meta', () => {
    const snapshot = sampleSnapshot()
    saveDraftSnapshot(snapshot)
    expect(hasDraftSnapshot()).toBe(true)
    expect(readDraftSnapshot()?.corePersonalityText).toBe('hello')
    expect(readDraftSnapshot()?.portraitSlotMeta?.happy_default?.fileName).toBe('happy.png')
    expect(readDraftSnapshot()?.exportProfile).toBe('theater')
    const meta = readDraftMeta()
    expect(meta?.roleId).toBe('my_role_id')
    expect(meta?.roleName).toBe('示例角色')
    expect(draftMetaFromSnapshot(snapshot).creationMode).toBe('simple')
  })

  it('migrates v1 snapshot from legacy key', () => {
    const v1 = {
      version: 1,
      savedAt: '2026-06-12T09:00:00.000Z',
      creationMode: 'advanced',
      advancedTab: 'images',
      manifestText: DEFAULT_MANIFEST_JSON,
      settingsText: DEFAULT_SETTINGS_JSON,
      corePersonalityText: 'v1',
      worldviewMarkdown: '',
      knowledgeMarkdownFiles: [],
      creatorMessageToOthers: '',
      creatorMessageMode: 'unified',
      creatorMessageToDownloaderManifest: '',
      authorSummary: '',
      authorDetailMarkdown: '',
      authorRecommendedRows: [],
      authorIncludeSuggestedUi: false,
      authorSuggestedBackendsJson: '',
      uiConfig: defaultUiConfig(),
    }
    localStorage.setItem('oclive-pack-editor-draft-v1', JSON.stringify(v1))
    const loaded = readDraftSnapshot()
    expect(loaded?.version).toBe(2)
    expect(loaded?.corePersonalityText).toBe('v1')
    expect(loaded?.portraitSlotMeta).toEqual({})
  })

  it('clear removes draft', () => {
    saveDraftSnapshot(sampleSnapshot())
    clearDraftSnapshot()
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull()
    expect(hasDraftSnapshot()).toBe(false)
  })

  it('placeholderFileFromMeta preserves file name', () => {
    const f = placeholderFileFromMeta('model.model3.json', 'live2d')
    expect(f.name).toBe('model.model3.json')
    expect(f.type).toContain('json')
  })
})
