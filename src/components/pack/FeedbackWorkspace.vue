<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  fetchRuntimeHealth,
  fetchRuntimeRoleFeedback,
  markRuntimeRoleFeedbackRead,
  setRuntimeRoleFeedbackHandled,
  type RuntimeRoleFeedbackItem,
} from '../../lib/runtimeApi'
import HelpHint from '../HelpHint.vue'

const props = defineProps<{
  roleId: string
  active?: boolean
}>()

const STORAGE_API = 'oclive-pack-editor-api-base'

const apiBase = ref('http://127.0.0.1:8420')
const healthOk = ref<boolean | null>(null)
const healthMessage = ref('')

const loading = ref(false)
const err = ref('')

const pageSize = ref(80)
const offset = ref(0)
const items = ref<RuntimeRoleFeedbackItem[]>([])

const filterStatus = ref<'all' | 'open' | 'handled'>('open')
const filterUnreadOnly = ref(false)
const q = ref('')
const noteDraft = ref<Record<number, string>>({})

function loadPersisted(): void {
  try {
    const v = localStorage.getItem(STORAGE_API)
    if (v && v.trim()) apiBase.value = v.trim()
  } catch {
    /* ignore */
  }
}

watch(apiBase, (v) => {
  try {
    localStorage.setItem(STORAGE_API, v.trim())
  } catch {
    /* ignore */
  }
})

async function ping(): Promise<void> {
  healthOk.value = null
  healthMessage.value = ''
  try {
    const r = await fetchRuntimeHealth(apiBase.value)
    healthOk.value = true
    healthMessage.value = r.trim() ? `OK：${r.trim()}` : 'OK'
  } catch (e) {
    healthOk.value = false
    healthMessage.value = e instanceof Error ? e.message : String(e)
  }
}

async function refresh(resetOffset = true): Promise<void> {
  if (!props.roleId.trim()) return
  loading.value = true
  err.value = ''
  try {
    if (resetOffset) {
      offset.value = 0
      items.value = []
    }
    const page = await fetchRuntimeRoleFeedback(
      apiBase.value,
      props.roleId,
      pageSize.value,
      offset.value,
    )
    items.value = resetOffset ? page : items.value.concat(page)
    offset.value = items.value.length
    // best-effort mark read when creator loads the page (does not block UI)
    try {
      const ids = page.map((x) => x.id)
      await markRuntimeRoleFeedbackRead(apiBase.value, props.roleId, ids)
    } catch {
      /* ignore */
    }
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function isHandled(it: RuntimeRoleFeedbackItem): boolean {
  return (it.status || '').toLowerCase() === 'handled'
}

const filtered = computed(() => {
  const tab = filterStatus.value
  const qq = q.value.trim().toLowerCase()
  return items.value.filter((it) => {
    if (tab !== 'all') {
      const h = isHandled(it)
      if (tab === 'handled' && !h) return false
      if (tab === 'open' && h) return false
    }
    if (filterUnreadOnly.value && it.read_at) return false
    if (!qq) return true
    const blob = [
      it.mood_tag ?? '',
      it.message ?? '',
      it.scene_id ?? '',
      it.presence_mode ?? '',
      it.role_version ?? '',
      it.runtime_version ?? '',
      it.client_version ?? '',
      it.source ?? '',
      it.session_id ?? '',
    ]
      .join('\n')
      .toLowerCase()
    return blob.includes(qq)
  })
})

function downloadText(filename: string, content: string, mime = 'application/json'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function exportJson(): void {
  const rid = props.roleId.trim() || 'unknown-role'
  const now = new Date().toISOString().replace(/[:]/g, '-')
  downloadText(
    `role-feedback-${rid}-${now}.json`,
    JSON.stringify(
      {
        schemaVersion: 1,
        roleId: rid,
        exportedAt: new Date().toISOString(),
        apiBase: apiBase.value.trim(),
        count: filtered.value.length,
        items: filtered.value,
      },
      null,
      2,
    ),
  )
}

async function toggleHandled(it: RuntimeRoleFeedbackItem, handled: boolean): Promise<void> {
  try {
    await setRuntimeRoleFeedbackHandled(
      apiBase.value,
      props.roleId,
      it.id,
      handled,
      noteDraft.value[it.id] || it.handled_note || '',
    )
    await refresh(true)
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e)
  }
}

const workspaceActivated = ref(false)

watch(
  () => props.active === true,
  (active) => {
    if (!active) return
    if (workspaceActivated.value) return
    workspaceActivated.value = true
    loadPersisted()
    void ping()
    void refresh(true)
  },
  { immediate: true },
)
</script>

<template>
  <section class="fbw">
    <header class="fbw-head">
      <div>
        <h2 class="fbw-h2">反馈工作台（半私密）</h2>
        <p class="fbw-sub">
          这里显示使用者在主应用提交的「反馈此角色包」。默认仅本机可见；你可以标记已处理并写备注。
        </p>
      </div>
      <div class="fbw-actions">
        <button type="button" class="btn" :disabled="loading" @click="refresh(true)">刷新</button>
        <button type="button" class="btn" :disabled="filtered.length === 0" @click="exportJson">
          导出 JSON
        </button>
      </div>
    </header>

    <div class="fbw-bar">
      <label class="fbw-field">
        连接地址
        <input v-model="apiBase" class="input" spellcheck="false" />
      </label>
      <button type="button" class="btn" @click="ping">检测连接</button>
      <span
        class="fbw-health"
        :class="healthOk === true ? 'ok' : healthOk === false ? 'bad' : ''"
      >
        {{ healthOk === null ? '未检测' : healthOk ? '已连接' : '连接失败' }}
      </span>
      <HelpHint v-if="healthMessage" :lines="[healthMessage]" />
    </div>

    <div class="fbw-filters">
      <div class="tabs">
        <button
          type="button"
          class="tab"
          :class="{ active: filterStatus === 'open' }"
          @click="filterStatus = 'open'"
        >
          未处理
        </button>
        <button
          type="button"
          class="tab"
          :class="{ active: filterStatus === 'handled' }"
          @click="filterStatus = 'handled'"
        >
          已处理
        </button>
        <button
          type="button"
          class="tab"
          :class="{ active: filterStatus === 'all' }"
          @click="filterStatus = 'all'"
        >
          全部
        </button>
      </div>
      <label class="chk">
        <input v-model="filterUnreadOnly" type="checkbox" />
        仅未读
      </label>
      <label class="fbw-field grow">
        搜索
        <input v-model="q" class="input" placeholder="关键词：内容/场景/版本/来源…" />
      </label>
      <label class="fbw-field">
        每页
        <input v-model.number="pageSize" class="input input--sm" type="number" min="10" max="200" />
      </label>
      <button type="button" class="btn" :disabled="loading" @click="refresh(true)">应用</button>
    </div>

    <p v-if="err" class="err">{{ err }}</p>
    <p v-else-if="loading && items.length === 0" class="muted">加载中…</p>
    <p v-else-if="filtered.length === 0" class="muted">暂无反馈。</p>

    <ul v-else class="fbw-list">
      <li v-for="it in filtered" :key="it.id" class="fbw-item">
        <div class="fbw-item-head">
          <strong>#{{ it.id }}</strong>
          <span class="pill" :class="isHandled(it) ? 'handled' : 'open'">
            {{ isHandled(it) ? '已处理' : '未处理' }}
          </span>
          <span class="muted">· {{ it.created_at }}</span>
          <span v-if="it.scene_id" class="muted">· scene={{ it.scene_id }}</span>
          <span v-if="it.presence_mode" class="muted">· presence={{ it.presence_mode }}</span>
          <span v-if="it.mood_tag" class="muted">· mood={{ it.mood_tag }}</span>
        </div>
        <p class="fbw-msg">{{ it.message }}</p>
        <p class="fbw-meta muted">
          <span v-if="it.role_version">role={{ it.role_version }}</span>
          <span v-if="it.runtime_version"> · runtime={{ it.runtime_version }}</span>
          <span v-if="it.client_version"> · client={{ it.client_version }}</span>
          <span v-if="it.source"> · source={{ it.source }}</span>
          <span v-if="it.session_id"> · session={{ it.session_id }}</span>
        </p>
        <div class="fbw-item-actions">
          <label class="fbw-field grow">
            处理备注
            <input
              v-model="noteDraft[it.id]"
              class="input"
              :placeholder="it.handled_note || '（可选）写下你怎么修复/要怎么改…'"
            />
          </label>
          <button
            v-if="!isHandled(it)"
            type="button"
            class="btn primary"
            :disabled="loading"
            @click="toggleHandled(it, true)"
          >
            标记已处理
          </button>
          <button
            v-else
            type="button"
            class="btn"
            :disabled="loading"
            @click="toggleHandled(it, false)"
          >
            取消已处理
          </button>
        </div>
      </li>
    </ul>

    <div class="fbw-more">
      <button type="button" class="btn" :disabled="loading" @click="refresh(false)">加载更多</button>
      <span class="muted">已加载 {{ items.length }} 条 · 当前显示 {{ filtered.length }} 条</span>
    </div>
  </section>
</template>

<style scoped>
.fbw {
  display: grid;
  gap: 12px;
}
.fbw-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}
.fbw-h2 {
  margin: 0;
  font-size: 18px;
}
.fbw-sub {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}
.fbw-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.fbw-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  background: var(--bg-elevated);
}
.fbw-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: end;
}
.fbw-field {
  display: grid;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}
.fbw-field.grow {
  flex: 1;
  min-width: 220px;
}
.input {
  padding: 7px 9px;
  border-radius: 10px;
  border: 1px solid var(--border-light);
  background: var(--bg-primary);
  color: var(--text-primary);
}
.input--sm {
  width: 90px;
}
.btn {
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid var(--border-light);
  background: var(--bg-elevated);
  color: var(--text-primary);
  cursor: pointer;
}
.btn.primary {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border-light));
  background: color-mix(in srgb, var(--accent) 12%, var(--bg-elevated));
}
.tabs {
  display: inline-flex;
  border: 1px solid var(--border-light);
  border-radius: 999px;
  overflow: hidden;
  background: var(--bg-elevated);
}
.tab {
  padding: 6px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 12px;
}
.tab.active {
  color: var(--text-primary);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}
.chk {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  user-select: none;
  font-size: 12px;
  color: var(--text-secondary);
}
.fbw-health {
  font-size: 12px;
  color: var(--text-secondary);
}
.fbw-health.ok {
  color: var(--success-700, #1e7e34);
}
.fbw-health.bad {
  color: var(--danger-600, #c0392b);
}
.err {
  color: var(--danger-600, #c0392b);
  font-size: 13px;
}
.muted {
  color: var(--text-secondary);
  font-size: 13px;
}
.fbw-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}
.fbw-item {
  border: 1px solid var(--border-light);
  border-radius: 12px;
  background: var(--bg-elevated);
  padding: 10px 12px;
}
.fbw-item-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.pill {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid var(--border-light);
}
.pill.open {
  color: var(--warning-700, #8a5a00);
  background: color-mix(in srgb, var(--warning-700, #8a5a00) 10%, var(--bg-elevated));
}
.pill.handled {
  color: var(--success-700, #1e7e34);
  background: color-mix(in srgb, var(--success-700, #1e7e34) 10%, var(--bg-elevated));
}
.fbw-msg {
  margin: 8px 0 0;
  white-space: pre-wrap;
  line-height: 1.55;
}
.fbw-meta {
  margin: 6px 0 0;
  font-size: 12px;
}
.fbw-item-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  align-items: end;
  flex-wrap: wrap;
}
.fbw-more {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}
</style>

