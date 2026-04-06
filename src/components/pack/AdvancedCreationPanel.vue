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
</script>

<template>
  <div>
    <div class="adv-toolbar" role="tablist" aria-label="高级编辑分区">
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
  margin: 0 0 0.65rem;
  font-size: 0.85rem;
  color: #444;
  line-height: 1.45;
}
.adv-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 1rem;
}
.adv-toolbar button {
  padding: 0.4rem 0.65rem;
  border-radius: 6px;
  border: 1px solid #bbb;
  background: #fff;
  cursor: pointer;
  font-size: 0.82rem;
}
.adv-toolbar button.on {
  background: #1a1a1a;
  color: #fff;
  border-color: #1a1a1a;
}
.adv-single {
  margin-top: 0.65rem;
}
.adv-single h2 {
  font-size: 0.95rem;
  margin: 0 0 0.35rem;
}
.ta {
  width: 100%;
  min-height: min(52vh, 420px);
  padding: 0.6rem 0.65rem;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.4;
  border: 1px solid #ccc;
  border-radius: 6px;
  resize: vertical;
  box-sizing: border-box;
}
</style>
