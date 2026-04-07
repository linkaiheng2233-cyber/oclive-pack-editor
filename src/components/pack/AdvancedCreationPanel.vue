<script setup lang="ts">
import { computed, ref } from 'vue'
import EmotionAssetsControl from './EmotionAssetsControl.vue'
import type { KnowledgeMarkdownFile } from '../../lib/knowledgeFiles'
import {
  buildKnowledgeMarkdown,
  parseKnowledgeMarkdown,
  type KnowledgeMeta,
} from '../../lib/knowledgeFrontMatter'
import { previewKnowledgeHits } from '../../lib/knowledgeHitPreview'

const manifestText = defineModel<string>('manifestText', { required: true })
const settingsText = defineModel<string>('settingsText', { required: true })
const corePersonality = defineModel<string>('corePersonality', { required: true })
const knowledgeFiles = defineModel<KnowledgeMarkdownFile[]>('knowledgeFiles', { required: true })
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
  addKnowledgeFile: []
  updateKnowledgeFile: [index: number, patch: Partial<KnowledgeMarkdownFile>]
  removeKnowledgeFile: [index: number]
}>()

const TAB_ORDER = ['manifest', 'settings', 'core', 'world', 'images'] as const
const knowledgeQuery = ref('')
const previewSceneId = ref('')
const previewStrictScene = ref(false)
const previewWeightOverrides = ref<Record<string, number>>({})

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

function docMeta(doc: KnowledgeMarkdownFile): KnowledgeMeta {
  return parseKnowledgeMarkdown(doc.content).meta
}

function docBody(doc: KnowledgeMarkdownFile): string {
  return parseKnowledgeMarkdown(doc.content).body
}

function updateMeta(index: number, patch: Partial<KnowledgeMeta>): void {
  const doc = knowledgeFiles.value[index]
  if (!doc) return
  const parsed = parseKnowledgeMarkdown(doc.content)
  const nextMeta: KnowledgeMeta = {
    ...parsed.meta,
    ...patch,
  }
  emit('updateKnowledgeFile', index, {
    content: buildKnowledgeMarkdown(nextMeta, parsed.body),
  })
}

function updateBody(index: number, body: string): void {
  const doc = knowledgeFiles.value[index]
  if (!doc) return
  const parsed = parseKnowledgeMarkdown(doc.content)
  emit('updateKnowledgeFile', index, {
    content: buildKnowledgeMarkdown(parsed.meta, body),
  })
}

const knowledgeHitPreview = computed(() =>
  previewKnowledgeHits(knowledgeFiles.value, knowledgeQuery.value, {
    sceneId: previewSceneId.value,
    strictScene: previewStrictScene.value,
  }),
)

const previewHitsWithOverrides = computed(() => {
  const enriched = knowledgeHitPreview.value.map((h) => {
    const key = `${h.path}#${h.id}`
    const override = previewWeightOverrides.value[key]
    const effectiveWeight = Number.isFinite(override) && override > 0 ? override : h.weight
    const score = Number((h.baseScore * effectiveWeight).toFixed(2))
    return {
      ...h,
      score,
      effectiveWeight,
      weightOverridden: Number.isFinite(override) && override > 0,
      key,
    }
  })
  return enriched.sort((a, b) => b.score - a.score)
})

function setPreviewWeightOverride(key: string, v: number): void {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return
  previewWeightOverrides.value = {
    ...previewWeightOverrides.value,
    [key]: Number(n.toFixed(2)),
  }
}

function resetPreviewWeightOverride(key: string): void {
  const next = { ...previewWeightOverrides.value }
  delete next[key]
  previewWeightOverrides.value = next
}

function resetAllPreviewWeightOverrides(): void {
  previewWeightOverrides.value = {}
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
      <h2>knowledge/*.md（世界观）</h2>
      <p class="base-desc">支持多个知识文档。`knowledge/world.md` 会与简单创作的「世界观」字段自动同步。</p>
      <div class="knowledge-actions">
        <button type="button" @click="emit('addKnowledgeFile')">新增知识文件</button>
      </div>
      <div class="knowledge-preview">
        <h3>知识强调预览 / 调参助手</h3>
        <p class="base-desc">输入用户消息关键词，预览哪些知识会被强调、为什么被强调（本地近似规则）。</p>
        <div class="preview-controls">
          <input
            v-model="previewSceneId"
            type="text"
            class="knowledge-scene"
            placeholder="预览条件：场景（可选），如：station"
          />
          <label class="preview-check">
            <input v-model="previewStrictScene" type="checkbox" />
            仅预览匹配该场景的知识（调试开关）
          </label>
          <button
            v-if="Object.keys(previewWeightOverrides).length"
            type="button"
            class="preview-reset"
            @click="resetAllPreviewWeightOverrides"
          >
            清空临时权重
          </button>
        </div>
        <input
          v-model="knowledgeQuery"
          type="text"
          class="knowledge-query"
          placeholder="例如：地铁 车站 到达 晚高峰"
        />
        <div v-if="knowledgeQuery.trim() && knowledgeHitPreview.length === 0" class="empty-tip">
          当前查询无命中。
        </div>
        <ul v-if="previewHitsWithOverrides.length" class="knowledge-hits">
          <li v-for="h in previewHitsWithOverrides" :key="h.key">
            <div class="hit-top">
              <code>{{ h.path }}</code>
              <strong>score {{ h.score }}</strong>
            </div>
            <div class="hit-score">
              基础分 {{ h.baseScore }} × 权重 {{ h.effectiveWeight }} = {{ h.score }}
              <span v-if="h.weightOverridden">（临时模拟，原始 {{ h.weight }}）</span>
              <span v-if="previewSceneId.trim()">
                （场景{{ h.sceneMatched ? '匹配' : '未匹配' }}）
              </span>
            </div>
            <div class="hit-weight">
              <label>
                临时权重
                <input
                  :value="h.effectiveWeight"
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  @input="setPreviewWeightOverride(h.key, Number(($event.target as HTMLInputElement).value))"
                />
              </label>
              <button
                v-if="h.weightOverridden"
                type="button"
                class="preview-reset-one"
                @click="resetPreviewWeightOverride(h.key)"
              >
                还原
              </button>
            </div>
            <div class="hit-reasons">命中原因：{{ h.reasons.join('；') }}</div>
            <ul v-if="h.snippets.length" class="hit-snippets">
              <li v-for="(s, si) in h.snippets" :key="si">{{ s }}</li>
            </ul>
          </li>
        </ul>
      </div>
      <div v-if="knowledgeFiles.length === 0" class="empty-tip">
        当前没有知识文件。可点击「新增知识文件」，或在简单创作填写世界观自动生成 `world.md`。
      </div>
      <div v-for="(d, i) in knowledgeFiles" :key="d.path + ':' + i" class="knowledge-card">
        <div class="knowledge-head">
          <input
            :value="d.path"
            type="text"
            class="knowledge-path"
            @input="emit('updateKnowledgeFile', i, { path: ($event.target as HTMLInputElement).value })"
          />
          <button type="button" class="danger" @click="emit('removeKnowledgeFile', i)">删除</button>
        </div>
        <div class="knowledge-meta">
          <label>
            <span>id</span>
            <input
              :value="docMeta(d).id"
              type="text"
              @input="updateMeta(i, { id: ($event.target as HTMLInputElement).value })"
            />
          </label>
          <label>
            <span>tags（逗号分隔）</span>
            <input
              :value="docMeta(d).tags.join(', ')"
              type="text"
              @input="
                updateMeta(i, {
                  tags: ($event.target as HTMLInputElement).value
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean),
                })
              "
            />
          </label>
          <label>
            <span>scenes（逗号分隔）</span>
            <input
              :value="docMeta(d).scenes.join(', ')"
              type="text"
              @input="
                updateMeta(i, {
                  scenes: ($event.target as HTMLInputElement).value
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean),
                })
              "
            />
          </label>
          <label>
            <span>weight</span>
            <input
              :value="docMeta(d).weight"
              type="number"
              min="0.01"
              step="0.1"
              @input="updateMeta(i, { weight: Number(($event.target as HTMLInputElement).value) })"
            />
          </label>
          <label>
            <span>event_hints（逗号分隔）</span>
            <input
              :value="docMeta(d).eventHints.join(', ')"
              type="text"
              @input="
                updateMeta(i, {
                  eventHints: ($event.target as HTMLInputElement).value
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean),
                })
              "
            />
          </label>
        </div>
        <textarea
          :value="docBody(d)"
          spellcheck="false"
          class="ta"
          :aria-label="d.path"
          @input="updateBody(i, ($event.target as HTMLTextAreaElement).value)"
        />
      </div>
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
.knowledge-actions {
  margin-bottom: 0.75rem;
}
.knowledge-preview {
  border: 1px dashed var(--fluent-border-stroke);
  border-radius: var(--fluent-radius);
  padding: 0.6rem;
  margin-bottom: 0.8rem;
}
.knowledge-preview h3 {
  margin: 0 0 0.35rem;
  font-size: 0.86rem;
}
.knowledge-query {
  width: 100%;
  padding: 0.45rem 0.55rem;
  border: 1px solid var(--fluent-border-control);
  border-radius: var(--fluent-radius);
  margin-bottom: 0.55rem;
  box-sizing: border-box;
}
.preview-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.9rem;
  align-items: center;
  margin-bottom: 0.45rem;
}
.knowledge-scene {
  min-width: 220px;
  flex: 1;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--fluent-border-control);
  border-radius: var(--fluent-radius);
}
.preview-check {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  font-size: 0.78rem;
  color: var(--fluent-text-secondary);
}
.preview-reset {
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--fluent-border-control);
  border-radius: var(--fluent-radius);
  background: var(--fluent-bg-card);
  color: var(--fluent-text-secondary);
  cursor: pointer;
  font-size: 0.75rem;
}
.knowledge-hits {
  margin: 0;
  padding-left: 1rem;
  display: grid;
  gap: 0.35rem;
}
.knowledge-hits li {
  font-size: 0.78rem;
}
.hit-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}
.hit-top code {
  font-size: 0.75rem;
}
.hit-reasons {
  color: var(--fluent-text-secondary);
}
.hit-score {
  color: var(--fluent-text-secondary);
  font-size: 0.75rem;
}
.hit-weight {
  margin-top: 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.hit-weight label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.75rem;
  color: var(--fluent-text-secondary);
}
.hit-weight input[type='range'] {
  width: 150px;
}
.preview-reset-one {
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--fluent-border-control);
  border-radius: var(--fluent-radius);
  background: var(--fluent-bg-subtle);
  color: var(--fluent-text-secondary);
  cursor: pointer;
  font-size: 0.72rem;
}
.hit-snippets {
  margin: 0.2rem 0 0;
  padding-left: 1rem;
  color: var(--fluent-text-secondary);
  font-size: 0.75rem;
}
.knowledge-actions button {
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--fluent-border-control);
  border-radius: var(--fluent-radius);
  background: var(--fluent-bg-card);
  color: var(--fluent-text-primary);
  cursor: pointer;
}
.empty-tip {
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
  margin-bottom: 0.75rem;
}
.knowledge-card {
  border: 1px solid var(--fluent-border-stroke);
  border-radius: var(--fluent-radius-lg);
  padding: 0.6rem;
  background: var(--fluent-bg-subtle);
  margin-bottom: 0.75rem;
}
.knowledge-head {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.knowledge-path {
  flex: 1;
  padding: 0.4rem 0.55rem;
  border: 1px solid var(--fluent-border-control);
  border-radius: var(--fluent-radius);
  font-family: var(--fluent-mono);
  font-size: 0.8125rem;
}
.knowledge-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}
.knowledge-meta label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.75rem;
  color: var(--fluent-text-secondary);
}
.knowledge-meta input {
  padding: 0.38rem 0.5rem;
  border: 1px solid var(--fluent-border-control);
  border-radius: var(--fluent-radius);
  font-size: 0.8rem;
  font-family: var(--fluent-font);
}
.danger {
  padding: 0.35rem 0.65rem;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--fluent-danger-border);
  background: var(--fluent-danger-bg);
  color: var(--fluent-danger-text);
  cursor: pointer;
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
@media (max-width: 860px) {
  .knowledge-meta {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
  }
}
@media (max-width: 560px) {
  .knowledge-meta {
    grid-template-columns: 1fr;
  }
}
</style>
