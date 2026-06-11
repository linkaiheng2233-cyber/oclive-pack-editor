<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  message: string
  isError: boolean
  validationErrors: string[]
}>()

const { t } = useI18n()
const visible = ref(false)
const expanded = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | undefined

function clearHideTimer(): void {
  if (hideTimer !== undefined) {
    clearTimeout(hideTimer)
    hideTimer = undefined
  }
}

function scheduleAutoHide(): void {
  clearHideTimer()
  if (!props.message || props.isError) return
  hideTimer = setTimeout(() => {
    visible.value = false
  }, 4000)
}

function showBar(): void {
  if (!props.message && props.validationErrors.length === 0) {
    visible.value = false
    return
  }
  visible.value = true
  expanded.value = false
  scheduleAutoHide()
}

watch(
  () => [props.message, props.isError, props.validationErrors.length] as const,
  () => {
    showBar()
  },
  { immediate: true },
)

function dismiss(): void {
  clearHideTimer()
  visible.value = false
  expanded.value = false
}

function toggleExpanded(): void {
  expanded.value = !expanded.value
}

onBeforeUnmount(() => {
  clearHideTimer()
})
</script>

<template>
  <div
    v-if="visible && (message || validationErrors.length)"
    class="pack-toast-bar"
    :class="{
      'pack-toast-bar--ok': !isError && !validationErrors.length,
      'pack-toast-bar--err': isError || validationErrors.length > 0,
    }"
    role="status"
    aria-live="polite"
  >
    <div class="ptb-row">
      <p class="ptb-msg">
        <template v-if="validationErrors.length && isError">
          {{ t('packEditor.toast.errorCount', { count: validationErrors.length }) }}
          <span v-if="validationErrors[0]" class="ptb-summary"> — {{ validationErrors[0] }}</span>
        </template>
        <template v-else-if="message">
          {{ message }}
        </template>
        <template v-else-if="validationErrors.length">
          {{ t('packEditor.toast.errorCount', { count: validationErrors.length }) }}
        </template>
      </p>
      <div class="ptb-actions">
        <button
          v-if="validationErrors.length > 1"
          type="button"
          class="ptb-btn"
          @click="toggleExpanded"
        >
          {{ expanded ? t('packEditor.toast.collapse') : t('packEditor.toast.expand') }}
        </button>
        <button type="button" class="ptb-btn ptb-btn--dismiss" :aria-label="String(t('packEditor.toast.dismiss'))" @click="dismiss">
          ×
        </button>
      </div>
    </div>
    <ul v-if="expanded && validationErrors.length" class="ptb-errors">
      <li v-for="(e, i) in validationErrors.slice(0, 5)" :key="i">{{ e }}</li>
      <li v-if="validationErrors.length > 5" class="ptb-more">
        {{ t('packEditor.toast.moreErrors', { count: validationErrors.length - 5 }) }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.pack-toast-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  margin: -0.35rem 0 0.85rem;
  padding: 0.55rem 0.85rem;
  border-radius: var(--fluent-radius-lg);
  font-size: 0.8125rem;
  line-height: 1.45;
  box-shadow: var(--fluent-shadow-soft);
}

.pack-toast-bar--ok {
  color: var(--fluent-success-text);
  background: rgba(16, 124, 16, 0.1);
  border: 1px solid rgba(16, 124, 16, 0.35);
}

.pack-toast-bar--err {
  color: var(--fluent-danger-text);
  background: var(--fluent-danger-bg);
  border: 1px solid var(--fluent-danger-border);
}

.ptb-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
}

.ptb-msg {
  margin: 0;
  flex: 1;
  min-width: 0;
}

.ptb-summary {
  opacity: 0.92;
}

.ptb-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.ptb-btn {
  padding: 0.15rem 0.45rem;
  border: 1px solid transparent;
  border-radius: var(--fluent-radius);
  background: transparent;
  color: inherit;
  font-size: 0.75rem;
  font-family: var(--fluent-font);
  cursor: pointer;
  opacity: 0.85;
}

.ptb-btn:hover {
  opacity: 1;
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.ptb-btn--dismiss {
  font-size: 1rem;
  line-height: 1;
  padding: 0.1rem 0.35rem;
}

.ptb-errors {
  margin: 0.45rem 0 0;
  padding-left: 1.15rem;
}

.ptb-errors li {
  margin-top: 0.2rem;
}

.ptb-more {
  list-style: none;
  margin-left: -1.15rem;
  font-size: 0.75rem;
  opacity: 0.85;
}
</style>
