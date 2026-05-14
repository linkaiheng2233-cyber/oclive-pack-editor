import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AnchorPresetManager from './AnchorPresetManager.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: {
    'zh-CN': {
      packEditor: {
        rolePack: {
          anchor: {
            aria: 'anchor',
            title: 'title',
            lead: 'lead',
            preview: 'preview',
            emptyPreview: 'empty',
            presetSelect: 'preset',
            custom: 'custom',
            customBody: 'body',
            charCount: '{n} chars',
            charHint: 'hint',
            categories: {
              default: 'def',
              concise: 'con',
              detailed: 'det',
              roleplay: 'rp',
            },
            presets: {
              editorDefault: 'ed',
              concise: 'co',
              detailed: 'de',
              roleplay: 'ro',
            },
          },
        },
      },
    },
  },
})

describe('AnchorPresetManager', () => {
  it('emits preset body when selecting concise', async () => {
    const w = mount(AnchorPresetManager, {
      props: { modelValue: '' },
      global: { plugins: [i18n] },
    })
    const sel = w.find('select')
    await sel.setValue('concise')
    const emitted = w.emitted('update:modelValue')
    expect(emitted?.length).toBeGreaterThan(0)
    expect(String(emitted![0]![0])).toContain('简洁模式')
  })

  it('shows char count', () => {
    const w = mount(AnchorPresetManager, {
      props: { modelValue: 'abc' },
      global: { plugins: [i18n] },
    })
    expect(w.text()).toContain('3')
  })
})
