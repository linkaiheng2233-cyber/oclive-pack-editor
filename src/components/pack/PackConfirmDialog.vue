<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  open: boolean
  roleId: string
  rolesRootPath: string
}>()

const emit = defineEmits<{
  overwrite: []
  saveAsNew: []
  cancel: []
}>()

const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="pack-confirm-backdrop"
      role="dialog"
      aria-modal="true"
      :aria-label="String(t('packEditor.writeback.title'))"
      @click="emit('cancel')"
    >
      <div class="pack-confirm-card" @click.stop>
        <h3 class="pack-confirm-title">{{ t('packEditor.writeback.title') }}</h3>
        <p class="pack-confirm-lead">
          {{ t('packEditor.writeback.lead', { roleId, root: rolesRootPath }) }}
        </p>
        <div class="pack-confirm-actions">
          <button type="button" class="pack-confirm-btn pack-confirm-btn--primary" @click="emit('overwrite')">
            {{ t('packEditor.writeback.overwrite', { roleId }) }}
          </button>
          <button type="button" class="pack-confirm-btn" @click="emit('saveAsNew')">
            {{ t('packEditor.writeback.saveAsNew') }}
          </button>
          <button type="button" class="pack-confirm-btn pack-confirm-btn--ghost" @click="emit('cancel')">
            {{ t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pack-confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.45);
}

.pack-confirm-card {
  width: min(26rem, 100%);
  padding: 1.25rem 1.35rem 1.1rem;
  border-radius: var(--fluent-radius-lg);
  border: 1px solid var(--pack-glass-border);
  background: var(--fluent-bg-card);
  box-shadow: var(--fluent-shadow-card);
}

.pack-confirm-title {
  margin: 0 0 0.65rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--fluent-text-primary);
}

.pack-confirm-lead {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--fluent-text-secondary);
  word-break: break-word;
}

.pack-confirm-actions {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.pack-confirm-btn {
  padding: 0.5rem 0.85rem;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--pack-glass-border);
  background: var(--pack-glass-fill-strong);
  color: var(--fluent-text-primary);
  font-size: 0.8125rem;
  font-family: var(--fluent-font);
  cursor: pointer;
  text-align: left;
}

.pack-confirm-btn:hover {
  background: var(--fluent-bg-subtle);
}

.pack-confirm-btn--primary {
  background: var(--fluent-accent);
  border-color: var(--fluent-accent);
  color: #fff;
  font-weight: 600;
}

.pack-confirm-btn--primary:hover {
  background: var(--fluent-accent-hover);
  border-color: var(--fluent-accent-hover);
  color: #fff;
}

.pack-confirm-btn--ghost {
  text-align: center;
  color: var(--fluent-text-secondary);
}
</style>
