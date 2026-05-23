<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { HOST_MODEL_CUSTOM_SENTINEL } from './hostModelConstants'

const props = withDefaults(
  defineProps<{
    localModels?: string[]
    cloudConfigured?: boolean
    cloudModels?: string[]
    modelId?: string
    disabled?: boolean
    selectId?: string
  }>(),
  {
    localModels: () => [],
    cloudConfigured: false,
    cloudModels: () => [],
    modelId: '',
    disabled: false,
    selectId: 'host-model-pick',
  },
)

const emit = defineEmits<{
  'update:modelId': [value: string]
}>()

const { t } = useI18n()
const selectValue = ref('')
const useCustom = ref(false)

const cloudOptions = computed(() => {
  if (!props.cloudConfigured) return [] as string[]
  return [...props.cloudModels]
})

function syncSelectFromModel(): void {
  const m = props.modelId.trim()
  if (!m) {
    selectValue.value = ''
    useCustom.value = false
    return
  }
  if (props.localModels.includes(m) || cloudOptions.value.includes(m)) {
    useCustom.value = false
    selectValue.value = m
    return
  }
  useCustom.value = true
  selectValue.value = HOST_MODEL_CUSTOM_SENTINEL
}

watch(
  () => [props.modelId, props.localModels, props.cloudModels, props.cloudConfigured] as const,
  () => syncSelectFromModel(),
  { immediate: true },
)

function onSelectChange(e: Event): void {
  const v = (e.target as HTMLSelectElement).value
  if (v === HOST_MODEL_CUSTOM_SENTINEL) {
    useCustom.value = true
    selectValue.value = HOST_MODEL_CUSTOM_SENTINEL
    return
  }
  useCustom.value = false
  selectValue.value = v
  emit('update:modelId', v)
}

function onCustomInput(e: Event): void {
  emit('update:modelId', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="hmpr">
    <label class="hmpr-label" :for="selectId">{{ t('packEditor.hostModel.label') }}</label>
    <div class="hmpr-mid">
      <select
        :id="selectId"
        class="hmpr-select"
        :value="selectValue"
        :disabled="disabled"
        @change="onSelectChange"
      >
        <optgroup :label="String(t('packEditor.hostModel.localGroup'))">
          <option v-if="!localModels.length" disabled value="__none__">
            {{ t('packEditor.hostModel.offlineLocal') }}
          </option>
          <option v-for="n in localModels" :key="'loc-' + n" :value="n">{{ n }}</option>
        </optgroup>
        <optgroup v-if="cloudOptions.length" :label="String(t('packEditor.hostModel.cloudGroup'))">
          <option v-for="n in cloudOptions" :key="'cld-' + n" :value="n">{{ n }}</option>
        </optgroup>
        <optgroup :label="String(t('packEditor.hostModel.customGroup'))">
          <option :value="HOST_MODEL_CUSTOM_SENTINEL">
            {{ t('packEditor.hostModel.customOption') }}
          </option>
        </optgroup>
      </select>
      <div v-if="useCustom" class="hmpr-custom-wrap">
        <input
          class="hmpr-custom-input"
          type="text"
          :value="modelId"
          spellcheck="false"
          autocomplete="off"
          :placeholder="String(t('packEditor.hostModel.customPlaceholder'))"
          :disabled="disabled"
          @input="onCustomInput"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.hmpr {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hmpr-label {
  font-size: 0.875rem;
  font-weight: 600;
}
.hmpr-select,
.hmpr-custom-input {
  width: 100%;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--fluent-border, #ccc);
  box-sizing: border-box;
}
</style>
