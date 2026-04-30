<script setup lang="ts">
import type { RuntimeRoleFeedbackItem } from "../../lib/runtimeApi";

const props = defineProps<{
  open: boolean
  loading: boolean
  err: string
  items: RuntimeRoleFeedbackItem[]
  filter: 'all' | 'open' | 'handled'
  noteDraft: Record<number, string>
}>()

const emit = defineEmits<{
  close: []
  setFilter: [v: 'all' | 'open' | 'handled']
  updateNote: [id: number, v: string]
  toggleHandled: [it: RuntimeRoleFeedbackItem, next: boolean]
}>()

function filteredItems(): RuntimeRoleFeedbackItem[] {
  const tab = props.filter
  if (tab === 'all') return props.items
  return props.items.filter((x) => {
    const st = String(x.status ?? '').toLowerCase()
    const isHandled = st === 'handled'
    return tab === 'handled' ? isHandled : !isHandled
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-backdrop"
      role="dialog"
      aria-modal="true"
      @click="emit('close')"
    >
      <div class="modal-card" @click.stop>
        <h3 class="modal-title">最近反馈（仅本机存储）</h3>
        <p class="modal-sub">这些反馈来自用户在 oclive 主程序中提交的「反馈此角色包」。默认仅创作者可见。</p>
        <p v-if="loading" class="modal-sub">读取中…</p>
        <p v-else-if="err" class="modal-err">{{ err }}</p>
        <div v-else class="fb-list">
          <p v-if="!items.length" class="modal-sub">暂无反馈。</p>
          <div class="fb-tabs">
            <button type="button" class="secondary" @click="emit('setFilter', 'open')">未处理</button>
            <button type="button" class="secondary" @click="emit('setFilter', 'handled')">已处理</button>
            <button type="button" class="secondary" @click="emit('setFilter', 'all')">全部</button>
          </div>
          <div v-for="it in filteredItems()" :key="it.id" class="fb-item">
            <div class="fb-top">
              <span class="fb-time">{{ it.created_at }}</span>
              <span v-if="it.mood_tag" class="fb-tag">情绪：{{ it.mood_tag }}</span>
              <span v-if="it.scene_id" class="fb-tag">场景：{{ it.scene_id }}</span>
              <span v-if="it.status" class="fb-tag">状态：{{ it.status }}</span>
            </div>
            <div class="fb-msg">{{ it.message }}</div>
            <div class="fb-actions">
              <input
                class="fb-note"
                type="text"
                :value="noteDraft[it.id] || it.handled_note || ''"
                placeholder="处理备注（可选）"
                @input="emit('updateNote', it.id, ($event.target as HTMLInputElement).value)"
              />
              <button
                v-if="(it.status || '').toLowerCase() !== 'handled'"
                type="button"
                class="secondary"
                @click="emit('toggleHandled', it, true)"
              >
                标记已处理
              </button>
              <button v-else type="button" class="secondary" @click="emit('toggleHandled', it, false)">
                取消已处理
              </button>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="secondary" @click="emit('close')">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.55);
}
.modal-card {
  width: 100%;
  max-width: 720px;
  padding: 16px 16px 12px;
  border-radius: var(--fluent-radius-lg);
  background: var(--pack-glass-fill);
  border: 1px solid var(--pack-glass-border);
  box-shadow: var(--fluent-shadow-card), var(--pack-glass-inset);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
}
.modal-title {
  margin: 0 0 8px;
  font-size: 15px;
}
.modal-sub {
  margin: 0 0 10px;
  color: var(--fluent-text-secondary);
  font-size: 0.8125rem;
  line-height: 1.45;
}
.modal-err {
  margin: 0 0 10px;
  color: #ffb4b4;
  font-size: 0.8125rem;
}
.fb-list {
  max-height: 52vh;
  overflow: auto;
  padding-right: 4px;
}
.fb-item {
  border: 1px solid var(--pack-glass-border);
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 10px;
  background: rgba(0, 0, 0, 0.12);
}
.fb-top {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 6px;
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
}
.fb-tag {
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--pack-glass-border);
  background: rgba(0, 0, 0, 0.18);
}
.fb-msg {
  white-space: pre-wrap;
  line-height: 1.5;
}
.fb-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 0 0 0.75rem;
}
.fb-actions {
  margin-top: 0.6rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}
.fb-note {
  flex: 1 1 240px;
  min-width: 200px;
  padding: 0.4rem 0.55rem;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--pack-glass-border);
  background: var(--pack-glass-fill-subtle);
  color: var(--fluent-text-primary);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
