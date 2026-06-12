import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearDraftSnapshot,
  DRAFT_STORAGE_KEY,
  draftMetaFromSnapshot,
  hasDraftSnapshot,
  readDraftMeta,
  readDraftSnapshot,
  saveDraftSnapshot,
  type PackDraftSnapshot,
} from './draftStorage'
import { DEFAULT_MANIFEST_JSON, DEFAULT_SETTINGS_JSON } from '../defaults'
import { defaultUiConfig } from '../types/uiConfig'

function sampleSnapshot(overrides: Partial<PackDraftSnapshot> = {}): PackDraftSnapshot {
  return {
    version: 1,
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
    ...overrides,
  }
}

describe('draftStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips snapshot and meta', () => {
    const snapshot = sampleSnapshot()
    saveDraftSnapshot(snapshot)
    expect(hasDraftSnapshot()).toBe(true)
    expect(readDraftSnapshot()?.corePersonalityText).toBe('hello')
    const meta = readDraftMeta()
    expect(meta?.roleId).toBe('my_role_id')
    expect(meta?.roleName).toBe('示例角色')
    expect(draftMetaFromSnapshot(snapshot).creationMode).toBe('simple')
  })

  it('clear removes draft', () => {
    saveDraftSnapshot(sampleSnapshot())
    clearDraftSnapshot()
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull()
    expect(hasDraftSnapshot()).toBe(false)
  })
})
