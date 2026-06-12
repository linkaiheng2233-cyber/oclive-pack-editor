<script setup lang="ts">
import HelpHint from '../HelpHint.vue'
import {
  PORTRAIT_SLOT_TAG,
  SIMPLE_PORTRAIT_SLOT_IDS,
  type PortraitCatalogEntry,
  type PortraitSlotId,
} from '../../lib/portraitCatalog'
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
  pickExtraFile: [index: number, e: Event]
  updateExtra: [index: number, patch: Partial<PortraitCatalogEntry>]
  addExtra: []
  removeExtra: [index: number]
}>()

const { t } = useI18n()

const KIND_OPTIONS = ['image', 'live2d', 'rig3d', 'procedural'] as const
</script>

<template>
  <div class="catalog-editor">
    <div class="emotion-label-row">
      <label class="emotion-label">{{ t('emotionAssetsControl.label') }}</label>
      <HelpHint :paragraphs="[t('advancedCreation.portraitCatalog.hint')]" />
    </div>

    <h3 class="section-title">{{ t('advancedCreation.portraitCatalog.fixedSlots') }}</h3>
    <ul class="slot-grid" aria-label="portrait catalog fixed slots">
      <li v-for="id in SIMPLE_PORTRAIT_SLOT_IDS" :key="id">
        <span class="slot-id">{{ PORTRAIT_SLOT_TAG[id] }}</span>
        <code class="slot-code">{{ id }}</code>
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

    <div class="extra-head">
      <h3 class="section-title">{{ t('advancedCreation.portraitCatalog.extraEntries') }}</h3>
      <button type="button" class="btn-lite" @click="emit('addExtra')">
        {{ t('advancedCreation.portraitCatalog.addEntry') }}
      </button>
    </div>

    <div v-if="props.extraEntries.length === 0" class="empty-tip">
      {{ t('advancedCreation.portraitCatalog.noExtra') }}
    </div>

    <div v-for="(entry, i) in props.extraEntries" :key="entry.id + ':' + i" class="extra-card">
      <div class="extra-row">
        <label>
          <span>id</span>
          <input
            :value="entry.id"
            type="text"
            @input="emit('updateExtra', i, { id: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <label>
          <span>kind</span>
          <select
            :value="entry.kind"
            @change="emit('updateExtra', i, { kind: ($event.target as HTMLSelectElement).value as PortraitCatalogEntry['kind'] })"
          >
            <option v-for="k in KIND_OPTIONS" :key="k" :value="k">{{ k }}</option>
          </select>
        </label>
        <label>
          <span>cluster</span>
          <input
            :value="entry.cluster ?? ''"
            type="text"
            placeholder="optional"
            @input="emit('updateExtra', i, { cluster: ($event.target as HTMLInputElement).value })"
          />
        </label>
      </div>
      <div class="extra-row">
        <label class="grow">
          <span>desc</span>
          <input
            :value="entry.desc"
            type="text"
            @input="emit('updateExtra', i, { desc: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <label class="grow">
          <span>tags (csv)</span>
          <input
            :value="entry.tags.join(', ')"
            type="text"
            @input="
              emit('updateExtra', i, {
                tags: ($event.target as HTMLInputElement).value
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            "
          />
        </label>
      </div>
      <div class="extra-row file-row">
        <span class="file-name">{{ entry.file?.name ?? t('advancedCreation.portraitCatalog.noFile') }}</span>
        <label class="btn-lite">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            class="sr-only"
            @change="emit('pickExtraFile', i, $event)"
          />
          {{ t('simpleCreation.portraitSlots.pick') }}
        </label>
        <button type="button" class="btn-lite ghost danger" @click="emit('removeExtra', i)">
          {{ t('advancedCreation.sections.world.delete') }}
        </button>
      </div>
    </div>

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
  min-width: 4.5rem;
}
.slot-code {
  font-size: 0.68rem;
  color: var(--fluent-text-secondary);
}
.slot-state {
  flex: 1;
  color: var(--fluent-text-secondary);
  word-break: break-all;
}
.extra-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.extra-card {
  border: 1px solid var(--pack-glass-border);
  border-radius: var(--fluent-radius);
  padding: 0.55rem;
  margin-top: 0.45rem;
  background: var(--pack-glass-fill-subtle);
}
.extra-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.4rem;
}
.extra-row label {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.72rem;
  color: var(--fluent-text-secondary);
  min-width: 120px;
}
.extra-row label.grow {
  flex: 1;
  min-width: 160px;
}
.extra-row input,
.extra-row select {
  padding: 0.35rem 0.45rem;
  border: 1px solid var(--fluent-border-control);
  border-radius: var(--fluent-radius);
  font-size: 0.78rem;
}
.file-row {
  align-items: center;
}
.file-name {
  flex: 1;
  font-size: 0.75rem;
  color: var(--fluent-text-secondary);
  word-break: break-all;
}
.empty-tip {
  font-size: 0.78rem;
  color: var(--fluent-text-secondary);
  margin-top: 0.35rem;
}
.clear-all {
  margin-top: 0.5rem;
}
.emotion-sum {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
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
