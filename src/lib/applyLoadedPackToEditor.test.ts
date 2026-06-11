import { describe, expect, it } from 'vitest'
import { ref, reactive } from 'vue'
import {
  applyLoadedPackToEditor,
  blueprintHasEditorExtensions,
  importedPackToApplyInput,
} from './applyLoadedPackToEditor'
import { DEFAULT_CORE_PERSONALITY_TEXT, DEFAULT_MANIFEST_JSON, DEFAULT_SETTINGS_JSON } from '../defaults'
import { defaultUiConfig } from '../types/uiConfig'
import { emptyAuthorRecRow } from './authorPack'
import type { ImportedRolePack } from './importPack'

function makeTargets() {
  const manifestText = ref(DEFAULT_MANIFEST_JSON)
  const settingsText = ref(DEFAULT_SETTINGS_JSON)
  const corePersonalityText = ref('')
  const worldviewMarkdown = ref('')
  const knowledgeMarkdownFiles = ref<{ path: string; content: string }[]>([])
  const emotionImageFiles = ref<File[]>([])
  const creatorMessageToOthers = ref('')
  const creatorMessageMode = ref<'unified' | 'per_module'>('unified')
  const uiConfig = reactive(defaultUiConfig())
  const authorSummary = ref('')
  const authorDetailMarkdown = ref('')
  const authorRecommendedRows = ref([emptyAuthorRecRow()])
  const authorIncludeSuggestedUi = ref(false)
  const authorSuggestedBackendsJson = ref('')
  let synced = false
  return {
    targets: {
      manifestText,
      settingsText,
      corePersonalityText,
      worldviewMarkdown,
      knowledgeMarkdownFiles,
      emotionImageFiles,
      creatorMessageToOthers,
      creatorMessageMode,
      uiConfig,
      authorSummary,
      authorDetailMarkdown,
      authorRecommendedRows,
      authorIncludeSuggestedUi,
      authorSuggestedBackendsJson,
      syncFormsFromJson: () => {
        synced = true
      },
    },
    synced: () => synced,
  }
}

describe('applyLoadedPackToEditor', () => {
  it('writes manifest/settings and calls sync', () => {
    const { targets, synced } = makeTargets()
    applyLoadedPackToEditor(
      {
        roleId: 'demo',
        manifestJson: '{"id":"demo","name":"D"}\n',
        settingsJson: '{"schema_version":1,"model":"x"}\n',
        corePersonality: 'hello',
      },
      targets,
    )
    expect(targets.manifestText.value).toContain('"demo"')
    expect(targets.corePersonalityText.value).toBe('hello')
    expect(synced()).toBe(true)
  })

  it('falls back to default core personality', () => {
    const { targets } = makeTargets()
    applyLoadedPackToEditor(
      { roleId: 'x', manifestJson: '{}', settingsJson: '{}', corePersonality: '  ' },
      targets,
    )
    expect(targets.corePersonalityText.value).toBe(DEFAULT_CORE_PERSONALITY_TEXT)
  })

  it('importedPackToApplyInput maps zip import shape', () => {
    const imp: ImportedRolePack = {
      roleId: 'z',
      manifestJson: '{}',
      settingsJson: '{}',
      corePersonality: 'c',
      worldviewMarkdown: 'w',
      knowledgeMarkdownFiles: [],
      emotionImageFiles: [],
      creatorMessage: '',
      uiJson: '',
      authorJson: '',
    }
    expect(importedPackToApplyInput(imp).roleId).toBe('z')
  })
})

describe('blueprintHasEditorExtensions', () => {
  it('detects includes/groups', () => {
    expect(blueprintHasEditorExtensions('{"includes":["x"]}')).toBe(true)
    expect(blueprintHasEditorExtensions('{"groups":{}}')).toBe(true)
    expect(blueprintHasEditorExtensions('{"meta":{"id":"a"}}')).toBe(false)
  })
})
