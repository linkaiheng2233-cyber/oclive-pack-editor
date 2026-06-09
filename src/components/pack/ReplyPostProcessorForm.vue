<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: Record<string, unknown>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

const { t } = useI18n()

const enabled = computed({
  get: () => Boolean(props.modelValue.enabled),
  set: (v: boolean) => patch({ enabled: v }),
})

const backend = computed({
  get: () => String(props.modelValue.backend ?? 'builtin'),
  set: (v: string) => patch({ backend: v }),
})

const builtinProfile = computed({
  get: () => {
    const b = props.modelValue.builtin
    if (b && typeof b === 'object' && 'profile' in b) {
      return String((b as { profile?: string }).profile ?? 'standard')
    }
    return 'standard'
  },
  set: (v: string) => patch({ builtin: { profile: v } }),
})

const directoryPluginId = computed({
  get: () => {
    const d = props.modelValue.directory
    if (d && typeof d === 'object' && 'plugin_id' in d) {
      return String((d as { plugin_id?: string }).plugin_id ?? '')
    }
    return ''
  },
  set: (v: string) => patch({ directory: { plugin_id: v } }),
})

function patch(partial: Record<string, unknown>) {
  emit('update:modelValue', { ...props.modelValue, ...partial })
}
</script>

<template>
  <fieldset class="rpp-form">
    <legend>{{ t('packEditor.replyPostProcessor.title') }}</legend>
    <label class="rpp-row">
      <input v-model="enabled" type="checkbox">
      {{ t('packEditor.replyPostProcessor.enabled') }}
    </label>
    <label class="rpp-row">
      <span>{{ t('packEditor.replyPostProcessor.backend') }}</span>
      <select v-model="backend">
        <option value="builtin">builtin</option>
        <option value="remote">remote</option>
        <option value="directory">directory</option>
      </select>
    </label>
    <label v-if="backend === 'builtin'" class="rpp-row">
      <span>{{ t('packEditor.replyPostProcessor.builtinProfile') }}</span>
      <select v-model="builtinProfile">
        <option value="standard">standard</option>
        <option value="minimal">minimal</option>
      </select>
    </label>
    <label v-if="backend === 'directory'" class="rpp-row">
      <span>{{ t('packEditor.replyPostProcessor.directoryPlugin') }}</span>
      <input v-model="directoryPluginId" type="text" placeholder="reply-post-process-polish">
    </label>
  </fieldset>
</template>

<style scoped>
.rpp-form {
  border: 1px solid var(--border, #333);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin: 0.5rem 0;
}
.rpp-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.35rem 0;
  font-size: 0.9rem;
}
.rpp-row select,
.rpp-row input[type='text'] {
  flex: 1;
  max-width: 280px;
}
</style>
