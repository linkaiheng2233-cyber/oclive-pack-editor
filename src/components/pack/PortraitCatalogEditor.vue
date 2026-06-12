<script setup lang="ts">
import HelpHint from '../HelpHint.vue'
import PortraitExtraEmotionList from './PortraitExtraEmotionList.vue'
import {
  PORTRAIT_SLOT_TAG,
  SIMPLE_PORTRAIT_SLOT_IDS,
  type PortraitCatalogEntry,
  type PortraitSlotId,
} from '../../lib/portraitCatalog'
import { clusterLabelFromTag } from '../../lib/portraitExtraUser'
import type { ExtraEmotionUserChoices } from '../../lib/portraitExtraUser'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  summary: string
  slotFiles: Partial<Record<PortraitSlotId, File>>
  extraEntries: PortraitCatalogEntry[]
}>()

const emit = defineEmits<{
  pickSlot: [id: PortraitSlotId, e: Event]
  clearSlot: [id: PortraitSlotId]
  clearAll: []
  extraAdd: []
  extraRemove: [index: number]
  extraApplyChoices: [index: number, choices: ExtraEmotionUserChoices, file?: File]
}>()

const { t } = useI18n()

function slotLabel(id: PortraitSlotId): string {
  return clusterLabelFromTag(PORTRAIT_SLOT_TAG[id])
}
</script>

<template>
  <div class="catalog-editor">
    <div class="emotion-label-row">
      <label class="emotion-label">{{ t('emotionAssetsControl.label') }}</label>
      <HelpHint :paragraphs="[t('advancedCreation.portraitCatalog.hint')]" />
    </div>

    <h3 class="section-title">{{ t('advancedCreation.portraitCatalog.fixedSlots') }}</h3>
    <p class="section-lead">{{ t('advancedCreation.portraitCatalog.fixedSlotsLead') }}</p>
    <ul class="slot-grid" aria-label="portrait catalog fixed slots">
      <li v-for="id in SIMPLE_PORTRAIT_SLOT_IDS" :key="id">
        <span class="slot-id">{{ slotLabel(id) }}</span>
        <span class="slot-state">{{ props.slotFiles[id]?.name ?? t('simpleCreation.portraitSlots.missing') }}</span>
        <label class="btn-lite">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            class="sr-only"
            @change="emit('pickSlot', id, $event)"
          />
          {{ t('simpleCreation.portraitSlots.pick') }}
        </label>
        <button
          v-if="props.slotFiles[id]"
          type="button"
          class="btn-lite ghost"
          @click="emit('clearSlot', id)"
        >
          {{ t('simpleCreation.portraitSlots.clear') }}
        </button>
      </li>
    </ul>

    <PortraitExtraEmotionList
      :entries="props.extraEntries"
      @add="emit('extraAdd')"
      @remove="(i) => emit('extraRemove', i)"
      @apply-choices="(i, c, f) => emit('extraApplyChoices', i, c, f)"
    />

    <button type="button" class="btn-lite ghost clear-all" @click="emit('clearAll')">
      {{ t('emotionAssetsControl.clear') }}
    </button>
    <p class="emotion-sum">{{ props.summary }}</p>
  </div>
</template>

<style scoped>
.catalog-editor {
  margin-bottom: 0.75rem;
}
.emotion-label-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem;
  margin-bottom: 0.35rem;
}
.emotion-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--fluent-text-primary);
}
.section-title {
  margin: 0.75rem 0 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
}
.section-lead {
  margin: 0 0 0.35rem;
  font-size: 0.75rem;
  color: var(--fluent-text-secondary);
}
.slot-grid {
  display: grid;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.slot-grid li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  padding: 0.25rem 0.45rem;
  border-radius: 4px;
  border: 1px solid var(--fluent-border-stroke);
}
.slot-id {
  font-weight: 600;
  min-width: 3.5rem;
}
.slot-state {
  flex: 1;
  color: var(--fluent-text-secondary);
  word-break: break-all;
}
.clear-all {
  margin-top: 0.5rem;
}
.emotion-sum {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
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
