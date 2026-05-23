import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import zhCN from '../../i18n/locales/zh-CN'
import FrontendTestRunnerPanel from './FrontendTestRunnerPanel.vue'

vi.mock('../../lib/vueTestRunnerApi', () => ({
  loadVueTestWorkspaceRoot: vi.fn(() => ''),
  saveVueTestWorkspaceRoot: vi.fn(),
  directoryPluginJsonRpcInvoke: vi.fn(),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN },
})

describe('FrontendTestRunnerPanel (T13 frontend test runner UI)', () => {
  it('renders workspace root input', () => {
    const w = mount(FrontendTestRunnerPanel, { global: { plugins: [i18n] } })
    expect(w.find('input').exists()).toBe(true)
  })

  it('shows error when health check without workspace', async () => {
    const w = mount(FrontendTestRunnerPanel, { global: { plugins: [i18n] } })
    const buttons = w.findAll('button.ft-btn')
    expect(buttons.length).toBeGreaterThan(0)
    await buttons[0]!.trigger('click')
    expect(w.text()).toMatch(/工作区|workspace|未/i)
  })
})
