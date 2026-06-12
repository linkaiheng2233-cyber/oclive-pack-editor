import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ref, reactive, nextTick } from 'vue'
import { useRolesWorkspace } from './useRolesWorkspace'
import { DEFAULT_MANIFEST_JSON, DEFAULT_SETTINGS_JSON } from '../defaults'
import { defaultUiConfig } from '../types/uiConfig'
import { emptyAuthorRecRow } from '../lib/authorPack'

vi.mock('../lib/exportFolder', () => ({
  isTauriRuntime: () => false,
}))

vi.mock('../lib/rolePackEditorApi', () => ({
  invokeListRolePacksUnderRolesRoot: vi.fn(),
  invokeLoadRolePackForEditor: vi.fn(),
  catalogAssetsToFiles: vi.fn(() => []),
}))

describe('useRolesWorkspace', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  function makeApplyTargets() {
    return {
      manifestText: ref(DEFAULT_MANIFEST_JSON),
      settingsText: ref(DEFAULT_SETTINGS_JSON),
      corePersonalityText: ref(''),
      worldviewMarkdown: ref(''),
      knowledgeMarkdownFiles: ref([]),
      emotionImageFiles: ref([]),
      portraitSlotFiles: ref({}),
      portraitExtraEntries: ref([]),
      visualPresentationEnabled: ref(false),
      visualPresentationBackend: ref('image'),
      visualPresentationLive2dModel: ref(''),
      creatorMessageToOthers: ref(''),
      creatorMessageMode: ref<'unified' | 'per_module'>('unified'),
      uiConfig: reactive(defaultUiConfig()),
      authorSummary: ref(''),
      authorDetailMarkdown: ref(''),
      authorRecommendedRows: ref([emptyAuthorRecRow()]),
      authorIncludeSuggestedUi: ref(false),
      authorSuggestedBackendsJson: ref(''),
      syncFormsFromJson: vi.fn(),
    }
  }

  it('starts in idle pack session', () => {
    const ws = useRolesWorkspace(makeApplyTargets())
    expect(ws.packSession.value).toBe('idle')
  })

  it('resetToNewPack clears loaded session', async () => {
    const targets = makeApplyTargets()
    const ws = useRolesWorkspace(targets)
    ws.packSession.value = 'loaded'
    ws.loadedRoleName.value = 'Demo'
    ws.resetToNewPack()
    await nextTick()
    expect(ws.packSession.value).toBe('new')
    expect(ws.loadedRoleName.value).toBe('')
  })
})
