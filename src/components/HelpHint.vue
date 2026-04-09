<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  /** 点击问号后显示的说明；可用连续两个换行分段，或传 `paragraphs` */
  text?: string
  /** 多段说明（优先展示）；每段单独成段，便于阅读 */
  paragraphs?: readonly string[]
}>()

const segments = computed(() => {
  if (props.paragraphs?.length) {
    return props.paragraphs.map((s) => s.trim()).filter(Boolean)
  }
  const t = props.text?.trim() ?? ''
  if (!t) return []
  return t
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
})

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle(e: Event) {
  e.stopPropagation()
  open.value = !open.value
}

function onDocClick(e: MouseEvent) {
  if (!open.value) return
  const el = root.value
  if (el && !el.contains(e.target as Node)) open.value = false
}

function onDocKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onDocKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onDocKeydown)
})
</script>

<template>
  <span ref="root" class="help-hint" :class="{ 'help-hint--open': open }">
    <button
      type="button"
      class="help-btn"
      :aria-expanded="open"
      aria-label="查看说明"
      @click="toggle"
    >
      ?
    </button>
    <div v-if="open && segments.length" class="help-pop" role="tooltip">
      <p v-for="(seg, i) in segments" :key="i" class="help-pop-p">{{ seg }}</p>
    </div>
  </span>
</template>

<style scoped>
.help-hint {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  margin-left: 0.3rem;
  position: relative;
  z-index: 900;
}

.help-hint.help-hint--open {
  z-index: 980;
}

.help-btn {
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--fluent-border-control) 85%, rgba(255, 255, 255, 0.25));
  background: color-mix(in srgb, var(--fluent-bg-card) 80%, transparent);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: var(--fluent-text-secondary);
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
  box-shadow: 0 1px 2px color-mix(in srgb, var(--fluent-text-primary) 6%, transparent);
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.help-btn:hover {
  border-color: color-mix(in srgb, var(--fluent-border-focus) 45%, var(--fluent-border-control));
  color: var(--fluent-text-primary);
  background: color-mix(in srgb, var(--fluent-bg-subtle) 82%, transparent);
  box-shadow: 0 2px 6px color-mix(in srgb, var(--fluent-text-primary) 16%, transparent);
}

.help-btn:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px var(--fluent-bg-page),
    0 0 0 4px var(--fluent-border-focus);
}

.help-pop {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  z-index: 901;
  min-width: min(20rem, calc(100vw - 2rem));
  max-width: min(34rem, calc(100vw - 1.5rem));
  padding: 0.7rem 0.95rem;
  font-size: 0.8125rem;
  font-weight: 400;
  line-height: 1.55;
  color: var(--fluent-text-primary);
  background: color-mix(in srgb, var(--fluent-bg-card) 84%, transparent);
  backdrop-filter: blur(10px) saturate(108%);
  -webkit-backdrop-filter: blur(10px) saturate(108%);
  border: 1px solid var(--fluent-border-stroke);
  border-radius: var(--fluent-radius-lg);
  box-shadow:
    var(--fluent-shadow-card),
    0 14px 36px color-mix(in srgb, var(--fluent-text-primary) 10%, transparent);
  animation: help-pop-in 0.18s ease-out;
  max-height: min(70vh, 26rem);
  overflow-y: auto;
}

@keyframes help-pop-in {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.help-pop-p {
  margin: 0 0 0.55rem;
}

.help-pop-p:last-child {
  margin-bottom: 0;
}
</style>
