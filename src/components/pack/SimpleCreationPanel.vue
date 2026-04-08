<script setup lang="ts">
import EmotionAssetsControl from './EmotionAssetsControl.vue'
import {
  PERSONALITY_KEYS,
  PERSONALITY_LABELS_ZH,
  type SimpleManifestForm,
  type SimpleSettingsForm,
} from '../../lib/simpleCreation'

defineProps<{
  simpleM: SimpleManifestForm
  simpleS: SimpleSettingsForm
  multiRelationWarning: boolean
  syncFormWarning: string
  emotionSummary: string
}>()

const corePersonality = defineModel<string>('corePersonality', { required: true })
const worldviewMarkdown = defineModel<string>('worldviewMarkdown', { required: true })

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
      <h2>基础：人设与情绪图</h2>
      <p class="base-desc">
        运行时读取 <code>core_personality.txt</code> 与 <code>assets/images/</code>（与 oclive 情绪资源命名一致，如 happy.png）。
      </p>
      <div class="form-row">
        <label for="core-ta">人设描述（长文）</label>
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
    </section>

    <details class="adv-details">
      <summary>进阶：场景、用户身份、世界观、角色受影响程度等</summary>
      <div class="simple-grid">
        <section class="panel form-panel">
          <h2>角色信息（manifest）</h2>
          <div class="form-row">
            <label for="f-id">角色 ID（文件夹名）</label>
            <input id="f-id" v-model="simpleM.id" type="text" autocomplete="off" />
          </div>
          <div class="form-row">
            <label for="f-name">显示名称</label>
            <input id="f-name" v-model="simpleM.name" type="text" />
          </div>
          <div class="form-row two">
            <div>
              <label for="f-ver">版本</label>
              <input id="f-ver" v-model="simpleM.version" type="text" />
            </div>
            <div>
              <label for="f-author">作者</label>
              <input id="f-author" v-model="simpleM.author" type="text" />
            </div>
          </div>
          <div class="form-row">
            <label for="f-desc">简介</label>
            <textarea id="f-desc" v-model="simpleM.description" rows="2" class="txt" />
          </div>
          <div class="form-row">
            <label for="f-minrt">最低 oclive 版本（可选）</label>
            <input
              id="f-minrt"
              v-model="simpleM.minRuntimeVersion"
              type="text"
              autocomplete="off"
              placeholder="semver，如 0.2.0；与编写器 HOST_RUNTIME_VERSION / 运行时对齐，留空则不限制"
            />
          </div>
          <div class="form-row">
            <label for="f-scenes">场景 ID（英文逗号分隔）</label>
            <input
              id="f-scenes"
              v-model="simpleM.scenesCsv"
              type="text"
              placeholder="home, school"
            />
          </div>
          <h3 class="h3">性格七维（0～1）</h3>
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
          <h3 class="h3">用户身份（简单模式仅保留一个）</h3>
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
            <label for="world-md">世界观（Markdown，写入 knowledge/world.md）</label>
            <textarea
              id="world-md"
              v-model="worldviewMarkdown"
              rows="6"
              class="txt mono"
              spellcheck="false"
              placeholder="可选。有内容时会生成 world.md；留空则使用占位说明。"
            />
          </div>
        </section>

        <section class="panel form-panel">
          <h2>引擎设置（settings）</h2>

          <section class="brain-panel" aria-labelledby="brain-heading">
            <h3 id="brain-heading" class="h3">对话推理（大脑）</h3>
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
            <label for="f-sv">schema 版本</label>
            <input id="f-sv" v-model.number="simpleS.schemaVersion" type="number" min="1" />
          </div>
          <div class="form-row">
            <label for="f-eif">事件影响系数（角色受影响程度）</label>
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
            <label for="f-ib">身份绑定</label>
            <select id="f-ib" v-model="simpleS.identityBinding">
              <option value="per_scene">按场景（per_scene）</option>
              <option value="global">全局（global）</option>
            </select>
          </div>
          <div class="form-row">
            <label for="f-im">交互模式</label>
            <select id="f-im" v-model="simpleS.interactionMode">
              <option value="immersive">沉浸（immersive）</option>
              <option value="pure_chat">纯聊（pure_chat）</option>
            </select>
          </div>
          <div class="form-row">
            <label for="f-swm">场景记忆权重倍率</label>
            <input
              id="f-swm"
              v-model.number="simpleS.sceneWeightMultiplier"
              type="number"
              min="0.1"
              step="0.1"
            />
          </div>
          <div class="form-row chk-row">
            <label>
              <input v-model="simpleS.remoteDefaultEnabled" type="checkbox" />
              异地心声默认开启（建议）
            </label>
          </div>
          <h3 class="h3">其他插件后端（memory / emotion / event / prompt）</h3>
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
.base-panel {
  margin-top: 1rem;
  padding: 1rem 1.125rem;
  border: 1px solid var(--fluent-border-stroke);
  border-radius: var(--fluent-radius-lg);
  background: var(--fluent-bg-card);
  box-shadow: var(--fluent-shadow-card);
}
.base-panel h2 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
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
  padding: 0.75rem 1rem 1rem;
  background: var(--fluent-bg-card);
  box-shadow: var(--fluent-shadow-card);
}
.adv-details summary {
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--fluent-text-primary);
  padding: 0.25rem 0;
  list-style-position: outside;
}
.adv-details[open] summary {
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
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--fluent-border-stroke);
  border-radius: var(--fluent-radius-lg);
  background: var(--fluent-bg-subtle);
}
.form-panel h2 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.65rem;
}
.form-panel .h3 {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
  color: var(--fluent-text-primary);
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
  border: 1px solid var(--fluent-border-stroke);
  background: var(--fluent-bg-page);
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
</style>
