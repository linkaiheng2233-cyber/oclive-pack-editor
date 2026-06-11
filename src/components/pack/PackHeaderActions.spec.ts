import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import zhCN from '../../i18n/locales/zh-CN'
import PackHeaderActions from './PackHeaderActions.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN },
})

describe('PackHeaderActions (Phase 1 header tools)', () => {
  it('renders check pack and export buttons', () => {
    const w = mount(PackHeaderActions, {
      props: {
        requireChecksBeforeExport: true,
        folderExportOk: false,
        validationLastUsedWasm: null,
      },
      global: { plugins: [i18n] },
    })
    expect(w.find('.pha-btn--check').text()).toContain('检查角色包')
    expect(w.find('.pha-btn--export-main').exists()).toBe(true)
  })

  it('emits runValidate when check is clicked', async () => {
    const w = mount(PackHeaderActions, {
      props: {
        requireChecksBeforeExport: true,
        folderExportOk: false,
        validationLastUsedWasm: null,
      },
      global: { plugins: [i18n] },
    })
    await w.find('.pha-btn--check').trigger('click')
    expect(w.emitted('runValidate')).toHaveLength(1)
  })

  it('emits exportOcpak from main export button', async () => {
    const w = mount(PackHeaderActions, {
      props: {
        requireChecksBeforeExport: true,
        folderExportOk: false,
        validationLastUsedWasm: null,
      },
      global: { plugins: [i18n] },
    })
    await w.find('.pha-btn--export-main').trigger('click')
    expect(w.emitted('exportOcpak')).toHaveLength(1)
  })

  it('teleports export menu to body', async () => {
    const w = mount(PackHeaderActions, {
      props: {
        requireChecksBeforeExport: true,
        folderExportOk: true,
        validationLastUsedWasm: true,
      },
      attachTo: document.body,
      global: { plugins: [i18n] },
    })
    await w.find('.pha-btn--export-toggle').trigger('click')
    expect(document.querySelector('.pha-export-menu--teleport')).toBeTruthy()
    w.unmount()
  })
})
