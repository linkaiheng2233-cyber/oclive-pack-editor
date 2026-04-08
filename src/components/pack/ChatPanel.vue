<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  fetchRuntimeChat,
  fetchRuntimeHealth,
  runtimeTcpListening,
  spawnOcliveApi,
} from '../../lib/runtimeApi'
import { isTauriRuntime } from '../../lib/exportFolder'

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
const messages = ref<{ role: 'user' | 'assistant'; text: string }[]>([])
/** 与 oclive 请求体 `session_id` 一致；按 API 根 + 角色目录分桶持久化（localStorage），供后续后端会话能力接入 */
const chatSessionId = ref('')

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
watch(ocliveExe, (v) => {
  try {
    localStorage.setItem(STORAGE_EXE, v)
  } catch {
    /* ignore */
  }
})
async function pingHealth(): Promise<void> {
  healthMessage.value = '检测中…'
  healthOk.value = null
  try {
    const text = await fetchRuntimeHealth(apiBase.value.trim())
    healthOk.value = text.trim().toLowerCase().includes('ok')
    healthMessage.value = healthOk.value
      ? 'API 可用'
      : `意外响应：${text.slice(0, 120)}`
  } catch (e) {
    healthOk.value = false
    healthMessage.value = e instanceof Error ? e.message : String(e)
  }
}

async function trySpawnRuntime(): Promise<void> {
  const exe = ocliveExe.value.trim()
  if (!exe) {
    healthMessage.value = '请填写 oclive 可执行文件路径后再试'
    return
  }
  if (!ensureExeConsent(exe)) {
    healthMessage.value = '已取消自动启动：请先确认该可执行文件路径可信。'
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
        healthMessage.value = '该端口已有服务在监听，且 API 检测通过，无需再启动 oclive。'
        return
      }
      healthMessage.value =
        '该端口已被占用，但「检测 API」未通过。请确认占用进程或更换 API 地址中的端口。'
      healthOk.value = false
      return
    }
    await spawnOcliveApi(exe, port, host)
    healthMessage.value = '已尝试启动进程，约 2～5 秒后再次检测…'
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
    const reply = await fetchRuntimeChat(
      apiBase.value.trim(),
      path,
      msg,
      chatSessionId.value || null,
    )
    messages.value.push({ role: 'assistant', text: reply })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    messages.value.push({ role: 'assistant', text: `（错误）${err}` })
  } finally {
    chatLoading.value = false
  }
}
</script>

<template>
  <section class="chat-panel" aria-label="试聊">
    <h2>试聊（本机 oclive HTTP API）</h2>
    <p class="lead">
      需先启动运行时：<code>oclivenewnew --api</code>（端口与下方 API 地址一致，默认 8420；或点击下方自动启动）。角色目录须含
      <code>manifest.json</code>，通常为先「写入文件夹」后的
      <code>roles根/角色id</code>。输入框内 <strong>Enter</strong> 发送，<strong>Shift+Enter</strong> 换行；自动启动首次会要求确认
      可执行文件路径。
    </p>
    <p v-if="defaultRolePath" class="path-hint" role="status">
      已从「写入文件夹」推断角色目录（可改填下方手动路径）：<code>{{ defaultRolePath }}</code>
    </p>

    <div class="grid">
      <label class="field">
        <span>API 根地址</span>
        <input v-model="apiBase" type="url" autocomplete="off" />
      </label>
      <label class="field field-wide">
        <span>oclive 可执行文件（可选，仅桌面版「自动启动」）</span>
        <input
          v-model="ocliveExe"
          type="text"
          placeholder="例如 D:\...\oclivenewnew.exe"
          autocomplete="off"
        />
      </label>
      <label class="field field-wide">
        <span>角色包目录（含 manifest.json）</span>
        <input
          v-model="rolePathManual"
          type="text"
          :placeholder="defaultRolePath || '先导出到文件夹或手动填写绝对路径'"
          autocomplete="off"
        />
      </label>
    </div>

    <div class="row-actions">
      <button type="button" @click="pingHealth">检测 API</button>
      <button
        v-if="isTauriRuntime()"
        type="button"
        class="secondary"
        :disabled="spawnLoading"
        @click="trySpawnRuntime"
      >
        {{ spawnLoading ? '启动中…' : '自动启动 oclive（--api）' }}
      </button>
      <button
        type="button"
        class="secondary"
        :disabled="!effectiveRolePath"
        @click="newChatThread"
      >
        新会话
      </button>
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
        class="bubble"
        :class="m.role === 'user' ? 'bubble-user' : 'bubble-bot'"
      >
        {{ m.text }}
      </div>
      <p v-if="!messages.length" class="muted">发送第一条消息开始试聊。</p>
    </div>

    <div class="composer">
      <textarea
        v-model="input"
        rows="3"
        placeholder="输入消息…"
        :disabled="chatLoading"
        @keydown="onComposerKeydown"
      />
      <button type="button" :disabled="chatLoading || !effectiveRolePath" @click="send">
        {{ chatLoading ? '发送中…' : '发送' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.chat-panel {
  margin-top: 1rem;
  padding: 1rem 1.125rem;
  border: 1px solid var(--fluent-border-stroke);
  border-radius: var(--fluent-radius-lg);
  background: var(--fluent-bg-card);
  box-shadow: var(--fluent-shadow-card);
}
.chat-panel h2 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}
.lead {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--fluent-text-secondary);
  line-height: 1.5;
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
.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.75rem 0;
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
}
.row-actions button.secondary {
  background: var(--fluent-bg-subtle);
  color: var(--fluent-text-primary);
  border: 1px solid var(--fluent-border-stroke);
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
.chat-log {
  min-height: 140px;
  max-height: 280px;
  overflow-y: auto;
  padding: 0.75rem;
  background: var(--fluent-bg-subtle);
  border-radius: var(--fluent-radius);
  margin-bottom: 0.75rem;
}
.bubble {
  margin-bottom: 0.5rem;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  font-size: 0.875rem;
  line-height: 1.45;
  white-space: pre-wrap;
}
.bubble-user {
  background: var(--fluent-accent-subtle);
  margin-left: 2rem;
}
.bubble-bot {
  background: var(--fluent-bg-card);
  margin-right: 2rem;
  border: 1px solid var(--fluent-border-stroke);
}
.muted {
  color: var(--fluent-text-secondary);
  font-size: 0.8125rem;
  margin: 0;
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
}
.composer button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
