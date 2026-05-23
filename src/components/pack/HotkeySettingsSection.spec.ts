import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import zhCN from '../../i18n/locales/zh-CN'
import HotkeySettingsSection, { type EditorHotkeyBinding } from './HotkeySettingsSection.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN },
})

const seed: EditorHotkeyBinding[] = [
  { id: 'a', accelerator: 'Ctrl+1', viewId: 'start', enabled: true },
]

describe('HotkeySettingsSection (T12 editor view shortcuts)', () => {
  it('renders shortcut rows from bindings prop', () => {
    const w = mount(HotkeySettingsSection, {
      props: { bindings: seed },
      global: { plugins: [i18n] },
    })
    expect(w.findAll('.hkset-row').length).toBe(1)
    expect((w.find('input').element as HTMLInputElement).value).toBe('Ctrl+1')
  })

  it('adds a new binding row', async () => {
    const bindings = [...seed]
    const w = mount(HotkeySettingsSection, {
      props: { bindings },
      global: { plugins: [i18n] },
      attrs: {
        'onUpdate:bindings': (v: EditorHotkeyBinding[]) => {
          bindings.splice(0, bindings.length, ...v)
        },
      },
    })
    await w.find('.hkset-add').trigger('click')
    expect(bindings.length).toBe(2)
    expect(bindings[1]?.viewId).toBe('start')
  })

  it('updates accelerator on edit', async () => {
    const bindings = [...seed]
    const w = mount(HotkeySettingsSection, {
      props: { bindings },
      global: { plugins: [i18n] },
      attrs: {
        'onUpdate:bindings': (v: EditorHotkeyBinding[]) => {
          bindings.splice(0, bindings.length, ...v)
        },
      },
    })
    const input = w.find('input')
    await input.setValue('Ctrl+Shift+C')
    expect(bindings[0]?.accelerator).toBe('Ctrl+Shift+C')
  })

  it('removes binding row', async () => {
    const bindings = [...seed, { id: 'b', accelerator: '', viewId: 'chat', enabled: false }]
    const w = mount(HotkeySettingsSection, {
      props: { bindings },
      global: { plugins: [i18n] },
      attrs: {
        'onUpdate:bindings': (v: EditorHotkeyBinding[]) => {
          bindings.splice(0, bindings.length, ...v)
        },
      },
    })
    await w.find('.hkset-remove').trigger('click')
    expect(bindings.length).toBe(1)
  })

  it('shows conflict hint when duplicate enabled accelerators', async () => {
    const bindings: EditorHotkeyBinding[] = [
      { id: 'a', accelerator: 'Ctrl+K', viewId: 'start', enabled: true },
      { id: 'b', accelerator: 'ctrl+k', viewId: 'chat', enabled: true },
    ]
    const w = mount(HotkeySettingsSection, {
      props: { bindings },
      global: { plugins: [i18n] },
    })
    expect(w.find('.hkset-conflict').exists()).toBe(true)
  })
})
