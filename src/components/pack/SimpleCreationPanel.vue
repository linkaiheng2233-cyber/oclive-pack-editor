<script setup lang="ts">
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

defineProps<{
  simpleM: SimpleManifestForm
  simpleS: SimpleSettingsForm
  multiRelationWarning: boolean
  syncFormWarning: string
  emotionSummary: string
}>()

const corePersonality = defineModel<string>('corePersonality', { required: true })
const worldviewMarkdown = defineModel<string>('worldviewMarkdown', { required: true })
const creatorMessageToOthers = defineModel<string>('creatorMessageToOthers', { default: '' })
const creatorMessageMode = defineModel<CreatorMessageExportMode>('creatorMessageMode', {
  default: 'unified',
})

const emit = defineEmits<{
  emotionPick: [e: Event]
  emotionAppend: [e: Event]
  emotionClear: []
}>()
</script>

<template>
  <div>
    <p v-if="syncFormWarning" class="sync-warn" role="status">
      简单表单未与 JSON 完全同步：{{ syncFormWarning }}
    </p>

    <section class="panel base-panel">
      <div class="section-title-row">
        <h2>基础：核心档案与情绪图</h2>
        <HelpHint :paragraphs="SIMPLE_BASE_INTRO" />
      </div>
      <p class="base-desc">
        这一页用大白话填表，保存后就会写进包里：<strong>核心性格档案</strong>（包内长文）决定 AI 怎么演，
        <strong>情绪图</strong>决定立绘用哪些文件（文件名要和 oclive 约定一致，如
        <code>happy.png</code>），运行时读 <code>core_personality.txt</code> 与
        <code>assets/images/</code>。
      </p>
      <div class="form-row">
        <div class="label-hint-row">
          <label for="core-ta">核心性格档案（长文）</label>
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
          <span class="labelish">创作者公告（可选，仅在此编写）</span>
          <HelpHint :paragraphs="SIMPLE_CREATOR_MESSAGE_MODE" />
        </div>
        <p class="hint tiny">
          下载包的用户只在<strong>启动器</strong>里只读查看；对话里的 AI<strong>不读</strong>这份文件。导出为
          <code>creator_message.txt</code>，每行最多 160 字。
        </p>
        <div class="creator-msg-mode" role="radiogroup" aria-label="创作者公告导出方式">
          <label class="radio-line">
            <input v-model="creatorMessageMode" type="radio" value="unified" />
            整包一句
          </label>
          <label class="radio-line">
            <input v-model="creatorMessageMode" type="radio" value="per_module" />
            按行多条（每行对应一个模块/来源，多模块拼接时启动器会逐条列出）
          </label>
        </div>
        <div class="label-hint-row">
          <label for="creator-msg-others">{{
            creatorMessageMode === 'unified' ? '给后来者的一句话' : '每行一条（可多条）'
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
              ? '例如：别怕改设定，第三次导出就顺了。'
              : '第一行：场景模块作者留话\n第二行：核心档案模块…\n（空行会被忽略）'
          "
        />
      </div>
      <details class="simple-faq-details">
        <summary class="simple-faq-sum">常见问题 · 基础区（核心档案、立绘、寄语）</summary>
        <AdvFaqList :items="SIMPLE_BASE_FAQ" show-intro />
      </details>
    </section>

    <details class="adv-details">
      <summary class="adv-details-sum">
        <span class="adv-sum-inner">
          <span>进阶：场景、用户身份、世界观、角色受影响程度等</span>
          <HelpHint :paragraphs="SIMPLE_ADV_FOLD" />
        </span>
      </summary>
      <div class="simple-grid">
        <section class="panel form-panel">
          <div class="section-title-row">
            <h2>角色信息（manifest）</h2>
            <HelpHint :paragraphs="SIMPLE_MANIFEST_INTRO" />
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-id">角色 ID（文件夹名）</label>
              <HelpHint :paragraphs="SIMPLE_FIELD_ROLE_ID" />
            </div>
            <input id="f-id" v-model="simpleM.id" type="text" autocomplete="off" />
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-name">显示名称</label>
              <HelpHint :paragraphs="SIMPLE_FIELD_DISPLAY_NAME" />
            </div>
            <input id="f-name" v-model="simpleM.name" type="text" />
          </div>
          <div class="form-row two">
            <div>
              <div class="label-hint-row">
                <label for="f-ver">版本</label>
                <HelpHint :paragraphs="SIMPLE_FIELD_VERSION_AUTHOR" />
              </div>
              <input id="f-ver" v-model="simpleM.version" type="text" />
            </div>
            <div>
              <label for="f-author">作者</label>
              <input id="f-author" v-model="simpleM.author" type="text" />
            </div>
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-desc">简介</label>
              <HelpHint :paragraphs="SIMPLE_FIELD_DESCRIPTION" />
            </div>
            <textarea id="f-desc" v-model="simpleM.description" rows="2" class="txt" />
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-minrt">最低 oclive 版本（可选）</label>
              <HelpHint :paragraphs="SIMPLE_FIELD_MIN_RUNTIME" />
            </div>
            <input
              id="f-minrt"
              v-model="simpleM.minRuntimeVersion"
              type="text"
              autocomplete="off"
              placeholder="semver，如 0.2.0；与编写器 HOST_RUNTIME_VERSION / 运行时对齐，留空则不限制"
            />
          </div>
          <div class="form-row">
            <div class="label-hint-row">
              <label for="f-scenes">场景 ID（英文逗号分隔）</label>
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
            <h3 class="h3">性格七维（0～1）</h3>
            <HelpHint :paragraphs="SIMPLE_TRAITS" />
          </div>
          <p v-if="simpleS.personalitySource === 'profile'" class="hint tiny">
            当前为「档案」人格来源：七维在运行时多为从正文归纳的视图；下方数字仍会写入包内作默认与参考。
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
            <h3 class="h3">用户身份（简单模式仅保留一个）</h3>
            <HelpHint :paragraphs="SIMPLE_USER_RELATION" />
          </div>
          <p v-if="multiRelationWarning" class="warn-banner">
            当前包内有多个身份键，简单创作保存时会合并为下方这一套；保留多身份请改用高级创作。
          </p>
          <div class="form-row">
            <label for="f-rkey">身份键（如 friend）</label>
            <input id="f-rkey" v-model="simpleM.relationKey" type="text" />
          </div>
          <div class="form-row">
            <label for="f-rname">对外称呼说明</label>
            <input id="f-rname" v-model="simpleM.relationDisplayName" type="text" />
          </div>
          <div class="form-row">
            <label for="f-rhint">语气与关系提示</label>
            <textarea id="f-rhint" v-model="simpleM.relationPromptHint" rows="2" class="txt" />
          </div>
          <div class="form-row two">
            <div>
              <label for="f-fav">初始好感（0～100）</label>
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
              <label for="f-mult">好感倍率</label>
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
              <label for="world-md">世界观（Markdown，写入 knowledge/world.md）</label>
              <HelpHint :paragraphs="SIMPLE_WORLDVIEW" />
            </div>
            <textarea
              id="world-md"
              v-model="worldviewMarkdown"
              rows="6"
              class="txt mono"
              spellcheck="false"
              placeholder="可选。有内容时会生成 world.md；留空则使用占位说明。"
            />
          </div>
          <div class="h3-hint-row">
            <h3 class="h3">知识库检索（manifest / settings）</h3>
            <HelpHint :paragraphs="SIMPLE_KNOWLEDGE" />
          </div>
          <p class="knowledge-lead">
            与运行时 <code>knowledge</code> 块一致；导出时写入 <code>manifest.json</code> 与
            <code>settings.json</code>（合并加载时 settings 优先）。<code>glob</code> 须以
            <code>knowledge/</code> 开头。
          </p>
          <div class="form-row chk-row">
            <label>
              <input v-model="simpleM.knowledgeEnabled" type="checkbox" />
              启用知识库 Markdown 检索
            </label>
          </div>
          <div class="form-row">
            <label for="f-kglob">glob 模式</label>
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
            <summary class="simple-faq-sum">常见问题 · 角色信息（manifest）</summary>
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
            <div v-else class="form-row brain-remote-note">
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
            </select>
          </div>
          <div class="form-row">
            <label>emotion</label>
            <select v-model="simpleS.pluginEmotion">
              <option value="builtin">builtin</option>
              <option value="builtin_v2">builtin_v2</option>
              <option value="remote">remote</option>
            </select>
          </div>
          <div class="form-row">
            <label>event</label>
            <select v-model="simpleS.pluginEvent">
              <option value="builtin">builtin</option>
              <option value="builtin_v2">builtin_v2</option>
              <option value="remote">remote</option>
            </select>
          </div>
          <div class="form-row">
            <label>prompt</label>
            <select v-model="simpleS.pluginPrompt">
              <option value="builtin">builtin</option>
              <option value="builtin_v2">builtin_v2</option>
              <option value="remote">remote</option>
            </select>
          </div>
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
