<script setup lang="ts">
import EmotionAssetsControl from './EmotionAssetsControl.vue'

const manifestText = defineModel<string>('manifestText', { required: true })
const settingsText = defineModel<string>('settingsText', { required: true })
const corePersonality = defineModel<string>('corePersonality', { required: true })
const worldviewMarkdown = defineModel<string>('worldviewMarkdown', { required: true })
const advancedTab = defineModel<'manifest' | 'settings' | 'core' | 'world' | 'images'>('advancedTab', {
  required: true,
})

defineProps<{
  emotionSummary: string
}>()

const emit = defineEmits<{
  emotionPick: [e: Event]
  emotionAppend: [e: Event]
  emotionClear: []
}>()

const TAB_ORDER = ['manifest', 'settings', 'core', 'world', 'images'] as const

function onToolbarKeydown(e: KeyboardEvent): void {
  if (
    e.key !== 'ArrowLeft' &&
    e.key !== 'ArrowRight' &&
    e.key !== 'Home' &&
    e.key !== 'End'
  ) {
    return
  }
  e.preventDefault()
  const order = TAB_ORDER
  const i = order.indexOf(advancedTab.value)
  if (i < 0) return
  if (e.key === 'Home') {
    advancedTab.value = order[0]!
    return
  }
  if (e.key === 'End') {
    advancedTab.value = order[order.length - 1]!
    return
  }
  if (e.key === 'ArrowLeft') {
    advancedTab.value = order[(i - 1 + order.length) % order.length]!
  } else {
    advancedTab.value = order[(i + 1) % order.length]!
  }
}
</script>

<template>
  <div>
    <div
      class="adv-toolbar"
      role="tablist"
      aria-label="高级编辑分区"
      tabindex="0"
      @keydown="onToolbarKeydown"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="advancedTab === 'manifest'"
        :class="{ on: advancedTab === 'manifest' }"
        @click="advancedTab = 'manifest'"
      >
        manifest.json
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="advancedTab === 'settings'"
        :class="{ on: advancedTab === 'settings' }"
        @click="advancedTab = 'settings'"
      >
        settings.json
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="advancedTab === 'core'"
        :class="{ on: advancedTab === 'core' }"
        @click="advancedTab = 'core'"
      >
        core_personality.txt
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="advancedTab === 'world'"
        :class="{ on: advancedTab === 'world' }"
        @click="advancedTab = 'world'"
      >
        世界观 world.md
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="advancedTab === 'images'"
        :class="{ on: advancedTab === 'images' }"
        @click="advancedTab = 'images'"
      >
        情绪图片
      </button>
    </div>

    <section v-show="advancedTab === 'manifest'" class="panel adv-single">
      <h2>manifest.json</h2>
      <textarea v-model="manifestText" spellcheck="false" class="ta" aria-label="manifest.json" />
    </section>
    <section v-show="advancedTab === 'settings'" class="panel adv-single">
      <h2>settings.json</h2>
      <textarea v-model="settingsText" spellcheck="false" class="ta" aria-label="settings.json" />
    </section>
    <section v-show="advancedTab === 'core'" class="panel adv-single">
      <h2>core_personality.txt</h2>
      <textarea
        v-model="corePersonality"
        spellcheck="false"
        class="ta"
        aria-label="core_personality.txt"
      />
    </section>
    <section v-show="advancedTab === 'world'" class="panel adv-single">
      <h2>knowledge/world.md（Markdown）</h2>
      <textarea v-model="worldviewMarkdown" spellcheck="false" class="ta" aria-label="world.md" />
    </section>
    <section v-show="advancedTab === 'images'" class="panel adv-single">
      <h2>assets/images/</h2>
      <p class="base-desc">与简单创作相同，导出时写入角色目录下 <code>assets/images/</code>。</p>
      <EmotionAssetsControl
        :summary="emotionSummary"
        @pick="emit('emotionPick', $event)"
        @append="emit('emotionAppend', $event)"
        @clear="emit('emotionClear')"
      />
    </section>
  </div>
</template>

<style scoped>
code {
  font-size: 0.88em;
}
.base-desc {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--fluent-text-secondary);
  line-height: 1.5;
}
.adv-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 1rem;
  padding: 2px;
  border-radius: var(--fluent-radius-lg);
  background: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-stroke);
}
.adv-toolbar button {
  padding: 0.4rem 0.75rem;
  min-height: 30px;
  border-radius: calc(var(--fluent-radius-lg) - 2px);
  border: none;
  background: transparent;
  color: var(--fluent-text-primary);
  cursor: pointer;
  font-size: 0.8125rem;
  font-family: var(--fluent-font);
  font-weight: 500;
  transition: background 0.12s ease, color 0.12s ease;
}
.adv-toolbar button.on {
  background: var(--fluent-bg-card);
  color: var(--fluent-accent);
  box-shadow: var(--fluent-shadow-soft);
}
.adv-toolbar button:not(.on):hover {
  background: rgba(0, 0, 0, 0.05);
}
@media (prefers-color-scheme: dark) {
  .adv-toolbar button:not(.on):hover {
    background: rgba(255, 255, 255, 0.06);
  }
}
.adv-single {
  margin-top: 0.75rem;
  padding: 0 0.25rem;
}
.adv-single h2 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}
.ta {
  width: 100%;
  min-height: min(52vh, 420px);
  padding: 0.65rem 0.75rem;
  font-family: var(--fluent-mono);
  font-size: 12px;
  line-height: 1.45;
  border: 1px solid var(--fluent-border-control);
  border-radius: var(--fluent-radius);
  resize: vertical;
  box-sizing: border-box;
  background: var(--fluent-bg-input);
  color: var(--fluent-text-primary);
}
.ta:focus-visible {
  outline: 2px solid var(--fluent-border-focus);
  outline-offset: -1px;
}
</style>
