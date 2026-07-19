import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import zhCN from '../../i18n/locales/zh-CN'
import RolePackEditorPanel from './RolePackEditorPanel.vue'

vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn() }))
vi.mock('../../lib/rolePackEditorApi', () => ({
  invokeLoadRolePackForEditor: vi.fn(),
  invokeSaveRolePackEditor: vi.fn(),
}))
vi.mock('../../lib/exportFolder', () => ({ isTauriRuntime: () => true }))

import { open } from '@tauri-apps/plugin-dialog'
import * as api from '../../lib/rolePackEditorApi'

const manifestMinimal = {
  id: 'demo.pack',
  name: 'Demo',
  version: '0.1.0',
  author: 'a',
  description: 'd',
  default_personality: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
  scenes: ['default'],
  user_relations: { friend: { initial_favorability: 50, favor_multiplier: 1 } },
  default_relation: 'friend',
}

const settingsMinimal = {
  schema_version: 1,
  plugin_backends: {
    memory: 'builtin',
    emotion: 'builtin',
    event: 'builtin',
    prompt: 'builtin',
    llm: 'ollama',
    agent: 'builtin',
  },
}

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN },
})

async function mountLoaded() {
  vi.mocked(open).mockResolvedValueOnce('C:\\demo\\roles\\demo.pack')
  vi.mocked(api.invokeLoadRolePackForEditor).mockResolvedValueOnce({
    manifestText: JSON.stringify(manifestMinimal, null, 2),
    settingsText: JSON.stringify(settingsMinimal, null, 2),
    mergedSceneIds: ['default'],
  })
  const w = mount(RolePackEditorPanel, { global: { plugins: [i18n] } })
  await w.find('button.primary').trigger('click')
  await flushPromises()
  return w
}

describe('PluginManagerPanel (T10 plugin backends in role pack editor)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders plugin_backends slot selectors after load', async () => {
    const w = await mountLoaded()
    expect(w.text()).toContain('plugin_backends.memory')
    expect(w.text()).toContain('plugin_backends.llm')
    expect(w.findAll('select.inp').length).toBeGreaterThan(0)
  })

  it('switches between form and JSON tabs', async () => {
    const w = await mountLoaded()
    const jsonBtn = w.findAll('.mode-toggle button').find((b) => b.text().includes('JSON'))
    expect(jsonBtn).toBeTruthy()
    await jsonBtn!.trigger('click')
    expect(w.findAll('textarea.json-ta').length).toBe(2)
    const formBtn = w.findAll('.mode-toggle button').find((b) => !b.text().includes('JSON'))
    await formBtn!.trigger('click')
    expect(w.findAll('textarea.json-ta').length).toBe(2)
  })

  it('disables save until pack loaded', () => {
    const w = mount(RolePackEditorPanel, { global: { plugins: [i18n] } })
    const saveBtn = w.findAll('button').find((b) => b.text().includes('保存') || b.text().includes('Save'))
    expect(saveBtn?.attributes('disabled')).toBeDefined()
  })
})
