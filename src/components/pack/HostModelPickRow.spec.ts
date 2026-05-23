import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import zhCN from '../../i18n/locales/zh-CN'
import HostModelPickRow from './HostModelPickRow.vue'
import { HOST_MODEL_CUSTOM_SENTINEL } from './hostModelConstants'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN },
})

describe('HostModelPickRow (T09 model picker)', () => {
  it('shows empty local list placeholder when no local models', () => {
    const w = mount(HostModelPickRow, {
      props: { localModels: [], cloudConfigured: false, modelId: '' },
      global: { plugins: [i18n] },
    })
    const opt = w.find('select option[disabled]')
    expect(opt.exists()).toBe(true)
    expect(opt.attributes('value')).toBe('__none__')
  })

  it('shows cloud optgroup only when cloud is configured with models', () => {
    const w = mount(HostModelPickRow, {
      props: {
        localModels: ['m1'],
        cloudConfigured: true,
        cloudModels: ['cloud-a'],
        modelId: 'm1',
      },
      global: { plugins: [i18n] },
    })
    const labels = w.findAll('select optgroup').map((g) => g.attributes('label'))
    expect(labels.some((l) => l?.includes('云端') || l?.includes('Cloud'))).toBe(true)
  })

  it('omits cloud optgroup when cloud is not configured', () => {
    const w = mount(HostModelPickRow, {
      props: {
        localModels: ['m1'],
        cloudConfigured: false,
        cloudModels: ['cloud-a'],
        modelId: 'm1',
      },
      global: { plugins: [i18n] },
    })
    expect(w.findAll('select optgroup').length).toBe(2)
  })

  it('always exposes custom model option in select', () => {
    const w = mount(HostModelPickRow, {
      props: { localModels: ['m1'], modelId: 'm1' },
      global: { plugins: [i18n] },
    })
    const custom = w
      .findAll('select option')
      .find((o) => o.attributes('value') === HOST_MODEL_CUSTOM_SENTINEL)
    expect(custom?.exists()).toBe(true)
  })

  it('emits update:modelId when switching local model', async () => {
    const w = mount(HostModelPickRow, {
      props: { localModels: ['m1', 'm2'], modelId: 'm1' },
      global: { plugins: [i18n] },
    })
    await w.find('select').setValue('m2')
    expect(w.emitted('update:modelId')?.[0]).toEqual(['m2'])
  })
})
