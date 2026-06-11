<script setup lang="ts">
import HelpHint from '../HelpHint.vue'
import { ADV_EMOTION_IMAGES } from '../../lib/advancedEditorHints'
import { CANONICAL_EMOTION_TAGS, hasEmotionTagAsset } from '../../lib/emotionAssets'
import { useI18n } from "vue-i18n";

const props = defineProps<{
  summary: string
  fileNames?: string[]
}>()

const emit = defineEmits<{
  pick: [e: Event]
  append: [e: Event]
  clear: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="emotion-row">
    <div class="emotion-label-row">
      <label class="emotion-label">{{ t("emotionAssetsControl.label") }}</label>
      <HelpHint :paragraphs="ADV_EMOTION_IMAGES" />
    </div>
    <div class="emotion-actions">
      <label class="btn-lite">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          class="sr-only"
          @change="emit('pick', $event)"
        />
        {{ t("emotionAssetsControl.pickReplace") }}
      </label>
      <label class="btn-lite">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          class="sr-only"
          @change="emit('append', $event)"
        />
        {{ t("emotionAssetsControl.append") }}
      </label>
      <button type="button" class="btn-lite ghost" @click="emit('clear')">{{ t("emotionAssetsControl.clear") }}</button>
    </div>
    <ul class="tag-grid" aria-label="canonical emotion tags">
      <li
        v-for="tag in CANONICAL_EMOTION_TAGS"
        :key="tag"
        :class="{ present: hasEmotionTagAsset(props.fileNames ?? [], tag), missing: !hasEmotionTagAsset(props.fileNames ?? [], tag) }"
      >
        <span class="tag-name">{{ tag }}</span>
        <span class="tag-state">{{ hasEmotionTagAsset(props.fileNames ?? [], tag) ? '✓' : '缺' }}</span>
      </li>
    </ul>
    <p class="emotion-sum">{{ props.summary }}</p>
  </div>
</template>

<style scoped>
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
.emotion-row .emotion-actions {
  margin-top: 0.25rem;
}
.emotion-sum {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
}
.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
}
.tag-grid li {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  border: 1px solid var(--fluent-border-stroke);
}
.tag-grid li.present {
  border-color: var(--fluent-accent, #0078d4);
}
.tag-grid li.missing {
  opacity: 0.65;
}
.tag-state {
  font-size: 0.7rem;
}
.btn-lite {
  display: inline-block;
  padding: 0.4rem 0.75rem;
  min-height: 28px;
  border: 1px solid var(--fluent-border-control);
  border-radius: var(--fluent-radius);
  background: var(--pack-glass-fill-strong);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  color: var(--fluent-text-primary);
  font-size: 0.8125rem;
  font-family: var(--fluent-font);
  cursor: pointer;
  margin-right: 0.35rem;
  margin-bottom: 0.35rem;
  box-shadow: var(--fluent-shadow-soft), var(--pack-glass-inset);
  transition:
    background 0.12s ease,
    border-color 0.12s ease,
    box-shadow 0.12s ease,
    transform 0.1s ease;
}
.btn-lite.ghost {
  border-color: var(--fluent-border-stroke);
  color: var(--fluent-text-secondary);
  box-shadow: none;
}
.btn-lite:hover {
  background: var(--fluent-bg-subtle);
  border-color: var(--fluent-text-secondary);
}

.btn-lite:focus-visible {
  outline: none;
  box-shadow:
    var(--fluent-shadow-soft),
    var(--pack-glass-inset),
    0 0 0 2px rgba(255, 255, 255, 0.92),
    0 0 0 4px var(--fluent-border-focus);
}

.btn-lite:active {
  transform: scale(0.985);
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
