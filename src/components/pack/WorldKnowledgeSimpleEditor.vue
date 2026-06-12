<script setup lang="ts">
import HelpHint from '../HelpHint.vue'
import type { WorldKnowledgeTexts } from '../../lib/worldKnowledgeUser'
import { useI18n } from 'vue-i18n'

const texts = defineModel<WorldKnowledgeTexts>({ required: true })

const { t } = useI18n()

const FIELDS: Array<{ key: keyof WorldKnowledgeTexts; hintKey: string }> = [
  { key: 'dialogueWorldview', hintKey: 'worldKnowledge.dialogueWorldviewHint' },
  { key: 'knowledgeBoundary', hintKey: 'worldKnowledge.knowledgeBoundaryHint' },
]
</script>

<template>
  <div class="world-knowledge-editor">
    <div class="section-head">
      <h3 class="section-title">{{ t('worldKnowledge.sectionTitle') }}</h3>
      <p class="section-lead">{{ t('worldKnowledge.sectionLead') }}</p>
    </div>
    <HelpHint :paragraphs="[t('worldKnowledge.hint')]" />

    <div v-for="field in FIELDS" :key="field.key" class="field-block">
      <label class="field-label">{{ t(`worldKnowledge.${field.key}Label`) }}</label>
      <p class="field-hint">{{ t(field.hintKey) }}</p>
      <textarea
        v-model="texts[field.key]"
        class="field-ta"
        rows="5"
        spellcheck="true"
        :placeholder="t(`worldKnowledge.${field.key}Placeholder`)"
      />
      <p class="field-file">{{ t('worldKnowledge.writesTo', { path: t(`worldKnowledge.${field.key}Path`) }) }}</p>
    </div>
  </div>
</template>

<style scoped>
.world-knowledge-editor {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.section-head {
  margin-bottom: 0.15rem;
}
.section-title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
}
.section-lead {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: var(--fluent-text-secondary);
}
.field-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
}
.field-hint {
  margin: 0;
  font-size: 0.72rem;
  color: var(--fluent-text-secondary);
}
.field-ta {
  width: 100%;
  padding: 0.45rem 0.55rem;
  border: 1px solid var(--fluent-border-control);
  border-radius: var(--fluent-radius);
  font-size: 0.82rem;
  line-height: 1.45;
  resize: vertical;
}
.field-file {
  margin: 0;
  font-size: 0.68rem;
  color: var(--fluent-text-secondary);
}
</style>
