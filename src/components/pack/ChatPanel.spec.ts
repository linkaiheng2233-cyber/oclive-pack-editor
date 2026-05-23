import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import zhCN from '../../i18n/locales/zh-CN'
import ChatPanel from './ChatPanel.vue'

vi.mock('../../lib/runtimeApi', () => ({
  fetchRuntimeHealth: vi.fn(),
  fetchRuntimeChat: vi.fn(),
  fetchRuntimeRoleFeedback: vi.fn(),
  markRuntimeRoleFeedbackRead: vi.fn(),
  setRuntimeRoleFeedbackHandled: vi.fn(),
  readRoleManifestScenes: vi.fn(),
  runtimeTcpListening: vi.fn(),
  spawnOcliveApi: vi.fn(),
}))

vi.mock('../../lib/exportFolder', () => ({
  isTauriRuntime: () => false,
}))

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN },
})

describe('ChatPanel (T08 role runtime / try-chat panel)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders try-chat title for role id', () => {
    const w = mount(ChatPanel, {
      props: { roleId: 'mumu', lastRolesRoot: '' },
      global: { plugins: [i18n] },
    })
    expect(w.text()).toMatch(/试聊/)
  })

  it('disables send when input empty', () => {
    const w = mount(ChatPanel, {
      props: { roleId: 'mumu', lastRolesRoot: '' },
      global: { plugins: [i18n] },
    })
    const sendBtn = w.findAll('button').find((b) => b.text().includes('发送') || b.text().includes('Send'))
    expect(sendBtn?.attributes('disabled')).toBeDefined()
  })

  it('shows default api base in connection field', () => {
    const w = mount(ChatPanel, {
      props: { roleId: 'mumu', lastRolesRoot: 'C:\\roles' },
      global: { plugins: [i18n] },
    })
    const inputs = w.findAll('input')
    const apiInput = inputs.find((el) =>
      (el.element as HTMLInputElement).value.includes('8420'),
    )
    expect(apiInput).toBeTruthy()
  })
})
