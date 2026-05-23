import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import zhCN from '../../i18n/locales/zh-CN'
import PackChecksSection from './PackChecksSection.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN },
})

describe('DebugPanel (T11 pack checks / validation debug panel)', () => {
  it('hides wasm status line before first validate run', () => {
    const w = mount(PackChecksSection, {
      props: {
        validationLastUsedWasm: null,
        requireChecksBeforeExport: false,
      },
      global: { plugins: [i18n] },
    })
    expect(w.text()).toMatch(/尚未运行|never ran/i)
  })

  it('shows rust wasm line when last run used wasm', () => {
    const w = mount(PackChecksSection, {
      props: {
        validationLastUsedWasm: true,
        requireChecksBeforeExport: false,
      },
      global: { plugins: [i18n] },
    })
    expect(w.text()).toMatch(/Rust|WASM|wasm/i)
  })

  it('shows typescript fallback line when wasm unavailable', () => {
    const w = mount(PackChecksSection, {
      props: {
        validationLastUsedWasm: false,
        requireChecksBeforeExport: false,
      },
      global: { plugins: [i18n] },
    })
    expect(w.text()).toMatch(/TypeScript|typescript/i)
  })

  it('emits runValidate when run-all clicked', async () => {
    const w = mount(PackChecksSection, {
      props: {
        validationLastUsedWasm: null,
        requireChecksBeforeExport: false,
      },
      global: { plugins: [i18n] },
    })
    await w.find('button').trigger('click')
    expect(w.emitted('runValidate')).toHaveLength(1)
  })
})
