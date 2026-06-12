<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ROLE_PACK_CREATOR_MESSAGE_MAX_CHARS } from '../../lib/rolePackCreatorMessage'

export type ExportCreatorMessageKind = 'ocpak' | 'folder'

const props = defineProps<{
  open: boolean
  exportKind: ExportCreatorMessageKind | null
  initialMessage: string
}>()

const emit = defineEmits<{
  confirm: [payload: { enabled: boolean; message: string }]
  cancel: []
}>()

const { t } = useI18n()

const includeMessage = ref(false)
const messageDraft = ref('')

watch(
  () => props.open,
  (open) => {
    if (!open) return
    const initial = props.initialMessage.trim()
    includeMessage.value = initial.length > 0
    messageDraft.value = initial
  },
)

const confirmLabel = (): string => {
  const kind = props.exportKind
  if (kind === 'ocpak') return String(t('packEditor.exportCreatorMessage.confirmOcpak'))
  if (kind === 'folder') return String(t('packEditor.exportCreatorMessage.confirmFolder'))
  return String(t('packEditor.exportCreatorMessage.confirm'))
}

function onConfirm(): void {
  emit('confirm', {
    enabled: includeMessage.value,
    message: messageDraft.value,
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="export-creator-backdrop"
      role="dialog"
      aria-modal="true"
      :aria-label="String(t('packEditor.exportCreatorMessage.title'))"
      @click="emit('cancel')"
    >
      <div class="export-creator-card" @click.stop>
        <h3 class="export-creator-title">{{ t('packEditor.exportCreatorMessage.title') }}</h3>
        <p class="export-creator-lead">{{ t('packEditor.exportCreatorMessage.lead') }}</p>

        <label class="export-creator-chk">
          <input v-model="includeMessage" type="checkbox" />
          {{ t('packEditor.exportCreatorMessage.includeLabel') }}
        </label>

        <div class="export-creator-field">
          <label for="export-creator-ta" class="export-creator-field-label">
            {{ t('packEditor.exportCreatorMessage.bodyLabel') }}
          </label>
          <textarea
            id="export-creator-ta"
            v-model="messageDraft"
            class="export-creator-ta"
            rows="4"
            spellcheck="true"
            :disabled="!includeMessage"
            :placeholder="String(t('packEditor.exportCreatorMessage.placeholder'))"
          />
          <p class="export-creator-hint">
            {{
              t('packEditor.exportCreatorMessage.hint', {
                file: 'creator_message.txt',
                max: ROLE_PACK_CREATOR_MESSAGE_MAX_CHARS,
              })
            }}
          </p>
        </div>

        <div class="export-creator-actions">
          <button type="button" class="export-creator-btn export-creator-btn--primary" @click="onConfirm">
            {{ confirmLabel() }}
          </button>
          <button type="button" class="export-creator-btn export-creator-btn--ghost" @click="emit('cancel')">
            {{ t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.export-creator-backdrop {
  position: fixed;
  inset: 0;
  z-index: 112;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.45);
}

.export-creator-card {
  width: min(28rem, 100%);
  padding: 1.25rem 1.35rem 1.1rem;
  border-radius: var(--fluent-radius-lg);
  border: 1px solid var(--pack-glass-border);
  background: var(--fluent-bg-card);
  box-shadow: var(--fluent-shadow-card);
}

.export-creator-title {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}

.export-creator-lead {
  margin: 0 0 0.85rem;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: var(--fluent-text-secondary);
}

.export-creator-chk {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin-bottom: 0.65rem;
  font-size: 0.8125rem;
  cursor: pointer;
  user-select: none;
}

.export-creator-chk input {
  margin-top: 0.15rem;
  accent-color: var(--fluent-accent);
}

.export-creator-field-label {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--fluent-text-secondary);
}

.export-creator-ta {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--fluent-border-control);
  border-radius: var(--fluent-radius);
  font-size: 0.8125rem;
  line-height: 1.45;
  font-family: var(--fluent-font);
  resize: vertical;
}

.export-creator-ta:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.export-creator-hint {
  margin: 0.35rem 0 0;
  font-size: 0.72rem;
  color: var(--fluent-text-secondary);
  line-height: 1.4;
}

.export-creator-actions {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-top: 1rem;
}

.export-creator-btn {
  padding: 0.5rem 0.85rem;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--pack-glass-border);
  background: var(--pack-glass-fill-strong);
  color: var(--fluent-text-primary);
  font-size: 0.8125rem;
  font-family: var(--fluent-font);
  cursor: pointer;
}

.export-creator-btn--primary {
  background: var(--fluent-accent);
  border-color: var(--fluent-accent);
  color: #fff;
  font-weight: 600;
}

.export-creator-btn--primary:hover {
  background: var(--fluent-accent-hover);
  border-color: var(--fluent-accent-hover);
}

.export-creator-btn--ghost {
  text-align: center;
  color: var(--fluent-text-secondary);
}
</style>
