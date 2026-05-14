<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  REPLY_ANCHOR_PRESETS,
  REPLY_ANCHOR_CATEGORY_ORDER,
  matchReplyAnchorPresetId,
  getReplyAnchorPresetById,
  type ReplyAnchorCategory,
} from '../../lib/replyQualityAnchorPreset'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
}>()

const { t } = useI18n()

const selectedPresetId = ref('custom')
const customExpanded = ref(false)

function syncSelectFromModel() {
  selectedPresetId.value = matchReplyAnchorPresetId(props.modelValue)
  customExpanded.value = selectedPresetId.value === 'custom'
}

watch(
  () => props.modelValue,
  () => {
    syncSelectFromModel()
  },
  { immediate: true },
)

const preview = computed(() => {
  const s = props.modelValue ?? ''
  return s.length > 200 ? `${s.slice(0, 200)}…` : s
})

const charCount = computed(() => (props.modelValue ?? '').length)

function onSelectPreset(id: string) {
  selectedPresetId.value = id
  if (id === 'custom') {
    customExpanded.value = true
    return
  }
  customExpanded.value = false
  const p = getReplyAnchorPresetById(id)
  if (p) emit('update:modelValue', p.body)
}

function onCustomInput(ev: Event) {
  const v = (ev.target as HTMLTextAreaElement).value
  selectedPresetId.value = 'custom'
  emit('update:modelValue', v)
}

function categoryLabel(cat: ReplyAnchorCategory): string {
  return String(t(`packEditor.rolePack.anchor.categories.${cat}`))
}

function presetLabel(presetId: string): string {
  if (presetId === 'custom') return String(t('packEditor.rolePack.anchor.custom'))
  const p = getReplyAnchorPresetById(presetId)
  if (!p) return presetId
  return String(t(`packEditor.rolePack.anchor.presets.${p.labelKey}`))
}

const presetsByCategory = computed(() => {
  const m = new Map<ReplyAnchorCategory, typeof REPLY_ANCHOR_PRESETS>()
  for (const c of REPLY_ANCHOR_CATEGORY_ORDER) m.set(c, [])
  for (const p of REPLY_ANCHOR_PRESETS) {
    m.get(p.category)!.push(p)
  }
  return REPLY_ANCHOR_CATEGORY_ORDER.map((c) => ({ category: c, items: m.get(c)! }))
})
</script>

<template>
  <section class="anchor-card" :aria-label="String(t('packEditor.rolePack.anchor.aria'))">
    <h3 class="h3">{{ t('packEditor.rolePack.anchor.title') }}</h3>
    <p class="muted">{{ t('packEditor.rolePack.anchor.lead') }}</p>
    <div class="preview-block">
      <span class="lbl">{{ t('packEditor.rolePack.anchor.preview') }}</span>
      <pre class="preview">{{ preview || t('packEditor.rolePack.anchor.emptyPreview') }}</pre>
    </div>
    <label class="field">
      <span class="lbl">{{ t('packEditor.rolePack.anchor.presetSelect') }}</span>
      <select class="inp" :value="selectedPresetId" @change="onSelectPreset(($event.target as HTMLSelectElement).value)">
        <option value="custom">{{ presetLabel('custom') }}</option>
        <template v-for="grp in presetsByCategory" :key="grp.category">
          <optgroup :label="categoryLabel(grp.category)">
            <option v-for="it in grp.items" :key="it.id" :value="it.id">{{ presetLabel(it.id) }}</option>
          </optgroup>
        </template>
      </select>
    </label>
    <div v-if="customExpanded || selectedPresetId === 'custom'" class="custom-block">
      <label class="field">
        <span class="lbl">{{ t('packEditor.rolePack.anchor.customBody') }}</span>
        <textarea
          class="textarea"
          rows="8"
          spellcheck="false"
          :value="modelValue"
          @input="onCustomInput"
        />
      </label>
    </div>
    <p class="count-line" role="status">
      {{ t('packEditor.rolePack.anchor.charCount', { n: charCount }) }}
      <span class="hint">{{ t('packEditor.rolePack.anchor.charHint') }}</span>
    </p>
  </section>
</template>

<style scoped>
.anchor-card {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12));
  background: var(--surface-1, rgba(255, 255, 255, 0.04));
}
.h3 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
}
.muted {
  margin: 0 0 0.75rem;
  opacity: 0.85;
  font-size: 13px;
}
.preview-block {
  margin-bottom: 0.75rem;
}
.preview {
  margin: 0.25rem 0 0;
  padding: 0.5rem 0.65rem;
  max-height: 120px;
  overflow: auto;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}
.lbl {
  font-size: 12px;
  opacity: 0.9;
}
.inp,
.textarea {
  font: inherit;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.14));
  background: var(--surface-2, rgba(255, 255, 255, 0.06));
  color: inherit;
}
.textarea {
  resize: vertical;
  min-height: 120px;
}
.custom-block {
  margin-top: 0.5rem;
}
.count-line {
  margin: 0.5rem 0 0;
  font-size: 12px;
}
.hint {
  margin-left: 0.5rem;
  opacity: 0.75;
}
</style>
