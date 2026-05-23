<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export type EditorHotkeyBinding = {
  id: string
  accelerator: string
  viewId: string
  enabled: boolean
}

const props = defineProps<{
  bindings: EditorHotkeyBinding[]
}>()

const emit = defineEmits<{
  'update:bindings': [EditorHotkeyBinding[]]
}>()

const { t } = useI18n()
const conflictIds = ref<string[]>([])

const rows = computed({
  get: () => props.bindings,
  set: (next) => emit('update:bindings', next),
})

function recomputeConflicts(): void {
  const seen = new Map<string, string>()
  const dupes: string[] = []
  for (const b of rows.value) {
    const key = b.accelerator.trim().toLowerCase()
    if (!key || !b.enabled) continue
    const prev = seen.get(key)
    if (prev) {
      dupes.push(prev, b.id)
    } else {
      seen.set(key, b.id)
    }
  }
  conflictIds.value = [...new Set(dupes)]
}

function patchRow(i: number, patch: Partial<EditorHotkeyBinding>): void {
  const next = [...rows.value]
  const row = next[i]
  if (!row) return
  next[i] = { ...row, ...patch }
  rows.value = next
  recomputeConflicts()
}

function addBinding(): void {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `hk-${Date.now()}`
  rows.value = [
    ...rows.value,
    { id, accelerator: '', viewId: 'start', enabled: false },
  ]
  recomputeConflicts()
}

function removeAt(i: number): void {
  const next = [...rows.value]
  next.splice(i, 1)
  rows.value = next
  recomputeConflicts()
}

recomputeConflicts()
</script>

<template>
  <section class="hkset">
    <h3 class="hkset-h">{{ t('packEditor.hotkeys.title') }}</h3>
    <p v-if="conflictIds.length" class="hkset-conflict" role="alert">
      {{ t('packEditor.hotkeys.conflictHint') }}
    </p>
    <div v-for="(b, i) in rows" :key="b.id" class="hkset-row">
      <label class="hkset-field">
        <span>{{ t('packEditor.hotkeys.accelerator') }}</span>
        <input
          :value="b.accelerator"
          type="text"
          :class="{ 'is-conflict': conflictIds.includes(b.id) }"
          @input="patchRow(i, { accelerator: ($event.target as HTMLInputElement).value })"
        />
      </label>
      <label class="hkset-field">
        <span>{{ t('packEditor.hotkeys.view') }}</span>
        <select
          :value="b.viewId"
          @change="patchRow(i, { viewId: ($event.target as HTMLSelectElement).value })"
        >
          <option value="start">{{ t('packEditor.nav.start') }}</option>
          <option value="simple">{{ t('packEditor.nav.simple') }}</option>
          <option value="advanced">{{ t('packEditor.nav.advanced') }}</option>
          <option value="check">{{ t('packEditor.nav.check') }}</option>
          <option value="chat">{{ t('packEditor.nav.chat') }}</option>
          <option value="feedback">{{ t('packEditor.nav.feedback') }}</option>
        </select>
      </label>
      <label class="hkset-chk">
        <input
          type="checkbox"
          :checked="b.enabled"
          @change="patchRow(i, { enabled: ($event.target as HTMLInputElement).checked })"
        />
        {{ t('packEditor.hotkeys.enabled') }}
      </label>
      <button type="button" class="hkset-remove" @click="removeAt(i)">
        {{ t('packEditor.hotkeys.remove') }}
      </button>
    </div>
    <button type="button" class="hkset-add" @click="addBinding">
      {{ t('packEditor.hotkeys.add') }}
    </button>
  </section>
</template>

<style scoped>
.hkset {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hkset-h {
  margin: 0;
  font-size: 1rem;
}
.hkset-conflict {
  margin: 0;
  color: #b42318;
  font-size: 0.875rem;
}
.hkset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
  padding: 8px 0;
  border-bottom: 1px solid var(--fluent-border, #ddd);
}
.hkset-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8125rem;
}
.hkset-field input.is-conflict {
  border-color: #b42318;
}
.hkset-chk {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
}
.hkset-remove,
.hkset-add {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--fluent-border, #ccc);
  background: var(--fluent-bg-subtle, #f5f5f5);
  cursor: pointer;
}
</style>
