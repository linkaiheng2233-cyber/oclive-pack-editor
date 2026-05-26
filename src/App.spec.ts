import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import App from './App.vue'
import { i18n } from './i18n'

describe('App shell', () => {
  it('mounts navigation rail and start view', () => {
    const w = mount(App, { global: { plugins: [i18n] } })
    expect(w.find('.editor-rail').exists()).toBe(true)
    expect(w.find('.shell-h1').text().length).toBeGreaterThan(0)
    expect(w.find('.import-wrap').exists()).toBe(true)
  })
})
