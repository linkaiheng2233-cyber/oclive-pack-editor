<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useI18n } from "vue-i18n";
import {
  fetchRuntimeChat,
  fetchRuntimeHealth,
  fetchRuntimeRoleFeedback,
  markRuntimeRoleFeedbackRead,
  setRuntimeRoleFeedbackHandled,
  readRoleManifestScenes,
  runtimeTcpListening,
  spawnOcliveApi,
  type RuntimeChatMeta,
  type RuntimeRoleFeedbackItem,
} from '../../lib/runtimeApi'
import { isTauriRuntime } from '../../lib/exportFolder'
import AdvFaqList from '../AdvFaqList.vue'
import HelpHint from '../HelpHint.vue'
import { CHAT_FAQ } from '../../lib/simpleEditorFaq'

const { t } = useI18n()

/** 试聊区：标题旁与各表单项旁的「?」详细说明（大白话） */
const CHAT_HINT = {
  intro: [
    '编写器里不会内置「对话大脑」——真正和你说话的是本机安装的 oclive。',
    '试聊时，编写器把一句话发给你电脑上的 oclive，再把角色的回复显示在下面。你需要：先让 oclive 在后台打开试聊服务（命令行里一般是带 --api、端口常和下面「连接地址」一致），再告诉编写器「角色包在哪个文件夹」。这样不用打开主程序也能快速验人设。',
  ],
  apiBase: [
    '这是 oclive 试聊服务在本机上的「门牌号」，一般是 http://127.0.0.1:8420。',
    '如果你在命令行里启动时写了别的端口（例如 --port 9000），这里就要改成同一个端口，否则连不上。点「检测连接」可以确认是否已经连上。',
  ],
  exe: [
    '只有桌面版编写器的「一键启动」才需要填这一项。',
    '请填 oclivenewnew.exe（或你的 oclive 程序）的完整路径。第一次会弹窗让你确认，避免误运行陌生程序。若你习惯自己在终端里已经运行了带 --api 的 oclive，可以不填，只要「检测连接」通过即可。',
  ],
  rolePath: [
    '要试聊的角色包所在的文件夹，这一层里必须有 manifest.json。',
    '通常是你在编写器里点「写入文件夹」后生成的「roles 根目录 / 角色 id」那一层。上面若已自动填好路径，一般不用改；也可以粘贴别的绝对路径来试别的包。',
  ],
  scene: [
    '和主应用里「场景」的意思一样：你想从哪个场景开始聊。',
    '选「让引擎自己决定」时，不强行指定场景。桌面版可以从 manifest 刷新列表；在浏览器里开发时，需要手填场景 id 或留空。',
  ],
  ping: [
    '不会真的发聊天内容，只是问一句「试聊服务在不在」。',
    '若显示失败，请检查 oclive 是否已用试聊模式启动、端口是否和「连接地址」一致。',
  ],
  spawn: [
    '用你填的 oclive 程序路径，尝试自动打开一个新窗口并带上试聊参数。',
    '若该端口已经有程序在监听且就是 oclive，会提示你不必重复启动。若没填程序路径，会提示你先填路径——你也可以改为自己在终端启动 oclive。',
  ],
  newThread: [
    '清空当前聊天记录，并换一个新的会话编号，相当于和同一角色「重新开始聊一轮」。',
    '不会删除磁盘上的角色文件，只是试聊窗口里的上下文重来。',
  ],
  composer: [
    'Enter 发送一条消息；Shift+Enter 换行（适合长句子）。',
    '请先确认「连接地址」检测通过，且「角色文件夹」填写正确，否则可能发不出去或报错。',
  ],
} as const

const props = defineProps<{
  /** manifest.id，用于与 roles 根拼接成试聊目录 */
  roleId: string
  /** 最近一次「写入文件夹」的 roles 根（可选） */
  lastRolesRoot: string
}>()

const STORAGE_API = 'oclive-pack-editor-api-base'
const STORAGE_EXE = 'oclive-pack-editor-oclive-exe'
const STORAGE_EXE_CONSENT_PREFIX = 'oclive-pack-editor-exe-consent'

const apiBase = ref('http://127.0.0.1:8420')
const ocliveExe = ref('')
const rolePathManual = ref('')

const healthOk = ref<boolean | null>(null)
const healthMessage = ref('')
const chatLoading = ref(false)
const spawnLoading = ref(false)
const input = ref('')
const messages = ref<
  { role: 'user' | 'assistant'; text: string; meta?: RuntimeChatMeta }[]
>([])
/** 空字符串表示不传 scene_id，由运行时推断 */
const sceneId = ref('')
const sceneOptions = ref<string[]>([])
const scenesLoading = ref(false)
const scenesLoadError = ref('')
/** 与 oclive 请求体 `session_id` 一致；按 API 根 + 角色目录分桶持久化（localStorage），供后续后端会话能力接入 */
const chatSessionId = ref('')

const feedbackOpen = ref(false)
const feedbackLoading = ref(false)
const feedbackErr = ref('')
const feedbackItems = ref<RuntimeRoleFeedbackItem[]>([])
const feedbackFilter = ref<'all' | 'open' | 'handled'>('open')
const feedbackNoteDraft = ref<Record<number, string>>({})

const ChatFeedbackModal = defineAsyncComponent(() => import('./ChatFeedbackModal.vue'))

const defaultRolePath = computed(() => {
  const id = props.roleId.trim()
  const root = props.lastRolesRoot.trim()
  if (!id || !root) return ''
  const sep = root.includes('\\') ? '\\' : '/'
  return `${root.replace(/[/\\]+$/, '')}${sep}${id}`
})

const effectiveRolePath = computed(() => {
  const m = rolePathManual.value.trim()
  if (m) return m
  return defaultRolePath.value
})

/** 自动启动子进程用；地址栏未写端口时与 oclive `--api` 默认 8420 对齐（避免误用 80/443）。 */
function portFromApiBase(): number {
  try {
    const u = new URL(apiBase.value.trim())
    if (u.port) return Math.min(65535, parseInt(u.port, 10) || 8420)
    return 8420
  } catch {
    return 8420
  }
}

function hostFromApiBase(): string {
  try {
    return new URL(apiBase.value.trim()).hostname || '127.0.0.1'
  } catch {
    return '127.0.0.1'
  }
}

function hash32(s: string): string {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16)
}

function sessionStorageKey(): string {
  const api = apiBase.value.trim()
  const role = effectiveRolePath.value.trim()
  return `oclive-pack-editor-chat-${hash32(`${api}\n${role}`)}`
}

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function ensureSessionId(): void {
  const api = apiBase.value.trim()
  const role = effectiveRolePath.value.trim()
  if (!api || !role) return
  const key = sessionStorageKey()
  const existing = localStorage.getItem(key)
  if (existing) {
    chatSessionId.value = existing
    return
  }
  const id = newSessionId()
  localStorage.setItem(key, id)
  chatSessionId.value = id
}

function newChatThread(): void {
  const api = apiBase.value.trim()
  const role = effectiveRolePath.value.trim()
  if (!api || !role) return
  const key = sessionStorageKey()
  const id = newSessionId()
  localStorage.setItem(key, id)
  chatSessionId.value = id
  messages.value = []
}

function presenceLabel(mode?: string): string {
  if (!mode) return ''
  if (mode === 'co_present') return String(t("chatPanel.meta.presence.coPresent"))
  if (mode === 'remote_stub') return String(t("chatPanel.meta.presence.remoteStub"))
  if (mode === 'remote_life') return String(t("chatPanel.meta.presence.remoteLife"))
  return mode
}

function formatFavorMeta(m: RuntimeChatMeta): string {
  const cur = m.favorability_current
  const d = m.favorability_delta
  if (cur === undefined && d === undefined) return ''
  const parts: string[] = []
  if (cur !== undefined) parts.push(String(t("chatPanel.meta.favor.current", { v: cur.toFixed(1) })))
  if (d !== undefined) parts.push(`${d >= 0 ? '+' : ''}${d.toFixed(2)}`)
  return parts.join(' ')
}

async function refreshManifestScenes(): Promise<void> {
  const p = effectiveRolePath.value.trim()
  if (!p || !isTauriRuntime()) return
  scenesLoading.value = true
  scenesLoadError.value = ''
  try {
    sceneOptions.value = await readRoleManifestScenes(p)
  } catch (e) {
    scenesLoadError.value = e instanceof Error ? e.message : String(e)
    sceneOptions.value = []
  } finally {
    scenesLoading.value = false
  }
}

async function openFeedback(): Promise<void> {
  feedbackOpen.value = true
  feedbackErr.value = ''
  feedbackLoading.value = true
  try {
    feedbackItems.value = await fetchRuntimeRoleFeedback(apiBase.value, props.roleId, 80, 0)
    // best-effort mark read (only open modal counts as "creator read")
    try {
      const ids = feedbackItems.value.map((x) => x.id)
      await markRuntimeRoleFeedbackRead(apiBase.value, props.roleId, ids)
    } catch {
      /* ignore */
    }
  } catch (e) {
    feedbackErr.value = e instanceof Error ? e.message : String(e)
    feedbackItems.value = []
  } finally {
    feedbackLoading.value = false
  }
}

function closeFeedback(): void {
  feedbackOpen.value = false
}

async function toggleHandled(it: RuntimeRoleFeedbackItem, handled: boolean): Promise<void> {
  try {
    await setRuntimeRoleFeedbackHandled(
      apiBase.value,
      props.roleId,
      it.id,
      handled,
      feedbackNoteDraft.value[it.id] || it.handled_note || '',
    )
    // refresh list to reflect status timestamps
    feedbackItems.value = await fetchRuntimeRoleFeedback(apiBase.value, props.roleId, 80, 0)
  } catch (e) {
    feedbackErr.value = e instanceof Error ? e.message : String(e)
  }
}

function onComposerKeydown(e: KeyboardEvent): void {
  if (e.key !== 'Enter') return
  if (e.shiftKey) return
  if (e.ctrlKey || e.altKey || e.metaKey) return
  e.preventDefault()
  void send()
}

function exeConsentKey(exePath: string): string {
  return `${STORAGE_EXE_CONSENT_PREFIX}-${hash32(exePath.trim().toLowerCase())}`
}

function ensureExeConsent(exePath: string): boolean {
  const prompt = `将启动外部可执行文件：\n${exePath}\n\n请确认该路径为你信任的 oclive 程序。`
  const key = exeConsentKey(exePath)
  try {
    if (localStorage.getItem(key) === 'true') return true
    const ok = window.confirm(prompt)
    if (ok) {
      try {
        localStorage.setItem(key, 'true')
      } catch {
        /* localStorage 不可写时仍允许本次启动 */
      }
    }
    return ok
  } catch {
    // localStorage 不可用（隐私模式等）时，退化为一次性确认而不是直接失败
    return window.confirm(prompt)
  }
}

onMounted(() => {
  try {
    const a = localStorage.getItem(STORAGE_API)
    if (a) apiBase.value = a
    const e = localStorage.getItem(STORAGE_EXE)
    if (e) ocliveExe.value = e
  } catch {
    /* ignore */
  }
})

watch(
  [apiBase, effectiveRolePath],
  () => {
    syncChatSessionFromStorage()
  },
  { immediate: true },
)

function syncChatSessionFromStorage(): void {
  const api = apiBase.value.trim()
  const role = effectiveRolePath.value.trim()
  if (!api || !role) {
    chatSessionId.value = ''
    return
  }
  const key = sessionStorageKey()
  if (typeof localStorage === 'undefined') return
  chatSessionId.value = localStorage.getItem(key) ?? ''
}

watch(apiBase, (v) => {
  try {
    localStorage.setItem(STORAGE_API, v)
  } catch {
    /* ignore */
  }
})

watch(
  effectiveRolePath,
  () => {
    sceneId.value = ''
    void refreshManifestScenes()
  },
  { immediate: true },
)
watch(ocliveExe, (v) => {
  try {
    localStorage.setItem(STORAGE_EXE, v)
  } catch {
    /* ignore */
  }
})
async function pingHealth(): Promise<void> {
  healthMessage.value = String(t("chatPanel.health.checking"))
  healthOk.value = null
  try {
    const text = await fetchRuntimeHealth(apiBase.value.trim())
    healthOk.value = text.trim().toLowerCase().includes('ok')
    healthMessage.value = healthOk.value
      ? String(t("chatPanel.health.ready"))
      : String(t("chatPanel.health.unexpectedResponse", { text: text.slice(0, 120) }))
  } catch (e) {
    healthOk.value = false
    healthMessage.value = e instanceof Error ? e.message : String(e)
  }
}

async function trySpawnRuntime(): Promise<void> {
  const exe = ocliveExe.value.trim()
  if (!exe) {
    healthMessage.value = String(t("chatPanel.health.spawnMissingExe"))
    return
  }
  if (!ensureExeConsent(exe)) {
    healthMessage.value = String(t("chatPanel.health.spawnCancelledUntrusted"))
    healthOk.value = false
    return
  }
  const port = portFromApiBase()
  const host = hostFromApiBase()
  spawnLoading.value = true
  try {
    if (isTauriRuntime() && (await runtimeTcpListening(host, port))) {
      await pingHealth()
      if (healthOk.value) {
        healthMessage.value = String(t("chatPanel.health.portAlreadyHealthy"))
        return
      }
      healthMessage.value = String(t("chatPanel.health.portOccupiedButNotHealthy"))
      healthOk.value = false
      return
    }
    await spawnOcliveApi(exe, port, host)
    healthMessage.value = String(t("chatPanel.health.spawnAttempted"))
    await new Promise((r) => setTimeout(r, 2500))
    await pingHealth()
  } catch (e) {
    healthMessage.value = e instanceof Error ? e.message : String(e)
    healthOk.value = false
  } finally {
    spawnLoading.value = false
  }
}

async function send(): Promise<void> {
  const path = effectiveRolePath.value.trim()
  const msg = input.value.trim()
  if (!path || !msg) return
  ensureSessionId()
  chatLoading.value = true
  messages.value.push({ role: 'user', text: msg })
  input.value = ''
  try {
    const result = await fetchRuntimeChat(
      apiBase.value.trim(),
      path,
      msg,
      chatSessionId.value || null,
      sceneId.value.trim() || null,
    )
    messages.value.push({
      role: 'assistant',
      text: result.reply,
      meta: result.meta,
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    messages.value.push({ role: 'assistant', text: String(t("chatPanel.chat.errorLine", { err })) })
  } finally {
    chatLoading.value = false
  }
}
</script>

<template>
  <section class="chat-panel" :aria-label="String(t('chatPanel.aria'))">
    <div class="chat-header">
      <h2 class="chat-title">
        {{ t("chatPanel.title") }}
        <HelpHint :paragraphs="CHAT_HINT.intro" />
      </h2>
      <p class="lead">
        {{ t("chatPanel.leadPrefix") }}
        <span class="hint-mark" aria-hidden="true">?</span>{{ t("chatPanel.leadSuffix") }}
      </p>
    </div>
    <p v-if="defaultRolePath" class="path-hint" role="status">
      {{ t("chatPanel.defaultRolePathHint", { path: defaultRolePath }) }}
    </p>

    <div class="grid">
      <label class="field">
        <span class="field-label-row">
          <span class="field-label-text">{{ t("chatPanel.fields.apiBase.label") }}</span>
          <HelpHint :paragraphs="CHAT_HINT.apiBase" />
        </span>
        <input
          v-model="apiBase"
          type="url"
          autocomplete="off"
          :placeholder="String(t('chatPanel.fields.apiBase.placeholder'))"
        />
      </label>
      <label class="field field-wide">
        <span class="field-label-row">
          <span class="field-label-text">{{ t("chatPanel.fields.exe.label") }}</span>
          <HelpHint :paragraphs="CHAT_HINT.exe" />
        </span>
        <input
          v-model="ocliveExe"
          type="text"
          :placeholder="String(t('chatPanel.fields.exe.placeholder'))"
          autocomplete="off"
        />
      </label>
      <label class="field field-wide">
        <span class="field-label-row">
          <span class="field-label-text">{{ t("chatPanel.fields.rolePath.label") }}</span>
          <HelpHint :paragraphs="CHAT_HINT.rolePath" />
        </span>
        <input
          v-model="rolePathManual"
          type="text"
          :placeholder="String(defaultRolePath || String(t('chatPanel.fields.rolePath.placeholderNoDefault')))"
          autocomplete="off"
        />
      </label>
      <label class="field field-wide">
        <span class="field-label-row">
          <span class="field-label-text">{{ t("chatPanel.fields.scene.label") }}</span>
          <HelpHint :paragraphs="CHAT_HINT.scene" />
        </span>
        <div class="scene-row">
          <select
            v-if="isTauriRuntime()"
            v-model="sceneId"
            class="scene-select"
            :disabled="!effectiveRolePath"
          >
            <option value="">{{ t("chatPanel.fields.scene.auto") }}</option>
            <option v-for="s in sceneOptions" :key="s" :value="s">{{ s }}</option>
          </select>
          <input
            v-else
            v-model="sceneId"
            type="text"
            class="scene-select"
            :disabled="!effectiveRolePath"
            :placeholder="String(t('chatPanel.fields.scene.placeholder'))"
            autocomplete="off"
          />
          <button
            v-if="isTauriRuntime()"
            type="button"
            class="scene-refresh secondary"
            :disabled="scenesLoading || !effectiveRolePath"
            @click="refreshManifestScenes"
          >
            {{ scenesLoading ? t("chatPanel.fields.scene.loading") : t("chatPanel.fields.scene.refresh") }}
          </button>
        </div>
        <span v-if="scenesLoadError" class="scene-err">{{ scenesLoadError }}</span>
      </label>
    </div>

    <div class="row-actions" :aria-label="String(t('chatPanel.actions.aria'))">
      <span class="action-with-hint">
        <button type="button" @click="pingHealth">{{ t("chatPanel.actions.ping") }}</button>
        <HelpHint :paragraphs="CHAT_HINT.ping" />
      </span>
      <span v-if="isTauriRuntime()" class="action-with-hint">
        <button type="button" class="secondary" :disabled="spawnLoading" @click="trySpawnRuntime">
          {{ spawnLoading ? t("chatPanel.actions.spawning") : t("chatPanel.actions.spawn") }}
        </button>
        <HelpHint :paragraphs="CHAT_HINT.spawn" />
      </span>
      <span class="action-with-hint">
        <button type="button" class="secondary" :disabled="!effectiveRolePath" @click="newChatThread">
          {{ t("chatPanel.actions.newThread") }}
        </button>
        <HelpHint :paragraphs="CHAT_HINT.newThread" />
      </span>
      <span class="action-with-hint">
        <button type="button" class="secondary" :disabled="!props.roleId" @click="openFeedback">
          {{ t("chatPanel.actions.feedback") }}
        </button>
      </span>
    </div>
    <p
      v-if="healthMessage"
      class="health"
      :class="{ ok: healthOk === true, bad: healthOk === false }"
    >
      {{ healthMessage }}
    </p>

    <div class="chat-log" role="log">
      <div
        v-for="(m, i) in messages"
        :key="i"
        class="bubble-block"
        :class="m.role === 'user' ? 'align-user' : 'align-bot'"
      >
        <div class="bubble" :class="m.role === 'user' ? 'bubble-user' : 'bubble-bot'">
          {{ m.text }}
        </div>
        <div v-if="m.role === 'assistant' && m.meta" class="meta-panel">
          <div class="meta-chips">
            <span v-if="m.meta.scene_id" class="chip">{{ t("chatPanel.meta.scene", { id: m.meta.scene_id }) }}</span>
            <span v-if="m.meta.presence_mode" class="chip">{{
              presenceLabel(m.meta.presence_mode)
            }}</span>
            <span v-if="m.meta.relation_state" class="chip">{{ t("chatPanel.meta.relation", { s: m.meta.relation_state }) }}</span>
            <span
              v-if="m.meta.personality_source"
              class="chip"
            >{{
              t("chatPanel.meta.personalitySource", {
                s:
                  m.meta.personality_source === "profile"
                    ? t("chatPanel.meta.personalitySourceProfile")
                    : t("chatPanel.meta.personalitySourceVector"),
              })
            }}</span>
            <span v-if="formatFavorMeta(m.meta)" class="chip">{{ formatFavorMeta(m.meta) }}</span>
            <span v-if="m.meta.bot_emotion" class="chip">{{ t("chatPanel.meta.botEmotion", { s: m.meta.bot_emotion }) }}</span>
            <span v-if="m.meta.portrait_emotion" class="chip">{{ t("chatPanel.meta.portraitEmotion", { s: m.meta.portrait_emotion }) }}</span>
            <span v-if="m.meta.reply_is_fallback" class="chip warn">{{ t("chatPanel.meta.fallbackReply") }}</span>
            <span
              v-if="m.meta.knowledge_chunks_in_prompt != null"
              class="chip"
              >{{ t("chatPanel.meta.knowledgeChunks", { n: m.meta.knowledge_chunks_in_prompt }) }}</span
            >
            <span v-if="m.meta.offer_destination_picker" class="chip accent">{{ t("chatPanel.meta.offerDestinationPicker") }}</span>
            <span v-if="m.meta.offer_together_travel" class="chip accent">{{ t("chatPanel.meta.offerTogetherTravel") }}</span>
          </div>
          <details v-if="m.meta.events?.length || m.meta.emotion" class="meta-details">
            <summary>调试详情</summary>
            <pre v-if="m.meta.events?.length" class="meta-pre">{{
              m.meta.events
                .map((ev) => `${ev.event_type} (${ev.confidence.toFixed(2)})`)
                .join('\n')
            }}</pre>
            <pre v-if="m.meta.emotion" class="meta-pre">{{
              JSON.stringify(m.meta.emotion, null, 2)
            }}</pre>
          </details>
        </div>
      </div>
      <p v-if="!messages.length" class="muted">
        还没有消息。确认「检测连接」通过并填好角色文件夹后，在下方输入一句话试试。
      </p>
    </div>

    <div class="composer-block">
      <div class="field-label-row composer-label">
        <span class="field-label-text">输入消息</span>
        <HelpHint :paragraphs="CHAT_HINT.composer" />
      </div>
      <div class="composer">
        <textarea
          v-model="input"
          rows="3"
          placeholder="想说的话写在这里…（Enter 发送，Shift+Enter 换行）"
          :disabled="chatLoading"
          @keydown="onComposerKeydown"
        />
        <button type="button" :disabled="chatLoading || !effectiveRolePath" @click="send">
          {{ chatLoading ? '发送中…' : '发送' }}
        </button>
      </div>
    </div>

    <details class="chat-faq-details">
      <summary class="chat-faq-sum">常见问题 · 试聊连接与路径</summary>
      <AdvFaqList :items="CHAT_FAQ" />
    </details>

    <ChatFeedbackModal
      :open="feedbackOpen"
      :loading="feedbackLoading"
      :err="feedbackErr"
      :items="feedbackItems"
      :filter="feedbackFilter"
      :note-draft="feedbackNoteDraft"
      @close="closeFeedback"
      @set-filter="(v) => (feedbackFilter = v)"
      @update-note="(id, v) => (feedbackNoteDraft = { ...feedbackNoteDraft, [id]: v })"
      @toggle-handled="toggleHandled"
    />
  </section>
</template>

<style scoped>
.chat-panel {
  margin-top: 1rem;
  padding: 1rem 1.125rem;
  border: 1px solid var(--pack-glass-border);
  border-radius: var(--fluent-radius-lg);
  background: var(--pack-glass-fill);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  box-shadow: var(--fluent-shadow-card), var(--pack-glass-inset);
}
.chat-header {
  margin-bottom: 0.75rem;
}
.chat-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.15rem;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.45rem;
}
.field-label-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem;
  margin-bottom: 0.15rem;
}
.field-label-text {
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
  line-height: 1.35;
}
.hint-mark {
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
  vertical-align: middle;
}
.lead {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--fluent-text-secondary);
  line-height: 1.55;
}
.lead code {
  font-size: 0.8rem;
  background: var(--fluent-bg-subtle);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}
.path-hint {
  margin: 0 0 1rem;
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
  line-height: 1.5;
}
.path-hint code {
  font-size: 0.78rem;
  word-break: break-all;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
}
.field-wide {
  grid-column: 1 / -1;
}
.field input {
  padding: 0.45rem 0.5rem;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--fluent-border-stroke);
  font-family: var(--fluent-font);
  font-size: 0.875rem;
}
.scene-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.scene-select {
  flex: 1;
  min-width: 12rem;
  padding: 0.45rem 0.5rem;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--fluent-border-stroke);
  font-family: var(--fluent-font);
  font-size: 0.875rem;
  background: var(--fluent-bg-subtle);
  color: var(--fluent-text-primary);
}
.scene-refresh {
  padding: 0.45rem 0.75rem;
  min-height: 32px;
  border-radius: var(--fluent-radius);
  cursor: pointer;
  font-size: 0.8125rem;
  background: var(--pack-glass-fill-subtle);
  color: var(--fluent-text-primary);
  border: 1px solid var(--pack-glass-border);
}
.scene-refresh:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.scene-err {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: #c42b1c;
}
.muted-inline {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: var(--fluent-text-secondary);
  line-height: 1.45;
}
.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 0.85rem;
  align-items: center;
  margin: 0.75rem 0;
}
.action-with-hint {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}
.row-actions button {
  padding: 0.45rem 0.9rem;
  min-height: 32px;
  border-radius: var(--fluent-radius);
  border: none;
  background: var(--fluent-accent);
  color: #fff;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow:
    var(--fluent-shadow-soft),
    0 1px 0 color-mix(in srgb, #fff 18%, transparent);
  transition:
    background var(--motion-fast) var(--ease-out),
    transform var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast) var(--ease-out),
    filter var(--motion-fast) var(--ease-out);
  will-change: transform;
}
.row-actions button:hover {
  background: var(--fluent-accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--fluent-shadow-card);
}
.row-actions button:focus-visible {
  outline: none;
  box-shadow:
    var(--fluent-shadow-soft),
    0 0 0 2px rgba(255, 255, 255, 0.92),
    0 0 0 4px var(--fluent-border-focus);
}
.row-actions button:active:not(:disabled) {
  transform: translateY(0px) scale(0.985);
  box-shadow: var(--fluent-shadow-soft);
}
.row-actions button.secondary {
  background: var(--pack-glass-fill-subtle);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  color: var(--fluent-text-primary);
  border: 1px solid var(--pack-glass-border);
  box-shadow: var(--fluent-shadow-soft), var(--pack-glass-inset);
}
.health {
  font-size: 0.8125rem;
  margin: 0 0 0.75rem;
}
.health.ok {
  color: #107c10;
}
.health.bad {
  color: #c42b1c;
}
.bubble-block {
  margin-bottom: 0.65rem;
}
.bubble-block.align-user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.bubble-block.align-bot {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.meta-panel {
  margin-top: 0.35rem;
  max-width: 100%;
}
.meta-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.chip {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: var(--fluent-bg-subtle);
  color: var(--fluent-text-secondary);
  border: 1px solid var(--pack-glass-border);
}
.chip.warn {
  color: #a4262c;
  border-color: color-mix(in srgb, #a4262c 35%, transparent);
}
.chip.accent {
  color: var(--fluent-accent);
  border-color: color-mix(in srgb, var(--fluent-accent) 40%, transparent);
}
.meta-details {
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: var(--fluent-text-secondary);
}
.meta-details summary {
  cursor: pointer;
  user-select: none;
}
.meta-pre {
  margin: 0.35rem 0 0;
  font-size: 0.68rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 120px;
  overflow: auto;
  padding: 0.35rem 0.45rem;
  border-radius: 4px;
  background: var(--pack-glass-fill-subtle);
  border: 1px solid var(--pack-glass-border);
}
.chat-log {
  min-height: 140px;
  max-height: 320px;
  overflow-y: auto;
  padding: 0.75rem;
  background: var(--pack-glass-fill-subtle);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  border-radius: var(--fluent-radius);
  margin-bottom: 0.75rem;
  border: 1px solid var(--pack-glass-border);
  box-shadow: var(--fluent-shadow-soft), var(--pack-glass-inset);
}
.bubble {
  margin-bottom: 0;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  font-size: 0.875rem;
  line-height: 1.45;
  white-space: pre-wrap;
  max-width: 100%;
}
.bubble-user {
  background: var(--fluent-accent-subtle);
  margin-left: 2rem;
}
.bubble-bot {
  background: var(--pack-glass-fill-strong);
  margin-right: 2rem;
  border: 1px solid var(--pack-glass-border);
}
.muted {
  color: var(--fluent-text-secondary);
  font-size: 0.8125rem;
  margin: 0;
}
.composer-block {
  margin-top: 0.25rem;
}
.composer-label {
  margin-bottom: 0.35rem;
}
.composer {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
}
.composer textarea {
  flex: 1;
  resize: vertical;
  padding: 0.5rem;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--fluent-border-stroke);
  font-family: var(--fluent-font);
  font-size: 0.875rem;
}
.composer button {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--fluent-radius);
  background: var(--fluent-accent);
  color: #fff;
  cursor: pointer;
  font-weight: 500;
  box-shadow:
    var(--fluent-shadow-soft),
    0 1px 0 color-mix(in srgb, #fff 18%, transparent);
  transition:
    background 0.15s ease,
    transform 0.1s ease;
}
.composer button:hover:not(:disabled) {
  background: var(--fluent-accent-hover);
}
.composer button:focus-visible {
  outline: none;
  box-shadow:
    var(--fluent-shadow-soft),
    0 0 0 2px rgba(255, 255, 255, 0.92),
    0 0 0 4px var(--fluent-border-focus);
}
.composer button:active:not(:disabled) {
  transform: scale(0.985);
}
.composer button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.chat-faq-details {
  margin-top: 1rem;
  padding: 0.55rem 0.75rem 0.75rem;
  border: 1px solid var(--pack-glass-border);
  border-radius: var(--fluent-radius-lg);
  background: color-mix(in srgb, var(--fluent-bg-card) 50%, transparent);
}
.chat-faq-sum {
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--fluent-text-primary);
  list-style: none;
}
.chat-faq-details[open] .chat-faq-sum {
  margin-bottom: 0.6rem;
}
.chat-faq-sum::-webkit-details-marker {
  display: none;
}
</style>
