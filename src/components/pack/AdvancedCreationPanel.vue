<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from "vue-i18n";
import EmotionAssetsControl from './EmotionAssetsControl.vue'
import type { KnowledgeMarkdownFile } from '../../lib/knowledgeFiles'
import {
  buildKnowledgeMarkdown,
  parseKnowledgeMarkdown,
  type KnowledgeMeta,
} from '../../lib/knowledgeFrontMatter'
import { previewKnowledgeHits } from '../../lib/knowledgeHitPreview'
import type { CreatorMessageExportMode } from '../../lib/rolePackCreatorMessage'
import {
  CORE_FAQ,
  CREATOR_MSG_FAQ,
  IMAGES_FAQ,
  KNOWLEDGE_FILE_FAQ,
  KNOWLEDGE_PREVIEW_FAQ,
  MANIFEST_FAQ,
  SETTINGS_FAQ,
} from '../../lib/advancedEditorFaq'
import {
  ADV_CORE_TXT,
  ADV_CREATOR_MESSAGE,
  ADV_KNOWLEDGE_PREVIEW,
  ADV_MANIFEST,
  ADV_OVERVIEW,
  ADV_SETTINGS,
  ADV_WORLD_KNOWLEDGE,
  CORE_PERSONALITY_SCOPE_GUIDE,
  CREATOR_MSG_SCOPE_GUIDE,
  EMOTION_ASSET_SCOPE_GUIDE,
  KNOWLEDGE_FILE_SCOPE_GUIDE,
  KNOWLEDGE_META_GUIDE,
  KNOWLEDGE_PREVIEW_SCOPE_GUIDE,
  MANIFEST_FIELD_SCOPE_GUIDE,
  MANIFEST_KEY_GUIDE,
  MANIFEST_MERGE_NOTE,
  SETTINGS_FIELD_SCOPE_GUIDE,
  SETTINGS_KEY_GUIDE,
  SETTINGS_MERGE_NOTE,
} from '../../lib/advancedEditorHints'
import AdvFaqList from '../AdvFaqList.vue'
import HelpHint from '../HelpHint.vue'

const { t } = useI18n()

const manifestText = defineModel<string>('manifestText', { required: true })
const settingsText = defineModel<string>('settingsText', { required: true })
const corePersonality = defineModel<string>('corePersonality', { required: true })
const creatorMessageToOthers = defineModel<string>('creatorMessageToOthers', { default: '' })
const creatorMessageMode = defineModel<CreatorMessageExportMode>('creatorMessageMode', {
  default: 'unified',
})
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
    <p class="adv-toolbar-lead">
      {{ t("advancedCreation.toolbar.leadPrefix") }}
      <span class="hint-ico" aria-hidden="true">?</span>{{ t("advancedCreation.toolbar.leadSuffix") }}
      <HelpHint :paragraphs="ADV_OVERVIEW" />
    </p>
    <div
      class="adv-toolbar"
      role="tablist"
      :aria-label="String(t('advancedCreation.toolbar.aria'))"
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
        <span class="tab-stack">
          <span class="tab-title">{{ t("advancedCreation.tabs.manifest") }}</span>
          <span class="tab-file">manifest.json</span>
        </span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="advancedTab === 'settings'"
        :class="{ on: advancedTab === 'settings' }"
        @click="advancedTab = 'settings'"
      >
        <span class="tab-stack">
          <span class="tab-title">{{ t("advancedCreation.tabs.settings") }}</span>
          <span class="tab-file">settings.json</span>
        </span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="advancedTab === 'core'"
        :class="{ on: advancedTab === 'core' }"
        @click="advancedTab = 'core'"
      >
        <span class="tab-stack">
          <span class="tab-title">{{ t("advancedCreation.tabs.core") }}</span>
          <span class="tab-file">{{ t("advancedCreation.tabs.coreFile") }}</span>
        </span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="advancedTab === 'world'"
        :class="{ on: advancedTab === 'world' }"
        @click="advancedTab = 'world'"
      >
        <span class="tab-stack">
          <span class="tab-title">{{ t("advancedCreation.tabs.world") }}</span>
          <span class="tab-file">knowledge/*.md</span>
        </span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="advancedTab === 'images'"
        :class="{ on: advancedTab === 'images' }"
        @click="advancedTab = 'images'"
      >
        <span class="tab-stack">
          <span class="tab-title">{{ t("advancedCreation.tabs.images") }}</span>
          <span class="tab-file">assets/images</span>
        </span>
      </button>
    </div>

    <section v-show="advancedTab === 'manifest'" class="panel adv-single">
      <div class="adv-section-head">
        <h2 class="adv-h2">
          <span>{{ t("advancedCreation.sections.manifest.title") }}</span>
          <HelpHint :paragraphs="ADV_MANIFEST" />
        </h2>
        <p class="adv-lead">{{ t("advancedCreation.sections.manifest.lead") }}</p>
        <details class="adv-key-map">
          <summary>{{ t("advancedCreation.sections.manifest.keyMapSummary") }}</summary>
          <ul class="adv-key-list">
            <li v-for="row in MANIFEST_KEY_GUIDE" :key="row.key">
              <code>{{ row.key }}</code>
              <span class="adv-key-say">{{ row.say }}</span>
            </li>
          </ul>
        </details>
      </div>
      <textarea v-model="manifestText" spellcheck="false" class="ta" aria-label="manifest.json" />
      <div class="adv-dock-stack">
        <details
          class="adv-examples-dock adv-examples-dock--collapsible adv-examples-dock--keypoints"
          :aria-label="String(t('advancedCreation.sections.manifest.docks.keypointsAria'))"
        >
          <summary class="adv-examples-dock-summary">
            <span class="adv-examples-badge">{{ t("advancedCreation.docks.badges.keypoints") }}</span>
            <span class="adv-examples-dock-title">{{ t("advancedCreation.sections.manifest.docks.keypointsTitle") }}</span>
          </summary>
          <div class="adv-examples-dock-body">
            <p class="adv-merge-note">{{ MANIFEST_MERGE_NOTE }}</p>
            <p class="adv-examples-dock-note">
              {{ t("advancedCreation.sections.manifest.docks.keypointsNotePrefix") }}<strong>{{ t("advancedCreation.sections.manifest.docks.keypointsNoteStrong") }}</strong>{{ t("advancedCreation.sections.manifest.docks.keypointsNoteSuffix") }}
            </p>
            <h4 class="adv-ex-part">{{ t("advancedCreation.docks.eachItemTitle") }}</h4>
            <div class="adv-scope-matrix">
              <ul class="adv-scope-list">
                <li v-for="row in MANIFEST_FIELD_SCOPE_GUIDE" :key="row.field" class="adv-scope-li">
                  <code class="adv-scope-field">{{ row.field }}</code>
                  <p class="adv-scope-mean">{{ row.meaning }}</p>
                  <p class="adv-scope-scope">
                    <strong>{{ t("advancedCreation.docks.scopeStrong") }}</strong>{{ row.scope }}
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </details>
        <details
          class="adv-examples-dock adv-examples-dock--collapsible adv-examples-dock--faq"
          :aria-label="String(t('advancedCreation.sections.manifest.docks.faqAria'))"
        >
          <summary class="adv-examples-dock-summary">
            <span class="adv-examples-badge adv-examples-badge--faq">{{ t("advancedCreation.docks.badges.faq") }}</span>
            <span class="adv-examples-dock-title">{{ t("advancedCreation.sections.manifest.docks.faqTitle") }}</span>
          </summary>
          <div class="adv-examples-dock-body">
            <AdvFaqList :items="MANIFEST_FAQ" show-intro />
          </div>
        </details>
      </div>
    </section>
    <section v-show="advancedTab === 'settings'" class="panel adv-single">
      <div class="adv-section-head">
        <h2 class="adv-h2">
          <span>{{ t("advancedCreation.sections.settings.title") }}</span>
          <HelpHint :paragraphs="ADV_SETTINGS" />
        </h2>
        <p class="adv-lead">{{ t("advancedCreation.sections.settings.lead") }}</p>
        <details class="adv-key-map">
          <summary>{{ t("advancedCreation.sections.settings.keyMapSummary") }}</summary>
          <ul class="adv-key-list">
            <li v-for="row in SETTINGS_KEY_GUIDE" :key="row.key">
              <code>{{ row.key }}</code>
              <span class="adv-key-say">{{ row.say }}</span>
            </li>
          </ul>
        </details>
      </div>
      <textarea v-model="settingsText" spellcheck="false" class="ta" aria-label="settings.json" />
      <div class="adv-dock-stack">
        <details
          class="adv-examples-dock adv-examples-dock--collapsible adv-examples-dock--keypoints"
          :aria-label="String(t('advancedCreation.sections.settings.docks.keypointsAria'))"
        >
          <summary class="adv-examples-dock-summary">
            <span class="adv-examples-badge">{{ t("advancedCreation.docks.badges.keypoints") }}</span>
            <span class="adv-examples-dock-title">{{ t("advancedCreation.sections.settings.docks.keypointsTitle") }}</span>
          </summary>
          <div class="adv-examples-dock-body">
            <p class="adv-merge-note">{{ SETTINGS_MERGE_NOTE }}</p>
            <p class="adv-examples-dock-note">
              {{ t("advancedCreation.sections.settings.docks.keypointsNotePrefix") }}<strong>{{ t("advancedCreation.sections.settings.docks.keypointsNoteStrong") }}</strong>{{ t("advancedCreation.sections.settings.docks.keypointsNoteSuffix") }}
            </p>
            <h4 class="adv-ex-part">{{ t("advancedCreation.docks.eachItemTitle") }}</h4>
            <div class="adv-scope-matrix">
              <ul class="adv-scope-list">
                <li v-for="row in SETTINGS_FIELD_SCOPE_GUIDE" :key="row.field" class="adv-scope-li">
                  <code class="adv-scope-field">{{ row.field }}</code>
                  <p class="adv-scope-mean">{{ row.meaning }}</p>
                  <p class="adv-scope-scope">
                    <strong>{{ t("advancedCreation.docks.scopeStrong") }}</strong>{{ row.scope }}
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </details>
        <details
          class="adv-examples-dock adv-examples-dock--collapsible adv-examples-dock--faq"
          :aria-label="String(t('advancedCreation.sections.settings.docks.faqAria'))"
        >
          <summary class="adv-examples-dock-summary">
            <span class="adv-examples-badge adv-examples-badge--faq">{{ t("advancedCreation.docks.badges.faq") }}</span>
            <span class="adv-examples-dock-title">{{ t("advancedCreation.sections.settings.docks.faqTitle") }}</span>
          </summary>
          <div class="adv-examples-dock-body">
            <AdvFaqList :items="SETTINGS_FAQ" />
          </div>
        </details>
      </div>
    </section>
    <section v-show="advancedTab === 'core'" class="panel adv-single">
      <div class="adv-section-head">
        <h2 class="adv-h2">
          <span>{{ t("advancedCreation.sections.core.coreTitle") }}</span>
          <HelpHint :paragraphs="ADV_CORE_TXT" />
        </h2>
        <p class="adv-lead">{{ t("advancedCreation.sections.core.coreLead") }}</p>
      </div>
      <textarea
        v-model="corePersonality"
        spellcheck="false"
        class="ta"
        aria-label="core_personality.txt"
      />
      <div class="adv-dock-stack">
        <details
          class="adv-examples-dock adv-examples-dock--collapsible adv-examples-dock--keypoints"
          :aria-label="String(t('advancedCreation.sections.core.coreDocks.keypointsAria'))"
        >
          <summary class="adv-examples-dock-summary">
            <span class="adv-examples-badge">{{ t("advancedCreation.docks.badges.keypoints") }}</span>
            <span class="adv-examples-dock-title">{{ t("advancedCreation.sections.core.coreDocks.keypointsTitle") }}</span>
          </summary>
          <div class="adv-examples-dock-body">
            <h4 class="adv-ex-part">{{ t("advancedCreation.sections.core.coreDocks.scopeTitle") }}</h4>
            <div class="adv-scope-matrix">
              <ul class="adv-scope-list">
                <li v-for="row in CORE_PERSONALITY_SCOPE_GUIDE" :key="row.field" class="adv-scope-li">
                  <code class="adv-scope-field">{{ row.field }}</code>
                  <p class="adv-scope-mean">{{ row.meaning }}</p>
                  <p class="adv-scope-scope">
                    <strong>{{ t("advancedCreation.docks.scopeStrong") }}</strong>{{ row.scope }}
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </details>
        <details
          class="adv-examples-dock adv-examples-dock--collapsible adv-examples-dock--faq"
          :aria-label="String(t('advancedCreation.sections.core.coreDocks.faqAria'))"
        >
          <summary class="adv-examples-dock-summary">
            <span class="adv-examples-badge adv-examples-badge--faq">{{ t("advancedCreation.docks.badges.faq") }}</span>
            <span class="adv-examples-dock-title">{{ t("advancedCreation.sections.core.coreDocks.faqTitle") }}</span>
          </summary>
          <div class="adv-examples-dock-body">
            <p class="adv-examples-dock-note">
              {{ t("advancedCreation.sections.core.coreDocks.faqNotePrefix") }}<strong>{{ t("advancedCreation.sections.core.coreDocks.faqNoteStrong") }}</strong>{{ t("advancedCreation.sections.core.coreDocks.faqNoteSuffix") }}
            </p>
            <AdvFaqList :items="CORE_FAQ" />
          </div>
        </details>
      </div>
      <div class="adv-section-head h2-spaced">
        <h2 class="adv-h2">
          <span>{{ t("advancedCreation.sections.core.creatorMsgTitle") }}</span>
          <HelpHint :paragraphs="ADV_CREATOR_MESSAGE" />
        </h2>
        <p class="adv-lead">{{ t("advancedCreation.sections.core.creatorMsgLead") }}</p>
      </div>
      <div
        class="creator-msg-mode"
        role="radiogroup"
        :aria-label="String(t('advancedCreation.sections.core.creatorMsgModeAria'))"
      >
        <label class="radio-line">
          <input v-model="creatorMessageMode" type="radio" value="unified" />
          {{ t("advancedCreation.sections.core.creatorMsgModes.unified") }}
        </label>
        <label class="radio-line">
          <input v-model="creatorMessageMode" type="radio" value="per_module" />
          {{ t("advancedCreation.sections.core.creatorMsgModes.perModule") }}
        </label>
      </div>
      <textarea
        v-model="creatorMessageToOthers"
        class="ta ta--short"
        :rows="creatorMessageMode === 'unified' ? 3 : 6"
        spellcheck="true"
        aria-label="creator_message.txt"
      />
      <div class="adv-dock-stack">
        <details
          class="adv-examples-dock adv-examples-dock--collapsible adv-examples-dock--keypoints"
          :aria-label="String(t('advancedCreation.sections.core.creatorMsgDocks.keypointsAria'))"
        >
          <summary class="adv-examples-dock-summary">
            <span class="adv-examples-badge">{{ t("advancedCreation.docks.badges.keypoints") }}</span>
            <span class="adv-examples-dock-title">{{ t("advancedCreation.sections.core.creatorMsgDocks.keypointsTitle") }}</span>
          </summary>
          <div class="adv-examples-dock-body">
            <h4 class="adv-ex-part">{{ t("advancedCreation.sections.core.creatorMsgDocks.scopeTitle") }}</h4>
            <div class="adv-scope-matrix">
              <ul class="adv-scope-list">
                <li v-for="row in CREATOR_MSG_SCOPE_GUIDE" :key="row.field" class="adv-scope-li">
                  <code class="adv-scope-field">{{ row.field }}</code>
                  <p class="adv-scope-mean">{{ row.meaning }}</p>
                  <p class="adv-scope-scope">
                    <strong>{{ t("advancedCreation.docks.scopeStrong") }}</strong>{{ row.scope }}
                  </p>
                </li>
              </ul>
            </div>
            <p class="adv-examples-dock-note">
              {{ t("advancedCreation.sections.core.creatorMsgDocks.notePrefix") }}<strong>{{ t("advancedCreation.sections.core.creatorMsgDocks.noteStrongUnified") }}</strong>{{ t("advancedCreation.sections.core.creatorMsgDocks.noteMiddle") }}<strong>{{ t("advancedCreation.sections.core.creatorMsgDocks.noteStrongPerModule") }}</strong>{{ t("advancedCreation.sections.core.creatorMsgDocks.noteSuffix") }}
            </p>
          </div>
        </details>
        <details
          class="adv-examples-dock adv-examples-dock--collapsible adv-examples-dock--faq"
          :aria-label="String(t('advancedCreation.sections.core.creatorMsgDocks.faqAria'))"
        >
          <summary class="adv-examples-dock-summary">
            <span class="adv-examples-badge adv-examples-badge--faq">{{ t("advancedCreation.docks.badges.faq") }}</span>
            <span class="adv-examples-dock-title">{{ t("advancedCreation.sections.core.creatorMsgDocks.faqTitle") }}</span>
          </summary>
          <div class="adv-examples-dock-body">
            <AdvFaqList :items="CREATOR_MSG_FAQ" />
          </div>
        </details>
      </div>
    </section>
    <section v-show="advancedTab === 'world'" class="panel adv-single">
      <div class="adv-section-head">
        <h2 class="adv-h2">
          <span>{{ t("advancedCreation.sections.world.title") }}</span>
          <HelpHint :paragraphs="ADV_WORLD_KNOWLEDGE" />
        </h2>
        <p class="adv-lead">
          {{ t("advancedCreation.sections.world.lead") }}
        </p>
        <details class="adv-key-map">
          <summary>{{ t("advancedCreation.sections.world.metaSummary") }}</summary>
          <ul class="adv-key-list">
            <li v-for="row in KNOWLEDGE_META_GUIDE" :key="row.key">
              <code>{{ row.key }}</code>
              <span class="adv-key-say">{{ row.say }}</span>
            </li>
          </ul>
        </details>
      </div>
      <div class="knowledge-actions">
        <button type="button" @click="emit('addKnowledgeFile')">{{ t("advancedCreation.sections.world.addKnowledgeFile") }}</button>
      </div>
      <div class="knowledge-preview">
        <h3 class="adv-h3">
          <span>{{ t("advancedCreation.sections.world.preview.title") }}</span>
          <HelpHint :paragraphs="ADV_KNOWLEDGE_PREVIEW" />
        </h3>
        <p class="base-desc">{{ t("advancedCreation.sections.world.preview.desc") }}</p>
        <div class="preview-controls">
          <input
            v-model="previewSceneId"
            type="text"
            class="knowledge-scene"
            :placeholder="String(t('advancedCreation.sections.world.preview.scenePlaceholder'))"
          />
          <label class="preview-check">
            <input v-model="previewStrictScene" type="checkbox" />
            {{ t("advancedCreation.sections.world.preview.strictScene") }}
          </label>
          <button
            v-if="Object.keys(previewWeightOverrides).length"
            type="button"
            class="preview-reset"
            @click="resetAllPreviewWeightOverrides"
          >
            {{ t("advancedCreation.sections.world.preview.resetAllWeights") }}
          </button>
        </div>
        <input
          v-model="knowledgeQuery"
          type="text"
          class="knowledge-query"
          :placeholder="String(t('advancedCreation.sections.world.preview.queryPlaceholder'))"
        />
        <div v-if="knowledgeQuery.trim() && knowledgeHitPreview.length === 0" class="empty-tip">
          {{ t("advancedCreation.sections.world.preview.noHits") }}
        </div>
        <ul v-if="previewHitsWithOverrides.length" class="knowledge-hits">
          <li v-for="h in previewHitsWithOverrides" :key="h.key">
            <div class="hit-top">
              <code>{{ h.path }}</code>
              <strong>score {{ h.score }}</strong>
            </div>
            <div class="hit-score">
              {{
                t("advancedCreation.sections.world.preview.scoreLine", {
                  base: h.baseScore,
                  weight: h.effectiveWeight,
                  score: h.score,
                })
              }}
              <span v-if="h.weightOverridden">{{
                t("advancedCreation.sections.world.preview.weightOverridden", { weight: h.weight })
              }}</span>
              <span v-if="previewSceneId.trim()">
                ({{
                  t("advancedCreation.sections.world.preview.sceneMatched", {
                    matched: h.sceneMatched
                      ? t("advancedCreation.sections.world.preview.sceneMatchedYes")
                      : t("advancedCreation.sections.world.preview.sceneMatchedNo"),
                  })
                }})
              </span>
            </div>
            <div class="hit-weight">
              <label>
                {{ t("advancedCreation.sections.world.preview.tempWeight") }}
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
                {{ t("advancedCreation.sections.world.preview.resetOne") }}
              </button>
            </div>
            <div class="hit-reasons">
              {{ t("advancedCreation.sections.world.preview.reasons", { reasons: h.reasons.join("；") }) }}
            </div>
            <ul v-if="h.snippets.length" class="hit-snippets">
              <li v-for="(s, si) in h.snippets" :key="si">{{ s }}</li>
            </ul>
          </li>
        </ul>
      </div>
      <div class="adv-dock-stack">
        <details
          class="adv-examples-dock adv-examples-dock--collapsible adv-examples-dock--keypoints"
          :aria-label="String(t('advancedCreation.sections.world.previewDocks.keypointsAria'))"
        >
          <summary class="adv-examples-dock-summary">
            <span class="adv-examples-badge">{{ t("advancedCreation.docks.badges.keypoints") }}</span>
            <span class="adv-examples-dock-title">{{ t("advancedCreation.sections.world.previewDocks.keypointsTitle") }}</span>
          </summary>
          <div class="adv-examples-dock-body">
            <h4 class="adv-ex-part">{{ t("advancedCreation.sections.world.previewDocks.eachControlTitle") }}</h4>
            <div class="adv-scope-matrix">
              <ul class="adv-scope-list">
                <li v-for="row in KNOWLEDGE_PREVIEW_SCOPE_GUIDE" :key="row.field" class="adv-scope-li">
                  <code class="adv-scope-field">{{ row.field }}</code>
                  <p class="adv-scope-mean">{{ row.meaning }}</p>
                  <p class="adv-scope-scope">
                    <strong>{{ t("advancedCreation.docks.scopeStrong") }}</strong>{{ row.scope }}
                  </p>
                </li>
              </ul>
            </div>
            <p class="adv-examples-dock-note">
              {{ t("advancedCreation.sections.world.previewDocks.notePrefix") }}<strong>{{ t("advancedCreation.sections.world.previewDocks.noteStrong") }}</strong>{{ t("advancedCreation.sections.world.previewDocks.noteSuffix") }}
            </p>
          </div>
        </details>
        <details
          class="adv-examples-dock adv-examples-dock--collapsible adv-examples-dock--faq"
          :aria-label="String(t('advancedCreation.sections.world.previewDocks.faqAria'))"
        >
          <summary class="adv-examples-dock-summary">
            <span class="adv-examples-badge adv-examples-badge--faq">{{ t("advancedCreation.docks.badges.faq") }}</span>
            <span class="adv-examples-dock-title">{{ t("advancedCreation.sections.world.previewDocks.faqTitle") }}</span>
          </summary>
          <div class="adv-examples-dock-body">
            <AdvFaqList :items="KNOWLEDGE_PREVIEW_FAQ" />
          </div>
        </details>
      </div>
      <div v-if="knowledgeFiles.length === 0" class="empty-tip">
        {{ t("advancedCreation.sections.world.emptyNoFiles") }}
      </div>
      <div v-for="(d, i) in knowledgeFiles" :key="d.path + ':' + i" class="knowledge-card">
        <div class="knowledge-head">
          <input
            :value="d.path"
            type="text"
            class="knowledge-path"
            @input="emit('updateKnowledgeFile', i, { path: ($event.target as HTMLInputElement).value })"
          />
          <button type="button" class="danger" @click="emit('removeKnowledgeFile', i)">{{ t("advancedCreation.sections.world.delete") }}</button>
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
            <span>{{ t("advancedCreation.sections.world.meta.tagsCsv") }}</span>
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
            <span>{{ t("advancedCreation.sections.world.meta.scenesCsv") }}</span>
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
            <span>{{ t("advancedCreation.sections.world.meta.eventHintsCsv") }}</span>
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
      <div class="adv-dock-stack">
        <details
          class="adv-examples-dock adv-examples-dock--collapsible adv-examples-dock--keypoints"
          :aria-label="String(t('advancedCreation.sections.world.fileDocks.keypointsAria'))"
        >
          <summary class="adv-examples-dock-summary">
            <span class="adv-examples-badge">{{ t("advancedCreation.docks.badges.keypoints") }}</span>
            <span class="adv-examples-dock-title">{{ t("advancedCreation.sections.world.fileDocks.keypointsTitle") }}</span>
          </summary>
          <div class="adv-examples-dock-body">
            <h4 class="adv-ex-part">{{ t("advancedCreation.sections.world.fileDocks.eachPartTitle") }}</h4>
            <div class="adv-scope-matrix">
              <ul class="adv-scope-list">
                <li v-for="row in KNOWLEDGE_FILE_SCOPE_GUIDE" :key="row.field" class="adv-scope-li">
                  <code class="adv-scope-field">{{ row.field }}</code>
                  <p class="adv-scope-mean">{{ row.meaning }}</p>
                  <p class="adv-scope-scope">
                    <strong>{{ t("advancedCreation.docks.scopeStrong") }}</strong>{{ row.scope }}
                  </p>
                </li>
              </ul>
            </div>
            <p class="adv-examples-dock-note">
              {{ t("advancedCreation.sections.world.fileDocks.notePrefix") }}<strong>{{ t("advancedCreation.sections.world.fileDocks.noteStrong") }}</strong>{{ t("advancedCreation.sections.world.fileDocks.noteSuffix") }}
            </p>
          </div>
        </details>
        <details
          class="adv-examples-dock adv-examples-dock--collapsible adv-examples-dock--faq"
          :aria-label="String(t('advancedCreation.sections.world.fileDocks.faqAria'))"
        >
          <summary class="adv-examples-dock-summary">
            <span class="adv-examples-badge adv-examples-badge--faq">{{ t("advancedCreation.docks.badges.faq") }}</span>
            <span class="adv-examples-dock-title">{{ t("advancedCreation.sections.world.fileDocks.faqTitle") }}</span>
          </summary>
          <div class="adv-examples-dock-body">
            <AdvFaqList :items="KNOWLEDGE_FILE_FAQ" />
          </div>
        </details>
      </div>
    </section>
    <section v-show="advancedTab === 'images'" class="panel adv-single">
      <div class="adv-section-head">
        <h2 class="adv-h2"><span>情绪立绘图片</span></h2>
        <p class="adv-lead">与简单创作相同，导出时写入 <code>assets/images/</code>；点「情绪图片」旁的问号可看说明。</p>
      </div>
      <EmotionAssetsControl
        :summary="emotionSummary"
        @pick="emit('emotionPick', $event)"
        @append="emit('emotionAppend', $event)"
        @clear="emit('emotionClear')"
      />
      <div class="adv-dock-stack">
        <details
          class="adv-examples-dock adv-examples-dock--collapsible adv-examples-dock--keypoints"
          aria-label="情绪立绘按钮说明"
        >
          <summary class="adv-examples-dock-summary">
            <span class="adv-examples-badge">重点</span>
            <span class="adv-examples-dock-title">情绪立绘 · 按钮与可改范围</span>
          </summary>
          <div class="adv-examples-dock-body">
            <h4 class="adv-ex-part">每个按钮：含义与可改范围</h4>
            <div class="adv-scope-matrix">
              <ul class="adv-scope-list">
                <li v-for="row in EMOTION_ASSET_SCOPE_GUIDE" :key="row.field" class="adv-scope-li">
                  <code class="adv-scope-field">{{ row.field }}</code>
                  <p class="adv-scope-mean">{{ row.meaning }}</p>
                  <p class="adv-scope-scope"><strong>可改范围：</strong>{{ row.scope }}</p>
                </li>
              </ul>
            </div>
            <p class="adv-examples-dock-note">手动拷文件到包内时需<strong>文件名与引用一致</strong>。</p>
          </div>
        </details>
        <details
          class="adv-examples-dock adv-examples-dock--collapsible adv-examples-dock--faq"
          aria-label="情绪立绘常见问题"
        >
          <summary class="adv-examples-dock-summary">
            <span class="adv-examples-badge adv-examples-badge--faq">问答</span>
            <span class="adv-examples-dock-title">常见问题 · 情绪立绘（改进前 / 改进后对照）</span>
          </summary>
          <div class="adv-examples-dock-body">
            <AdvFaqList :items="IMAGES_FAQ" />
          </div>
        </details>
      </div>
    </section>
  </div>
</template>

<style scoped>
code {
  font-size: 0.88em;
}

.panel {
  margin-top: 0.75rem;
  padding: 1rem 1.125rem 1.1rem;
  border: 1px solid var(--pack-glass-border);
  border-radius: var(--fluent-radius-lg);
  background: var(--pack-glass-fill);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  box-shadow: var(--fluent-shadow-card), var(--pack-glass-inset);
}

.base-desc {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--fluent-text-secondary);
  line-height: 1.5;
}
.adv-toolbar-lead {
  margin: 0 0 0.65rem;
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
  line-height: 1.55;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}
.hint-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.05rem;
  height: 1.05rem;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--fluent-border-control) 85%, transparent);
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--fluent-text-secondary);
}
.adv-section-head {
  margin-bottom: 0.65rem;
}
.adv-h2 {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.2rem;
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0 0 0.35rem;
}
.adv-h3 {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.2rem;
  margin: 0 0 0.35rem;
  font-size: 0.86rem;
  font-weight: 600;
}
.adv-lead {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
  line-height: 1.5;
}
.adv-lead code {
  font-size: 0.78em;
  background: var(--fluent-bg-subtle);
  padding: 0.05rem 0.3rem;
  border-radius: 3px;
}
.adv-key-map {
  margin: 0 0 0.5rem;
  font-size: 0.78rem;
  color: var(--fluent-text-secondary);
}
.adv-key-map summary {
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  color: var(--fluent-text-primary);
}
.adv-key-list {
  margin: 0.45rem 0 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.35rem;
}
.adv-key-list li {
  line-height: 1.45;
}
.adv-key-list code {
  font-size: 0.72rem;
  background: var(--fluent-bg-subtle);
  padding: 0.08rem 0.28rem;
  border-radius: 3px;
  margin-right: 0.35rem;
}
.adv-key-say {
  font-size: 0.78rem;
  color: var(--fluent-text-secondary);
}
.adv-dock-stack {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.adv-examples-dock {
  margin-top: 0;
  border-radius: var(--fluent-radius-lg);
  border: 1px solid color-mix(in srgb, var(--fluent-accent) 35%, var(--pack-glass-border));
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--fluent-accent) 10%, var(--pack-glass-fill-subtle)) 0%,
    var(--pack-glass-fill) 48%
  );
  box-shadow:
    var(--fluent-shadow-soft),
    0 0 0 1px color-mix(in srgb, var(--fluent-accent) 12%, transparent) inset;
}
.adv-examples-dock--faq {
  border-color: color-mix(in srgb, var(--fluent-text-secondary) 28%, var(--pack-glass-border));
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--fluent-text-secondary) 6%, var(--pack-glass-fill-subtle)) 0%,
    var(--pack-glass-fill) 50%
  );
}
.adv-examples-dock:not(.adv-examples-dock--collapsible) {
  padding: 0.85rem 0.95rem 0.95rem;
}
.adv-examples-dock--collapsible {
  padding: 0;
}
.adv-examples-dock-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  padding: 0.85rem 0.95rem;
  cursor: pointer;
  list-style: none;
  user-select: none;
}
.adv-examples-dock-summary::-webkit-details-marker {
  display: none;
}
.adv-examples-dock-summary::before {
  content: '▸';
  font-size: 0.75rem;
  color: var(--fluent-accent);
  margin-right: 0.15rem;
  transition: transform 0.15s ease;
}
.adv-examples-dock--collapsible[open] .adv-examples-dock-summary::before {
  transform: rotate(90deg);
}
.adv-examples-dock-body {
  padding: 0 0.95rem 0.95rem;
}
/* 重点区：字段表随内容增高，不占固定视窗高度 */
.adv-examples-dock--keypoints .adv-scope-matrix {
  max-height: none;
  overflow: visible;
  margin-bottom: 0.55rem;
}
.adv-examples-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #fff;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--fluent-accent) 92%, #000) 0%,
    var(--fluent-accent) 100%
  );
  box-shadow: 0 1px 3px color-mix(in srgb, var(--fluent-accent) 35%, transparent);
}
.adv-examples-badge--faq {
  color: var(--fluent-text-primary);
  background: color-mix(in srgb, var(--fluent-text-secondary) 14%, transparent);
  box-shadow: none;
  border: 1px solid color-mix(in srgb, var(--fluent-text-secondary) 22%, transparent);
}
.adv-examples-dock-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--fluent-text-primary);
}
.adv-examples-dock-note {
  margin: 0 0 0.65rem;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--fluent-text-secondary);
}
.adv-examples-dock-note strong {
  color: var(--fluent-accent);
  font-weight: 700;
}
.adv-merge-note {
  margin: 0 0 0.65rem;
  font-size: 0.76rem;
  line-height: 1.5;
  color: var(--fluent-text-secondary);
  padding: 0.45rem 0.55rem;
  border-radius: var(--fluent-radius);
  background: var(--fluent-bg-subtle);
  border: 1px dashed var(--fluent-border-stroke);
}
.adv-ex-part {
  margin: 0.65rem 0 0.4rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--fluent-text-primary);
}
.adv-scope-matrix {
  max-height: min(50vh, 22rem);
  overflow: auto;
  margin-bottom: 0.55rem;
  padding-right: 0.25rem;
}
.adv-scope-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.adv-scope-li {
  margin-bottom: 0.65rem;
  padding-bottom: 0.55rem;
  border-bottom: 1px solid color-mix(in srgb, var(--pack-glass-border) 80%, transparent);
}
.adv-scope-li:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.adv-scope-field {
  display: block;
  font-size: 0.72rem;
  font-family: var(--fluent-mono);
  margin-bottom: 0.28rem;
  color: var(--fluent-accent);
  font-weight: 600;
  word-break: break-word;
}
.adv-scope-mean {
  margin: 0 0 0.28rem;
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--fluent-text-primary);
}
.adv-scope-scope {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.45;
  color: var(--fluent-text-secondary);
}
.adv-scope-scope strong {
  color: var(--fluent-text-primary);
}
.adv-ex-block {
  margin-bottom: 0.85rem;
  padding-left: 0.55rem;
  border-left: 3px solid color-mix(in srgb, var(--fluent-accent) 55%, transparent);
}
.adv-ex-block:last-child {
  margin-bottom: 0;
}
.adv-ex-title {
  margin: 0 0 0.2rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: color-mix(in srgb, var(--fluent-accent) 88%, var(--fluent-text-primary));
}
.adv-ex-caption {
  margin: 0 0 0.35rem;
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--fluent-text-secondary);
}
.adv-ex-pre {
  margin: 0;
  padding: 0.55rem 0.65rem;
  font-size: 0.72rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--fluent-mono);
  border-radius: var(--fluent-radius);
  border: 1px solid color-mix(in srgb, var(--fluent-accent) 22%, var(--pack-glass-border));
  background: color-mix(in srgb, var(--fluent-bg-input) 88%, var(--pack-glass-fill-subtle));
  color: var(--fluent-text-primary);
  box-shadow: var(--pack-glass-inset);
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
  border: 1px solid var(--pack-glass-border);
  border-radius: var(--fluent-radius-lg);
  padding: 0.6rem;
  background: var(--pack-glass-fill-subtle);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  margin-bottom: 0.75rem;
  box-shadow: var(--fluent-shadow-soft), var(--pack-glass-inset);
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
  background: var(--pack-glass-fill-subtle);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  border: 1px solid var(--pack-glass-border);
  box-shadow: var(--fluent-shadow-soft), var(--pack-glass-inset);
}
.adv-toolbar button {
  padding: 0.38rem 0.65rem;
  min-height: 42px;
  border-radius: calc(var(--fluent-radius-lg) - 2px);
  border: none;
  background: transparent;
  color: var(--fluent-text-primary);
  cursor: pointer;
  font-size: 0.8125rem;
  font-family: var(--fluent-font);
  font-weight: 500;
  text-align: left;
  transition:
    background 0.12s ease,
    color 0.12s ease,
    box-shadow 0.18s ease;
}
.tab-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.06rem;
  line-height: 1.2;
}
.tab-title {
  font-size: 0.8125rem;
  font-weight: 600;
}
.tab-file {
  font-size: 0.68rem;
  font-weight: 400;
  color: var(--fluent-text-secondary);
  font-family: var(--fluent-mono);
}
.adv-toolbar button.on {
  background: var(--pack-glass-fill-strong);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  color: var(--fluent-accent);
  box-shadow:
    var(--fluent-shadow-soft),
    var(--pack-glass-inset),
    0 0 0 1px color-mix(in srgb, var(--fluent-accent) 26%, transparent),
    0 0 10px color-mix(in srgb, var(--fluent-accent) 18%, transparent);
}
.adv-toolbar button:not(.on):hover {
  background: rgba(0, 0, 0, 0.05);
}
.adv-toolbar button:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.92),
    0 0 0 4px var(--fluent-border-focus);
}
:global(html[data-theme='dark']) .adv-toolbar button:not(.on):hover {
  background: rgba(255, 255, 255, 0.06);
}
.adv-single {
  margin-top: 0.75rem;
  padding: 0;
  --adv-editor-min-h: min(62vh, 640px);
}
.h2-spaced {
  margin-top: 1.25rem;
}
.adv-single :deep(.ta:not(.ta--short)) {
  min-height: var(--adv-editor-min-h);
}
.ta {
  width: 100%;
  min-height: min(62vh, 640px);
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
.ta--short {
  min-height: 4.5rem;
  font-family: var(--fluent-font);
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

.creator-msg-mode {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0.5rem 0 0.65rem;
}
.radio-line {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--fluent-text-primary);
  cursor: pointer;
}
.radio-line input {
  margin-top: 0.2rem;
  flex-shrink: 0;
}
</style>
