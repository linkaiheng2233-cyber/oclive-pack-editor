<script setup lang="ts">
import { computed, onMounted, toRef, watch } from 'vue'
import { useI18n } from "vue-i18n";
import AdvFaqList from '../AdvFaqList.vue'
import HelpHint from '../HelpHint.vue'
import EmotionAssetsControl from './EmotionAssetsControl.vue'
import { SIMPLE_BASE_FAQ, SIMPLE_MANIFEST_FAQ, SIMPLE_SETTINGS_FAQ } from '../../lib/simpleEditorFaq'
import {
  SIMPLE_ADV_FOLD,
  SIMPLE_BASE_INTRO,
  SIMPLE_BRAIN_LLM,
  SIMPLE_CORE_PERSONALITY,
  SIMPLE_CREATOR_MESSAGE_BODY,
  SIMPLE_CREATOR_MESSAGE_MODE,
  SIMPLE_EVENT_IMPACT,
  SIMPLE_MAX_CHANGE_PER_EVENT,
  SIMPLE_FIELD_DESCRIPTION,
  SIMPLE_FIELD_DISPLAY_NAME,
  SIMPLE_FIELD_MIN_RUNTIME,
  SIMPLE_FIELD_ROLE_ID,
  SIMPLE_FIELD_SCENES,
  SIMPLE_FIELD_VERSION_AUTHOR,
  SIMPLE_IDENTITY_BINDING,
  SIMPLE_INTERACTION_MODE,
  SIMPLE_KNOWLEDGE,
  SIMPLE_MANIFEST_INTRO,
  SIMPLE_PERSONALITY_SOURCE,
  SIMPLE_PLUGIN_BACKENDS,
  SIMPLE_REMOTE_PRESENCE,
  SIMPLE_SCENE_WEIGHT,
  SIMPLE_SCHEMA_VERSION,
  SIMPLE_SETTINGS_INTRO,
  SIMPLE_TRAITS,
  SIMPLE_USER_RELATION,
  SIMPLE_WORLDVIEW,
} from '../../lib/simpleCreationHints'
import {
  PERSONALITY_KEYS,
  PERSONALITY_LABELS_ZH,
  type SimpleManifestForm,
  type SimpleSettingsForm,
} from '../../lib/simpleCreation'
import type { CreatorMessageExportMode } from '../../lib/rolePackCreatorMessage'
import { pluginsForCapability, useDirectoryPlugins } from '../../composables/useDirectoryPlugins'
import type { AuthorRecRow } from '../../lib/authorPack'
import type { UiConfig } from '../../types/uiConfig'

const { t } = useI18n()

const props = defineProps<{
  simpleM: SimpleManifestForm
  simpleS: SimpleSettingsForm
  multiRelationWarning: boolean
  syncFormWarning: string
  emotionSummary: string
  /** 最近一次「写入文件夹」的 roles 根路径；用于定位同级 `plugins/` 扫描目录插件 */
  lastExportedRolesRoot: string
}>()

const rolesRootRef = toRef(props, 'lastExportedRolesRoot')
const {
  plugins: directoryPlugins,
  loadError: directoryPluginsError,
  loading: directoryPluginsLoading,
} = useDirectoryPlugins(rolesRootRef)

const memoryPlugins = computed(() => pluginsForCapability(directoryPlugins.value, 'memory'))
const emotionPlugins = computed(() => pluginsForCapability(directoryPlugins.value, 'emotion'))
const eventPlugins = computed(() => pluginsForCapability(directoryPlugins.value, 'event'))
const promptPlugins = computed(() => pluginsForCapability(directoryPlugins.value, 'prompt'))
const llmPlugins = computed(() => pluginsForCapability(directoryPlugins.value, 'llm'))

const corePersonality = defineModel<string>('corePersonality', { required: true })
const worldviewMarkdown = defineModel<string>('worldviewMarkdown', { required: true })
const creatorMessageToOthers = defineModel<string>('creatorMessageToOthers', { default: '' })
const creatorMessageMode = defineModel<CreatorMessageExportMode>('creatorMessageMode', {
  default: 'unified',
})

const uiConfig = defineModel<UiConfig>('uiConfig', { required: true })

const authorSummary = defineModel<string>('authorSummary', { default: '' })
const authorDetailMarkdown = defineModel<string>('authorDetailMarkdown', { default: '' })
const authorRecommendedRows = defineModel<AuthorRecRow[]>('authorRecommendedRows', {
  default: () => [],
})
const authorIncludeSuggestedUi = defineModel<boolean>('authorIncludeSuggestedUi', {
  default: false,
})
const authorSuggestedBackendsJson = defineModel<string>('authorSuggestedBackendsJson', {
  default: '',
})

type SlotKey =
  | 'chat_toolbar'
  | 'settings_panel'
  | 'role_detail'
  | 'sidebar'
  | 'chat_header'
  | 'settings_plugins'
  | 'settings_advanced'
  | 'overlay_floating'
  | 'launcher_palette'
  | 'debug_dock'

const SLOT_META: { key: SlotKey; title: string; disk: string }[] = [
  { key: 'chat_toolbar', title: String(t("simpleCreation.slots.chatToolbar")), disk: 'chat_toolbar' },
  { key: 'settings_panel', title: String(t("simpleCreation.slots.settingsPanel")), disk: 'settings.panel' },
  { key: 'role_detail', title: String(t("simpleCreation.slots.roleDetail")), disk: 'role.detail' },
  { key: 'sidebar', title: String(t("simpleCreation.slots.sidebar")), disk: 'sidebar' },
  { key: 'chat_header', title: String(t("simpleCreation.slots.chatHeader")), disk: 'chat.header' },
  { key: 'settings_plugins', title: String(t("simpleCreation.slots.settingsPlugins")), disk: 'settings.plugins' },
  { key: 'settings_advanced', title: String(t("simpleCreation.slots.settingsAdvanced")), disk: 'settings.advanced' },
  { key: 'overlay_floating', title: String(t("simpleCreation.slots.overlayFloating")), disk: 'overlay.floating' },
  { key: 'launcher_palette', title: String(t("simpleCreation.slots.launcherPalette")), disk: 'launcher.palette' },
  { key: 'debug_dock', title: String(t("simpleCreation.slots.debugDock")), disk: 'debug.dock' },
]

const shellPlugins = computed(() =>
  directoryPlugins.value.filter(
    (p) => p.isShell && (p.pluginType ?? '').trim() === 'ocliveplugin',
  ),
)

function pluginsForSlotDisk(disk: string) {
  return directoryPlugins.value.filter(
    (p) => !p.isShell && p.uiSlotNames.includes(disk),
  )
}

function ensureSlotOrder(slot: SlotKey) {
  const meta = SLOT_META.find((m) => m.key === slot)
  if (!meta) return
  const sc = uiConfig.value.slots[slot]
  const avail = pluginsForSlotDisk(meta.disk).map((p) => p.id)
  const seen = new Set<string>()
  const nextOrder: string[] = []
  for (const id of sc.order) {
    if (avail.includes(id) && !seen.has(id)) {
      nextOrder.push(id)
      seen.add(id)
    }
  }
  for (const id of avail.sort()) {
    if (!seen.has(id)) {
      nextOrder.push(id)
      seen.add(id)
    }
  }
  sc.order = nextOrder
  sc.visible = sc.visible.filter((id) => nextOrder.includes(id))
  if (!sc.appearance) {
    sc.appearance = {}
  }
  for (const id of nextOrder) {
    const p = directoryPlugins.value.find((x) => x.id === id)
    const vars = (p?.uiSlotVariants ?? []).filter((v) => v.slot === meta.disk)
    if (vars.length <= 1) {
      delete sc.appearance[id]
      continue
    }
    if (!sc.appearance[id]) {
      sc.appearance[id] = vars[0]?.appearanceId ?? ''
    }
  }
  for (const k of Object.keys(sc.appearance)) {
    if (!nextOrder.includes(k)) {
      delete sc.appearance[k]
    }
  }
  if (Object.keys(sc.appearance).length === 0) {
    delete sc.appearance
  }
}

function syncAllSlotsFromScan() {
  for (const m of SLOT_META) {
    ensureSlotOrder(m.key)
  }
}

onMounted(syncAllSlotsFromScan)
watch(
  () =>
    directoryPlugins.value
      .map((p) => `${p.id}:${(p.uiSlotVariants ?? []).length}`)
      .sort()
      .join('|'),
  syncAllSlotsFromScan,
)

let dragSlot: SlotKey | null = null
let dragIdx: number | null = null

function onSlotDragStart(slot: SlotKey, i: number) {
  dragSlot = slot
  dragIdx = i
}

function onSlotDragOver(e: DragEvent) {
  e.preventDefault()
}

function onSlotDrop(slot: SlotKey, i: number) {
  if (dragSlot !== slot || dragIdx === null) return
  const ord = uiConfig.value.slots[slot].order
  if (dragIdx < 0 || dragIdx >= ord.length) return
  const [moved] = ord.splice(dragIdx, 1)
  if (moved === undefined) return
  ord.splice(i, 0, moved)
  dragSlot = null
  dragIdx = null
}

const emit = defineEmits<{
  emotionPick: [e: Event]
  emotionAppend: [e: Event]
  emotionClear: []
  addAuthorRecRow: []
  removeAuthorRecRow: [index: number]
}>()
</script>

<template>
  <div>
    <p v-if="syncFormWarning" class="sync-warn" role="status">
      {{ t("simpleCreation.syncWarning", { detail: syncFormWarning }) }}
    </p>

    <section class="panel base-panel">
      <div class="section-title-row">
        <h2>{{ t("simpleCreation.base.title") }}</h2>
        <HelpHint :paragraphs="SIMPLE_BASE_INTRO" />
      </div>
      <p class="base-desc">
        {{ t("simpleCreation.base.desc") }}
      </p>
      <div class="form-row">
        <div class="label-hint-row">
          <label for="core-ta">{{ t("simpleCreation.base.corePersonalityLabel") }}</label>
          <HelpHint :paragraphs="SIMPLE_CORE_PERSONALITY" />
        </div>
        <textarea
          id="core-ta"
          v-model="corePersonality"
          rows="8"
          class="txt"
          spellcheck="false"
        />
      </div>
      <div class="form-row">
        <EmotionAssetsControl
          :summary="emotionSummary"
          @pick="emit('emotionPick', $event)"
          @append="emit('emotionAppend', $event)"
          @clear="emit('emotionClear')"
        />
      </div>
      <div class="form-row">
        <div class="label-hint-row">
          <span class="labelish">{{ t("simpleCreation.creatorMessage.title") }}</span>
          <HelpHint :paragraphs="SIMPLE_CREATOR_MESSAGE_MODE" />
        </div>
        <p class="hint tiny">
          {{ t("simpleCreation.creatorMessage.desc") }}
        </p>
        <div
          class="creator-msg-mode"
          role="radiogroup"
          :aria-label="String(t('simpleCreation.creatorMessage.modeAria'))"
        >
          <label class="radio-line">
            <input v-model="creatorMessageMode" type="radio" value="unified" />
            {{ t("simpleCreation.creatorMessage.modes.unified") }}
          </label>
          <label class="radio-line">
            <input v-model="creatorMessageMode" type="radio" value="per_module" />
            {{ t("simpleCreation.creatorMessage.modes.perModule") }}
          </label>
        </div>
        <div class="label-hint-row">
          <label for="creator-msg-others">{{
            creatorMessageMode === 'unified'
              ? t("simpleCreation.creatorMessage.bodyLabelUnified")
              : t("simpleCreation.creatorMessage.bodyLabelPerModule")
          }}</label>
          <HelpHint :paragraphs="SIMPLE_CREATOR_MESSAGE_BODY" />
        </div>
        <textarea
          id="creator-msg-others"
          v-model="creatorMessageToOthers"
          :rows="creatorMessageMode === 'unified' ? 2 : 5"
          class="txt"
          spellcheck="true"
          :placeholder="
            creatorMessageMode === 'unified'
              ? String(t('simpleCreation.creatorMessage.placeholders.unified'))
              : String(t('simpleCreation.creatorMessage.placeholders.perModule'))
          "
        />
      </div>
      <details class="simple-faq-details">
        <summary class="simple-faq-sum">{{ t("simpleCreation.base.faqTitle") }}</summary>
        <AdvFaqList :items="SIMPLE_BASE_FAQ" show-intro />
      </details>
    </section>

    <details class="adv-details">
      <summary class="adv-details-sum">
        <span class="adv-sum-inner">
          <span>{{ t("simpleCreation.advanced.foldTitle") }}</span>
          <HelpHint :paragraphs="SIMPLE_ADV_FOLD" />
        </span>
      </summary>
      <div class="simple-grid">
        <section class="panel form-panel">
          <div class="section-title-row">
            <h2>{{ t("simpleCreation.manifest.title") }}</h2>
            <HelpHint :paragraphs="SIMPLE_MANIFEST_INTRO" />
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-id">{{ t("simpleCreation.manifest.roleIdLabel") }}</label>
              <HelpHint :paragraphs="SIMPLE_FIELD_ROLE_ID" />
            </div>
            <input id="f-id" v-model="simpleM.id" type="text" autocomplete="off" />
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-name">{{ t("simpleCreation.manifest.displayNameLabel") }}</label>
              <HelpHint :paragraphs="SIMPLE_FIELD_DISPLAY_NAME" />
            </div>
            <input id="f-name" v-model="simpleM.name" type="text" />
          </div>
          <div class="form-row two">
            <div>
              <div class="label-hint-row">
                <label for="f-ver">{{ t("simpleCreation.manifest.versionLabel") }}</label>
                <HelpHint :paragraphs="SIMPLE_FIELD_VERSION_AUTHOR" />
              </div>
              <input id="f-ver" v-model="simpleM.version" type="text" />
            </div>
            <div>
              <label for="f-author">{{ t("simpleCreation.manifest.authorLabel") }}</label>
              <input id="f-author" v-model="simpleM.author" type="text" />
            </div>
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-desc">{{ t("simpleCreation.manifest.descriptionLabel") }}</label>
              <HelpHint :paragraphs="SIMPLE_FIELD_DESCRIPTION" />
            </div>
            <textarea id="f-desc" v-model="simpleM.description" rows="2" class="txt" />
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-minrt">{{ t("simpleCreation.manifest.minRuntimeLabel") }}</label>
              <HelpHint :paragraphs="SIMPLE_FIELD_MIN_RUNTIME" />
            </div>
            <input
              id="f-minrt"
              v-model="simpleM.minRuntimeVersion"
              type="text"
              autocomplete="off"
              :placeholder="String(t('simpleCreation.manifest.minRuntimePlaceholder'))"
            />
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-scenes">{{ t("simpleCreation.manifest.scenesLabel") }}</label>
              <HelpHint :paragraphs="SIMPLE_FIELD_SCENES" />
            </div>
            <input
              id="f-scenes"
              v-model="simpleM.scenesCsv"
              type="text"
              placeholder="home, school"
            />
          </div>
          <div class="h3-hint-row">
            <h3 class="h3">{{ t("simpleCreation.manifest.personalityVectorTitle") }}</h3>
            <HelpHint :paragraphs="SIMPLE_TRAITS" />
          </div>
          <p v-if="simpleS.personalitySource === 'profile'" class="hint tiny">
            {{ t("simpleCreation.manifest.personalityVectorProfileHint") }}
          </p>
          <div class="traits">
            <div v-for="(k, i) in PERSONALITY_KEYS" :key="k" class="form-row trait">
              <label :for="`p-${k}`">{{ PERSONALITY_LABELS_ZH[k] }}</label>
              <input
                :id="`p-${k}`"
                v-model.number="simpleM.defaultPersonality[i]"
                type="number"
                min="0"
                max="1"
                step="0.05"
              />
            </div>
          </div>
          <div class="h3-hint-row">
            <h3 class="h3">{{ t("simpleCreation.manifest.userRelationTitle") }}</h3>
            <HelpHint :paragraphs="SIMPLE_USER_RELATION" />
          </div>
          <p v-if="multiRelationWarning" class="warn-banner">
            {{ t("simpleCreation.manifest.multiRelationWarning") }}
          </p>
          <div class="form-row">
            <label for="f-rkey">{{ t("simpleCreation.manifest.relationKeyLabel") }}</label>
            <input id="f-rkey" v-model="simpleM.relationKey" type="text" />
          </div>
          <div class="form-row">
            <label for="f-rname">{{ t("simpleCreation.manifest.relationDisplayNameLabel") }}</label>
            <input id="f-rname" v-model="simpleM.relationDisplayName" type="text" />
          </div>
          <div class="form-row">
            <label for="f-rhint">{{ t("simpleCreation.manifest.relationPromptHintLabel") }}</label>
            <textarea id="f-rhint" v-model="simpleM.relationPromptHint" rows="2" class="txt" />
          </div>
          <div class="form-row two">
            <div>
              <label for="f-fav">{{ t("simpleCreation.manifest.relationInitialFavorabilityLabel") }}</label>
              <input
                id="f-fav"
                v-model.number="simpleM.relationInitialFavorability"
                type="number"
                min="0"
                max="100"
                step="1"
              />
            </div>
            <div>
              <label for="f-mult">{{ t("simpleCreation.manifest.relationFavorMultiplierLabel") }}</label>
              <input
                id="f-mult"
                v-model.number="simpleM.relationFavorMultiplier"
                type="number"
                min="0.01"
                step="0.1"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="world-md">{{ t("simpleCreation.manifest.worldviewLabel") }}</label>
              <HelpHint :paragraphs="SIMPLE_WORLDVIEW" />
            </div>
            <textarea
              id="world-md"
              v-model="worldviewMarkdown"
              rows="6"
              class="txt mono"
              spellcheck="false"
              :placeholder="String(t('simpleCreation.manifest.worldviewPlaceholder'))"
            />
          </div>
          <div class="h3-hint-row">
            <h3 class="h3">{{ t("simpleCreation.manifest.knowledgeTitle") }}</h3>
            <HelpHint :paragraphs="SIMPLE_KNOWLEDGE" />
          </div>
          <p class="knowledge-lead">
            {{ t("simpleCreation.manifest.knowledgeLead") }}
          </p>
          <div class="form-row chk-row">
            <label>
              <input v-model="simpleM.knowledgeEnabled" type="checkbox" />
              {{ t("simpleCreation.manifest.knowledgeEnabledLabel") }}
            </label>
          </div>
          <div class="form-row">
            <label for="f-kglob">{{ t("simpleCreation.manifest.knowledgeGlobLabel") }}</label>
            <input
              id="f-kglob"
              v-model="simpleM.knowledgeGlob"
              type="text"
              spellcheck="false"
              placeholder="knowledge/**/*.md"
              autocomplete="off"
            />
          </div>
          <details class="simple-faq-details">
            <summary class="simple-faq-sum">{{ t("simpleCreation.manifest.faqTitle") }}</summary>
            <AdvFaqList :items="SIMPLE_MANIFEST_FAQ" />
          </details>
        </section>

        <section class="panel form-panel">
          <div class="section-title-row">
            <h2>引擎设置（settings）</h2>
            <HelpHint :paragraphs="SIMPLE_SETTINGS_INTRO" />
          </div>

          <section class="brain-panel" aria-labelledby="brain-heading">
            <div class="h3-hint-row">
              <h3 id="brain-heading" class="h3">对话推理（大脑）</h3>
              <HelpHint :paragraphs="SIMPLE_BRAIN_LLM" />
            </div>
            <p class="brain-lead">
              与 <strong>oclive-launcher</strong>「对话推理」一致：包内声明 <code>plugin_backends.llm</code>；本机走
              Ollama，云端需在启动 oclive 时配置 <code>OCLIVE_REMOTE_LLM_URL</code>（启动器里填 URL）。
            </p>
            <div class="form-row">
              <label for="f-brain-mode">推理方式</label>
              <select id="f-brain-mode" v-model="simpleS.pluginLlm">
                <option value="ollama">本机 Ollama</option>
                <option value="remote">云端 Remote LLM（HTTP JSON-RPC）</option>
                <option value="directory">目录插件（JSON-RPC）</option>
              </select>
            </div>
            <div v-if="simpleS.pluginLlm === 'ollama'" class="form-row">
              <label for="f-model">Ollama 模型名（<code>model</code>）</label>
              <input
                id="f-model"
                v-model="simpleS.model"
                type="text"
                placeholder="qwen2.5:7b"
                autocomplete="off"
              />
            </div>
            <div v-else-if="simpleS.pluginLlm === 'remote'" class="form-row brain-remote-note">
              <p>
                导出包将包含 <code>"llm": "remote"</code>。请使用启动器选择「云端 Remote LLM」并填写侧车地址；协议见 oclivenewnew
                <code>REMOTE_PLUGIN_PROTOCOL.md</code>。
              </p>
              <label for="f-model-remote">模型名备注（可选，写入 <code>model</code>）</label>
              <input
                id="f-model-remote"
                v-model="simpleS.model"
                type="text"
                placeholder="可选，如文档说明用"
                autocomplete="off"
              />
            </div>
            <div v-else class="form-row brain-dir-note">
              <label for="f-brain-dir-plugin">目录插件 ID（<code>plugin_backends.directory_plugins.llm</code>）</label>
              <select id="f-brain-dir-plugin" v-model="simpleS.directoryPluginLlm">
                <option value="">请选择 manifest id</option>
                <option v-for="p in llmPlugins" :key="p.id" :value="p.id">
                  {{ p.id }} — v{{ p.version }}
                </option>
              </select>
              <p v-if="directoryPluginsError" class="hint tiny">{{ directoryPluginsError }}</p>
              <p v-else-if="directoryPluginsLoading" class="hint tiny">正在扫描插件目录…</p>
              <p
                v-else-if="!directoryPlugins.length && !lastExportedRolesRoot.trim()"
                class="hint tiny"
              >
                未检测到目录插件。可将插件放入本应用数据目录下的 <code>plugins/</code>、环境变量
                <code>PLUGINS_GLOBAL_PATH</code> 指向的目录，或工作目录的 <code>plugins/</code>；导出角色包后也会扫描与
                <code>roles</code> 同级的 <code>plugins/</code>。
              </p>
              <p v-else-if="!lastExportedRolesRoot.trim()" class="hint tiny">
                当前正列出全局 <code>plugins/</code>；在「检查与导出」写入文件夹后，将优先扫描与 roles 同级的
                <code>plugins/</code>。
              </p>
              <label for="f-model-dir">模型名备注（可选，写入 <code>model</code>）</label>
              <input
                id="f-model-dir"
                v-model="simpleS.model"
                type="text"
                placeholder="可选"
                autocomplete="off"
              />
            </div>
          </section>

          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-sv">schema 版本</label>
              <HelpHint :paragraphs="SIMPLE_SCHEMA_VERSION" />
            </div>
            <input id="f-sv" v-model.number="simpleS.schemaVersion" type="number" min="1" />
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-eif">事件影响系数（角色受影响程度）</label>
              <HelpHint :paragraphs="SIMPLE_EVENT_IMPACT" />
            </div>
            <input
              id="f-eif"
              v-model.number="simpleS.eventImpactFactor"
              type="number"
              min="0.05"
              max="5"
              step="0.05"
            />
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-psrc">人格来源（personality_source）</label>
              <HelpHint :paragraphs="SIMPLE_PERSONALITY_SOURCE" />
            </div>
            <select id="f-psrc" v-model="simpleS.personalitySource">
              <option value="vector">经典（vector）：七维增量为主</option>
              <option value="profile">档案（profile）：核心长文 + 运行时可变档案</option>
            </select>
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-mce">单轮可变档案步长（max_change_per_event）</label>
              <HelpHint :paragraphs="SIMPLE_MAX_CHANGE_PER_EVENT" />
            </div>
            <input
              id="f-mce"
              v-model.number="simpleS.maxChangePerEvent"
              type="number"
              min="0.01"
              max="0.5"
              step="0.01"
            />
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-ib">身份绑定</label>
              <HelpHint :paragraphs="SIMPLE_IDENTITY_BINDING" />
            </div>
            <select id="f-ib" v-model="simpleS.identityBinding">
              <option value="per_scene">按场景（per_scene）</option>
              <option value="global">全局（global）</option>
            </select>
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-im">交互模式</label>
              <HelpHint :paragraphs="SIMPLE_INTERACTION_MODE" />
            </div>
            <select id="f-im" v-model="simpleS.interactionMode">
              <option value="immersive">沉浸（immersive）</option>
              <option value="pure_chat">纯聊（pure_chat）</option>
            </select>
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-swm">场景记忆权重倍率</label>
              <HelpHint :paragraphs="SIMPLE_SCENE_WEIGHT" />
            </div>
            <input
              id="f-swm"
              v-model.number="simpleS.sceneWeightMultiplier"
              type="number"
              min="0.1"
              step="0.1"
            />
          </div>
          <div class="form-row chk-row chk-with-hint">
            <label class="chk-label-wrap">
              <input v-model="simpleS.remoteDefaultEnabled" type="checkbox" />
              异地心声默认开启（建议）
            </label>
            <HelpHint :paragraphs="SIMPLE_REMOTE_PRESENCE" />
          </div>
          <div class="h3-hint-row">
            <h3 class="h3">其他插件后端（memory / emotion / event / prompt）</h3>
            <HelpHint :paragraphs="SIMPLE_PLUGIN_BACKENDS" />
          </div>
          <p class="plugin-sub">主对话 LLM 已在上方「对话推理」中选择；此处为记忆、情绪、事件、Prompt 四类后端。</p>
          <div class="form-row">
            <label>memory</label>
            <select v-model="simpleS.pluginMemory">
              <option value="builtin">builtin</option>
              <option value="builtin_v2">builtin_v2</option>
              <option value="remote">remote</option>
              <option value="directory">directory</option>
            </select>
          </div>
          <div v-if="simpleS.pluginMemory === 'directory'" class="form-row">
            <label for="f-pl-mem">目录插件 ID</label>
            <select id="f-pl-mem" v-model="simpleS.directoryPluginMemory">
              <option value="">请选择 manifest id</option>
              <option v-for="p in memoryPlugins" :key="p.id" :value="p.id">
                {{ p.id }} — v{{ p.version }}
              </option>
            </select>
          </div>
          <div class="form-row">
            <label>emotion</label>
            <select v-model="simpleS.pluginEmotion">
              <option value="builtin">builtin</option>
              <option value="builtin_v2">builtin_v2</option>
              <option value="remote">remote</option>
              <option value="directory">directory</option>
            </select>
          </div>
          <div v-if="simpleS.pluginEmotion === 'directory'" class="form-row">
            <label for="f-pl-emo">目录插件 ID</label>
            <select id="f-pl-emo" v-model="simpleS.directoryPluginEmotion">
              <option value="">请选择 manifest id</option>
              <option v-for="p in emotionPlugins" :key="p.id" :value="p.id">
                {{ p.id }} — v{{ p.version }}
              </option>
            </select>
          </div>
          <div class="form-row">
            <label>event</label>
            <select v-model="simpleS.pluginEvent">
              <option value="builtin">builtin</option>
              <option value="builtin_v2">builtin_v2</option>
              <option value="remote">remote</option>
              <option value="directory">directory</option>
            </select>
          </div>
          <div v-if="simpleS.pluginEvent === 'directory'" class="form-row">
            <label for="f-pl-ev">目录插件 ID</label>
            <select id="f-pl-ev" v-model="simpleS.directoryPluginEvent">
              <option value="">请选择 manifest id</option>
              <option v-for="p in eventPlugins" :key="p.id" :value="p.id">
                {{ p.id }} — v{{ p.version }}
              </option>
            </select>
          </div>
          <div class="form-row">
            <label>prompt</label>
            <select v-model="simpleS.pluginPrompt">
              <option value="builtin">builtin</option>
              <option value="builtin_v2">builtin_v2</option>
              <option value="remote">remote</option>
              <option value="directory">directory</option>
            </select>
          </div>
          <div v-if="simpleS.pluginPrompt === 'directory'" class="form-row">
            <label for="f-pl-pr">目录插件 ID</label>
            <select id="f-pl-pr" v-model="simpleS.directoryPluginPrompt">
              <option value="">请选择 manifest id</option>
              <option v-for="p in promptPlugins" :key="p.id" :value="p.id">
                {{ p.id }} — v{{ p.version }}
              </option>
            </select>
          </div>
          <p v-if="directoryPluginsError" class="hint tiny">{{ directoryPluginsError }}</p>
          <p v-else-if="directoryPluginsLoading" class="hint tiny">正在扫描插件目录…</p>
          <p
            v-else-if="!directoryPlugins.length && !lastExportedRolesRoot.trim()"
            class="hint tiny"
          >
            未检测到目录插件。可将插件放入应用数据 <code>plugins/</code>、<code>PLUGINS_GLOBAL_PATH</code> 或工作目录
            <code>plugins/</code>；导出后亦会扫描与 <code>roles</code> 同级的 <code>plugins/</code>。
          </p>
          <p v-else-if="!lastExportedRolesRoot.trim()" class="hint tiny">
            当前列出全局 <code>plugins/</code>；导出到含 <code>roles</code> 的目录后将改为扫描同级 <code>plugins/</code>。
          </p>

          <details class="ui-design-details">
            <summary class="ui-design-sum">作者与建议（author.json）</summary>
            <p class="hint tiny">
              可选：面向市场的简介、推荐插件列表；若勾选「导出时附带 suggested_ui」，将把下方「前端设计」当前表单一并写入
              <code>author.json</code>（运行时优先于 <code>ui.json</code> 作为插件布局种子）。<code>suggested_plugin_backends</code>
              为 JSON 片段，供用户一键应用为会话后端（不写 settings.json）。
            </p>
            <div class="form-row">
              <label for="auth-sum">一句话简介</label>
              <input
                id="auth-sum"
                v-model="authorSummary"
                type="text"
                class="txt"
                autocomplete="off"
                placeholder="例：慢热型同桌，适合日常陪伴"
              />
            </div>
            <div class="form-row">
              <label for="auth-md">详情（Markdown）</label>
              <textarea
                id="auth-md"
                v-model="authorDetailMarkdown"
                rows="4"
                class="txt"
                spellcheck="false"
                placeholder="可选：角色卖点、使用说明、推荐场景…"
              />
            </div>
            <div class="form-row">
              <label>推荐目录插件</label>
              <div class="auth-rec-toolbar">
                <button type="button" class="tiny-btn" @click="emit('addAuthorRecRow')">添加一行</button>
              </div>
              <div
                v-for="(row, idx) in authorRecommendedRows"
                :key="'ar-' + idx"
                class="auth-rec-row"
              >
                <input v-model="row.id" type="text" placeholder="插件 manifest id" class="txt" />
                <input
                  v-model="row.version_range"
                  type="text"
                  placeholder="版本范围（可选）"
                  class="txt"
                />
                <input v-model="row.note" type="text" placeholder="备注" class="txt" />
                <button
                  type="button"
                  class="tiny-btn danger"
                  :disabled="authorRecommendedRows.length <= 1"
                  @click="emit('removeAuthorRecRow', idx)"
                >
                  删除
                </button>
              </div>
            </div>
            <div class="form-row chk-row">
              <label class="chk">
                <input v-model="authorIncludeSuggestedUi" type="checkbox" />
                导出时在 author.json 附带当前「前端设计」为 suggested_ui
              </label>
            </div>
            <div class="form-row">
              <label for="auth-be">suggested_plugin_backends（JSON，可选）</label>
              <textarea
                id="auth-be"
                v-model="authorSuggestedBackendsJson"
                rows="6"
                class="txt mono"
                spellcheck="false"
                placeholder='例：{ "memory": "builtin", "llm": "ollama", ... }'
              />
            </div>
          </details>

          <details class="ui-design-details">
            <summary class="ui-design-sum">前端设计（ui.json）</summary>
            <p class="hint tiny">
              定义主程序加载本包时的默认整壳与嵌入插槽布局；导出时写入包根目录
              <code>ui.json</code>。用户可在 oclive 插件管理里覆盖；「重置为角色包推荐」可恢复。
            </p>
            <div class="form-row">
              <label for="ui-shell">整壳界面</label>
              <select id="ui-shell" v-model="uiConfig.shell">
                <option value="">无（使用内置界面）</option>
                <option v-for="p in shellPlugins" :key="p.id" :value="p.id">
                  {{ p.id }} — v{{ p.version }}
                </option>
              </select>
            </div>
            <p v-if="directoryPluginsLoading" class="hint tiny">正在扫描全局插件…</p>
            <p v-else-if="!shellPlugins.length" class="hint tiny">
              未扫描到整壳插件（需 <code>type: ocliveplugin</code> 且含 <code>shell</code>）。请将插件放入应用数据或工作目录的
              <code>plugins/</code>，或导出到含 <code>plugins/</code> 的目录。
            </p>
            <div class="form-row">
              <label for="ui-theme-primary">主题 · 主色</label>
              <input
                id="ui-theme-primary"
                v-model="uiConfig.theme.primaryColor"
                type="text"
                placeholder="#4a6b62"
                autocomplete="off"
              />
            </div>
            <div class="form-row">
              <label for="ui-theme-bg">主题 · 背景</label>
              <input
                id="ui-theme-bg"
                v-model="uiConfig.theme.backgroundColor"
                type="text"
                placeholder="#e7e2d9"
                autocomplete="off"
              />
            </div>
            <div class="form-row">
              <label for="ui-theme-font">主题 · 字体</label>
              <select id="ui-theme-font" v-model="uiConfig.theme.fontFamily">
                <option value="">默认（内置）</option>
                <option value="system-ui, sans-serif">system-ui</option>
                <option value="'Segoe UI', 'Microsoft YaHei', sans-serif">
                  Segoe UI / 微软雅黑
                </option>
                <option value="Georgia, serif">Georgia</option>
                <option value="ui-monospace, monospace">等宽</option>
              </select>
            </div>
            <div class="form-row">
              <label for="ui-layout-sidebar">布局 · 侧栏位置</label>
              <select id="ui-layout-sidebar" v-model="uiConfig.layout.sidebar">
                <option value="">默认（左）</option>
                <option value="left">左</option>
                <option value="right">右</option>
              </select>
            </div>
            <div class="form-row">
              <label for="ui-layout-input">布局 · 输入框位置</label>
              <select id="ui-layout-input" v-model="uiConfig.layout.chatInput">
                <option value="">默认（下）</option>
                <option value="bottom">下</option>
                <option value="top">上</option>
              </select>
            </div>
            <div
              v-for="meta in SLOT_META"
              :key="meta.key"
              class="ui-slot-card"
            >
              <h4 class="ui-slot-title">{{ meta.title }}</h4>
              <ol
                class="ui-slot-order"
                :aria-label="`${meta.title} 插件顺序`"
              >
                <li
                  v-for="(pid, i) in uiConfig.slots[meta.key].order"
                  :key="`${meta.key}-${pid}`"
                  class="ui-slot-row"
                  draggable="true"
                  @dragstart="onSlotDragStart(meta.key, i)"
                  @dragover="onSlotDragOver"
                  @drop="onSlotDrop(meta.key, i)"
                >
                  <span class="ui-grip" aria-hidden="true">⋮⋮</span>
                  <span class="ui-slot-id">{{ pid }}</span>
                  <span class="ui-slot-ver">{{
                    directoryPlugins.find((x) => x.id === pid)?.version ?? '—'
                  }}</span>
                  <label class="ui-vis">
                    <input
                      type="checkbox"
                      :checked="uiConfig.slots[meta.key].visible.includes(pid)"
                      @change="
                        (e) => {
                          const el = e.target as HTMLInputElement
                          const sc = uiConfig.slots[meta.key]
                          if (el.checked) {
                            if (!sc.visible.includes(pid)) sc.visible = [...sc.visible, pid]
                          } else {
                            sc.visible = sc.visible.filter((x) => x !== pid)
                          }
                        }
                      "
                    />
                    默认可见
                  </label>
                </li>
              </ol>
              <p
                v-if="!uiConfig.slots[meta.key].order.length"
                class="hint tiny"
              >
                当前插槽无可用插件（请扫描到声明了对应插槽的目录插件）。
              </p>
            </div>
          </details>

          <p class="future-note">
            需要完整 JSON 或插件字段时，请切换到<strong>高级创作</strong>直接编辑源码。
          </p>
          <details class="simple-faq-details">
            <summary class="simple-faq-sum">常见问题 · 引擎设置（settings）</summary>
            <AdvFaqList :items="SIMPLE_SETTINGS_FAQ" />
          </details>
        </section>
      </div>
    </details>
  </div>
</template>

<style scoped>
.sync-warn {
  margin: 0 0 0.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--fluent-warning-text);
  background: var(--fluent-warning-bg);
  border: 1px solid var(--fluent-warning-border);
  border-radius: var(--fluent-radius-lg);
  line-height: 1.45;
}
code {
  font-size: 0.88em;
}
/* 与启动器 .card / card--hero-editor 同系：浅底、描边、左侧编写器色条 */
.base-panel {
  margin-top: 1rem;
  padding: 1rem 1.15rem;
  border: 1px solid var(--fluent-border-stroke);
  border-left: 3px solid var(--rail-accent-editor);
  border-radius: var(--fluent-radius-lg);
  background: color-mix(in srgb, var(--fluent-bg-card) 82%, transparent);
  backdrop-filter: blur(9px) saturate(106%);
  -webkit-backdrop-filter: blur(9px) saturate(106%);
  box-shadow:
    var(--fluent-shadow-card),
    inset 0 1px 0 color-mix(in srgb, var(--rail-accent-editor) 22%, transparent);
  transition:
    box-shadow 0.22s ease,
    border-color 0.22s ease;
}
.section-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.15rem;
  margin-bottom: 0.5rem;
}
.section-title-row h2 {
  margin: 0;
}
.base-panel h2 {
  font-size: 1rem;
  font-weight: 600;
}
.label-hint-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
}
.label-hint-row label,
.label-hint-row .labelish {
  margin-bottom: 0;
}
.form-panel .label-hint-row label {
  display: inline;
}
.h3-hint-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 1rem 0 0.5rem;
}
.h3-hint-row .h3 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--fluent-text-primary);
}
.adv-details-sum {
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--fluent-text-primary);
  padding: 0.25rem 0;
  list-style-position: outside;
}
.adv-sum-inner {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.chk-with-hint {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.chk-with-hint .chk-label-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--fluent-text-primary);
}
.base-desc {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--fluent-text-secondary);
  line-height: 1.5;
}
.adv-details {
  margin-top: 1rem;
  border: 1px solid var(--fluent-border-stroke);
  border-radius: var(--fluent-radius-lg);
  padding: 0.85rem 1rem 1.05rem;
  background: color-mix(in srgb, var(--fluent-bg-card) 82%, transparent);
  backdrop-filter: blur(9px) saturate(106%);
  -webkit-backdrop-filter: blur(9px) saturate(106%);
  box-shadow: var(--fluent-shadow-card);
}
.adv-details[open] > .adv-details-sum {
  margin-bottom: 0.75rem;
}
.simple-grid {
  display: grid;
  gap: 1rem;
}
@media (min-width: 900px) {
  .simple-grid {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}
.form-panel {
  padding: 1rem 1.05rem;
  border: 1px solid var(--fluent-border-stroke);
  border-radius: var(--fluent-radius-lg);
  background: color-mix(in srgb, var(--fluent-bg-subtle) 88%, transparent);
  backdrop-filter: blur(8px) saturate(104%);
  -webkit-backdrop-filter: blur(8px) saturate(104%);
  box-shadow: var(--fluent-shadow-soft);
}
.form-panel h2 {
  font-size: 1rem;
  font-weight: 600;
}
.form-panel > .section-title-row {
  margin-bottom: 0.65rem;
}
.form-row {
  margin-bottom: 0.65rem;
}
.form-row label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--fluent-text-secondary);
  margin-bottom: 0.25rem;
}
.form-row input[type='text'],
.form-row input[type='number'],
.form-row select,
.form-row .txt {
  width: 100%;
  box-sizing: border-box;
  padding: 0.45rem 0.6rem;
  min-height: 32px;
  border: 1px solid var(--fluent-border-control);
  border-radius: var(--fluent-radius);
  font-size: 0.875rem;
  font-family: var(--fluent-font);
  background: var(--fluent-bg-input);
  color: var(--fluent-text-primary);
}
.form-row input:focus-visible,
.form-row select:focus-visible,
.form-row .txt:focus-visible {
  outline: 2px solid var(--fluent-border-focus);
  outline-offset: -1px;
}
.form-row .txt.mono {
  font-family: var(--fluent-mono);
  font-size: 0.8125rem;
}
.form-row.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}
.traits {
  display: grid;
  gap: 0.35rem;
}
.trait {
  display: grid;
  grid-template-columns: 1fr 5rem;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0;
}
.trait label {
  margin: 0;
}
.chk-row label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--fluent-text-primary);
}
.warn-banner {
  font-size: 0.8125rem;
  color: var(--fluent-warning-text);
  background: var(--fluent-warning-bg);
  border: 1px solid var(--fluent-warning-border);
  padding: 0.5rem 0.65rem;
  border-radius: var(--fluent-radius-lg);
  margin: 0 0 0.65rem;
  line-height: 1.45;
}
.auth-rec-toolbar {
  margin-bottom: 0.35rem;
}
.auth-rec-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 0.4rem;
  align-items: center;
  margin-bottom: 0.4rem;
}
@media (max-width: 720px) {
  .auth-rec-row {
    grid-template-columns: 1fr;
  }
}
.future-note {
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
  line-height: 1.45;
  margin: 1rem 0 0;
  padding-top: 0.75rem;
  border-top: 1px solid var(--fluent-border-stroke);
}

.brain-panel {
  margin: 0 0 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: var(--fluent-radius-lg);
  border: 1px dashed var(--fluent-border-stroke);
  background: var(--fluent-bg-subtle);
  box-shadow: none;
}
.brain-lead {
  margin: 0 0 0.65rem;
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
  line-height: 1.55;
}
.brain-remote-note p {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
  line-height: 1.5;
}
.plugin-sub {
  margin: -0.25rem 0 0.5rem;
  font-size: 0.78rem;
  color: var(--fluent-text-secondary);
  line-height: 1.45;
}
.knowledge-lead {
  margin: -0.25rem 0 0.5rem;
  font-size: 0.78rem;
  color: var(--fluent-text-secondary);
  line-height: 1.5;
}
.knowledge-lead code {
  font-size: 0.76rem;
}

.labelish {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}
.creator-msg-mode {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0.4rem 0 0.5rem;
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
.simple-faq-details {
  margin-top: 1rem;
  padding: 0.6rem 0.8rem 0.8rem;
  border: 1px solid var(--fluent-border-stroke);
  border-radius: var(--fluent-radius-lg);
  background: color-mix(in srgb, var(--fluent-bg-subtle) 92%, transparent);
}
.simple-faq-sum {
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--fluent-text-primary);
  list-style: none;
}
.simple-faq-details[open] .simple-faq-sum {
  margin-bottom: 0.6rem;
}
.simple-faq-sum::-webkit-details-marker {
  display: none;
}
</style>
