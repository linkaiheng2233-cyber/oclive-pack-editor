<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import HelpHint from '../HelpHint.vue'
import type { PortraitCatalogEntry } from '../../lib/portraitCatalog'
import {
  BASE_EMOTION_CLUSTERS,
  PORTRAIT_INTENSITY_OPTIONS,
  inferExtraEntryUserChoices,
  isDevOnlyExtraEntry,
  type ExtraEmotionUserChoices,
  type PortraitIntensity,
} from '../../lib/portraitExtraUser'

const props = defineProps<{
  entries: PortraitCatalogEntry[]
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
  applyChoices: [index: number, choices: ExtraEmotionUserChoices, file?: File]
}>()

const { t } = useI18n()

/** 仅展示普通图片条目；包内其它资源静默保留，不在界面提及。 */
const editableRows = computed(() =>
  props.entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !isDevOnlyExtraEntry(entry)),
)

function choicesFor(index: number): ExtraEmotionUserChoices {
  const entry = props.entries[index]
  if (!entry) {
    return {
      clusterMode: 'builtin',
      clusterTag: 'happy',
      customClusterLabel: '',
      intensity: 'mild',
    }
  }
  return inferExtraEntryUserChoices(entry)
}

function onClusterSelect(index: number, value: string): void {
  const prev = choicesFor(index)
  if (value === '__custom__') {
    emitApply(index, {
      clusterMode: 'custom',
      clusterTag: 'custom',
      customClusterLabel: '',
      intensity: prev.intensity,
    })
    return
  }
  emitApply(index, {
    clusterMode: 'builtin',
    clusterTag: value,
    customClusterLabel: '',
    intensity: prev.intensity,
  })
}

function onCustomClusterInput(index: number, value: string): void {
  const prev = choicesFor(index)
  emitApply(index, {
    ...prev,
    clusterMode: 'custom',
    customClusterLabel: value,
    clusterTag: value,
  })
}

function onIntensityChange(index: number, value: PortraitIntensity): void {
  emitApply(index, { ...choicesFor(index), intensity: value })
}

function onPickFile(index: number, e: Event): void {
  const inp = e.target as HTMLInputElement
  const f = inp.files?.[0]
  if (!f) return
  emitApply(index, choicesFor(index), f)
  inp.value = ''
}

function emitApply(index: number, choices: ExtraEmotionUserChoices, file?: File): void {
  emit('applyChoices', index, choices, file)
}

const clusterSelectValue = computed(() => (index: number) => {
  const c = choicesFor(index)
  return c.clusterMode === 'custom' ? '__custom__' : c.clusterTag
})
</script>

<template>
  <div class="extra-emotion-list">
    <div class="extra-head">
      <div>
        <h3 class="section-title">{{ t('portraitExtra.sectionTitle') }}</h3>
        <p class="section-lead">{{ t('portraitExtra.sectionLead') }}</p>
      </div>
      <button type="button" class="btn-lite" @click="emit('add')">
        {{ t('portraitExtra.addButton') }}
      </button>
    </div>
    <HelpHint :paragraphs="[t('portraitExtra.hint')]" />

    <div v-if="editableRows.length === 0" class="empty-tip">
      {{ t('portraitExtra.empty') }}
    </div>

    <article
      v-for="{ entry, index: i } in editableRows"
      :key="entry.id + ':' + i"
      class="extra-card"
    >
      <p class="q-label">{{ t('portraitExtra.q1Label') }}</p>
      <div class="q-row">
        <select
          class="select-full"
          :value="clusterSelectValue(i)"
          @change="onClusterSelect(i, ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="c in BASE_EMOTION_CLUSTERS" :key="c.tag" :value="c.tag">
            {{ c.label }}
          </option>
          <option value="__custom__">{{ t('portraitExtra.customClusterOption') }}</option>
        </select>
        <input
          v-if="choicesFor(i).clusterMode === 'custom'"
          type="text"
          class="input-full"
          :value="choicesFor(i).customClusterLabel"
          :placeholder="t('portraitExtra.customClusterPlaceholder')"
          @input="onCustomClusterInput(i, ($event.target as HTMLInputElement).value)"
        />
      </div>

      <p class="q-label">{{ t('portraitExtra.q2Label') }}</p>
      <div class="intensity-row" role="radiogroup" :aria-label="t('portraitExtra.q2Label')">
        <label
          v-for="opt in PORTRAIT_INTENSITY_OPTIONS"
          :key="opt.value"
          class="intensity-chip"
        >
          <input
            type="radio"
            :name="`portrait-intensity-${i}`"
            :checked="choicesFor(i).intensity === opt.value"
            @change="onIntensityChange(i, opt.value)"
          />
          {{ opt.label }}
        </label>
      </div>

      <p class="q-label">{{ t('portraitExtra.q3Label') }}</p>
      <div class="file-row">
        <span class="file-name">
          {{ entry.file?.name || t('portraitExtra.noFileYet') }}
        </span>
        <label class="btn-lite">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            class="sr-only"
            @change="onPickFile(i, $event)"
          />
          {{ t('portraitExtra.pickImage') }}
        </label>
        <button type="button" class="btn-lite ghost danger" @click="emit('remove', i)">
          {{ t('portraitExtra.remove') }}
        </button>
      </div>
    </article>
  </div>
</template>

<style scoped>
.extra-emotion-list {
  margin-top: 0.75rem;
}
.extra-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}
.section-title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
}
.section-lead {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: var(--fluent-text-secondary);
}
.empty-tip {
  font-size: 0.78rem;
  color: var(--fluent-text-secondary);
  margin-top: 0.5rem;
}
.extra-card {
  border: 1px solid var(--pack-glass-border);
  border-radius: var(--fluent-radius);
  padding: 0.65rem;
  margin-top: 0.55rem;
  background: var(--pack-glass-fill-subtle);
}
.q-label {
  margin: 0.55rem 0 0.25rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--fluent-text-primary);
}
.q-label:first-child {
  margin-top: 0;
}
.q-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.select-full,
.input-full {
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--fluent-border-control);
  border-radius: var(--fluent-radius);
  font-size: 0.82rem;
}
.intensity-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.intensity-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.55rem;
  border: 1px solid var(--fluent-border-stroke);
  border-radius: 999px;
  font-size: 0.78rem;
  cursor: pointer;
}
.file-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}
.file-name {
  flex: 1;
  min-width: 120px;
  font-size: 0.75rem;
  color: var(--fluent-text-secondary);
  word-break: break-all;
}
.btn-lite.danger {
  border-color: var(--fluent-danger-border);
  color: var(--fluent-danger-text);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
