import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import zhCN from '../../i18n/locales/zh-CN'
import FeedbackWorkspace from './FeedbackWorkspace.vue'

vi.mock('../../lib/runtimeApi', () => ({
  fetchRuntimeHealth: vi.fn(),
  fetchRuntimeRoleFeedback: vi.fn(),
  markRuntimeRoleFeedbackRead: vi.fn(),
  setRuntimeRoleFeedbackHandled: vi.fn(),
}))

import * as runtimeApi from '../../lib/runtimeApi'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN },
})

describe('FeedbackWorkspace (T08 runtime feedback panel)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders empty list state when no feedback', async () => {
    vi.mocked(runtimeApi.fetchRuntimeRoleFeedback).mockResolvedValueOnce([])
    vi.mocked(runtimeApi.fetchRuntimeHealth).mockResolvedValueOnce('ok')
    const w = mount(FeedbackWorkspace, {
      props: { roleId: 'demo.role', active: true },
      global: { plugins: [i18n] },
    })
    await flushPromises()
    expect(w.text()).toContain('暂无反馈')
  })

  it('shows health ok after ping', async () => {
    vi.mocked(runtimeApi.fetchRuntimeHealth).mockResolvedValueOnce('ok')
    vi.mocked(runtimeApi.fetchRuntimeRoleFeedback).mockResolvedValueOnce([])
    const w = mount(FeedbackWorkspace, {
      props: { roleId: 'demo.role', active: true },
      global: { plugins: [i18n] },
    })
    await w.find('button', { text: '检测连接' }).trigger('click')
    await flushPromises()
    expect(runtimeApi.fetchRuntimeHealth).toHaveBeenCalled()
  })
})
