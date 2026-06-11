import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import zhCN from '../../i18n/locales/zh-CN'
import PackShellMenu from './PackShellMenu.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN },
})

describe('PackShellMenu', () => {
  it('renders locale and theme triggers with readable labels', () => {
    const w = mount(PackShellMenu, {
      props: { locale: 'system', theme: 'system' },
      global: { plugins: [i18n] },
    })
    expect(w.text()).toContain('跟随系统')
    expect(w.find('.psm-btn--theme').exists()).toBe(true)
  })

  it('emits locale update from teleported menu', async () => {
    const w = mount(PackShellMenu, {
      props: { locale: 'system', theme: 'light' },
      attachTo: document.body,
      global: { plugins: [i18n] },
    })
    await w.find('.psm-btn').trigger('click')
    const items = document.querySelectorAll('.pack-shell-menu-dropdown .psm-menu-item')
    expect(items.length).toBeGreaterThan(1)
    ;(items[1] as HTMLButtonElement).click()
    expect(w.emitted('update:locale')?.[0]).toEqual(['zh-CN'])
    w.unmount()
  })
})
