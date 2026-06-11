<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const requireChecksBeforeExport = defineModel<boolean>('requireChecksBeforeExport', {
  required: true,
})

defineProps<{
  folderExportOk: boolean
  /** 最近一次检查是否使用 wasm；未运行过检查时为 `null` */
  validationLastUsedWasm: boolean | null
}>()

const emit = defineEmits<{
  runValidate: []
  exportOcpak: []
  exportZip: []
  exportFolder: []
}>()

const { t } = useI18n()
const exportOpen = ref(false)
const exportRoot = ref<HTMLElement | null>(null)
const exportToggleBtn = ref<HTMLElement | null>(null)
const menuStyle = ref<{ top: string; left: string; minWidth: string }>({
  top: '0px',
  left: '0px',
  minWidth: '18rem',
})

function toggleExport(): void {
  exportOpen.value = !exportOpen.value
}

function closeExport(): void {
  exportOpen.value = false
}

function updateMenuPosition(): void {
  const btn = exportToggleBtn.value
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  const menuWidth = Math.min(288, Math.max(rect.width + 120, 200))
  menuStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${Math.max(8, rect.right - menuWidth)}px`,
    minWidth: `${menuWidth}px`,
  }
}

watch(exportOpen, async (open) => {
  if (!open) return
  await nextTick()
  updateMenuPosition()
})

function onDocClick(e: MouseEvent): void {
  const target = e.target as Node
  if (exportRoot.value?.contains(target)) return
  const teleported = document.querySelector('.pha-export-menu--teleport')
  if (teleported?.contains(target)) return
  closeExport()
}

function onScrollOrResize(): void {
  if (exportOpen.value) updateMenuPosition()
}

function onExport(action: 'ocpak' | 'zip' | 'folder'): void {
  closeExport()
  if (action === 'ocpak') emit('exportOcpak')
  else if (action === 'zip') emit('exportZip')
  else emit('exportFolder')
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})
</script>

<template>
  <div class="pack-header-actions" role="group" :aria-label="String(t('packEditor.headerActions.aria'))">
    <button
      type="button"
      class="pha-btn pha-btn--check"
      :title="String(t('packEditor.headerActions.checkTitle'))"
      :aria-label="String(t('packEditor.headerActions.checkAria'))"
      @click="emit('runValidate')"
    >
      {{ t('packEditor.headerActions.check') }}
    </button>

    <div ref="exportRoot" class="pha-export">
      <div class="pha-export-split">
        <button
          type="button"
          class="pha-btn pha-btn--export-main"
          @click="onExport('ocpak')"
        >
          {{ t('packEditor.headerActions.export') }}
        </button>
        <button
          ref="exportToggleBtn"
          type="button"
          class="pha-btn pha-btn--export-toggle"
          :aria-expanded="exportOpen"
          :aria-label="String(t('packEditor.headerActions.exportMenuAria'))"
          @click.stop="toggleExport"
        >
          ▾
        </button>
      </div>

      <Teleport to="body">
        <div
          v-if="exportOpen"
          class="pha-export-menu pha-export-menu--teleport"
          role="menu"
          :style="{
            position: 'fixed',
            top: menuStyle.top,
            left: menuStyle.left,
            minWidth: menuStyle.minWidth,
            zIndex: 100,
          }"
        >
          <button type="button" class="pha-menu-item" role="menuitem" @click="onExport('ocpak')">
            {{ t('packEditor.check.exportOcpak') }}
          </button>
          <button type="button" class="pha-menu-item" role="menuitem" @click="onExport('zip')">
            {{ t('packEditor.check.exportZip') }}
          </button>
          <button
            v-if="folderExportOk"
            type="button"
            class="pha-menu-item"
            role="menuitem"
            @click="onExport('folder')"
          >
            {{ t('packEditor.check.exportFolder') }}
          </button>
          <div class="pha-menu-footer">
            <label class="pha-chk">
              <input v-model="requireChecksBeforeExport" type="checkbox" />
              {{ t('packChecks.requireBeforeExport') }}
            </label>
            <p v-if="validationLastUsedWasm === null" class="pha-wasm pha-wasm--muted">
              {{ t('packChecks.status.neverRan') }}
            </p>
            <p v-else-if="validationLastUsedWasm" class="pha-wasm">
              {{ t('packChecks.status.lastPackCheckRust') }}
            </p>
            <p v-else class="pha-wasm pha-wasm--muted">
              {{ t('packChecks.status.lastPackCheckTypeScript') }}
            </p>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.pack-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.pha-btn {
  padding: 0.35rem 0.65rem;
  min-height: 30px;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--pack-glass-border);
  background: var(--pack-glass-fill-strong);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  color: var(--fluent-text-primary);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 500;
  font-family: var(--fluent-font);
  box-shadow: var(--fluent-shadow-soft), var(--pack-glass-inset);
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.1s ease;
}

.pha-btn:hover {
  background: var(--fluent-bg-subtle);
  border-color: var(--fluent-text-secondary);
}

.pha-btn:focus-visible {
  outline: none;
  box-shadow:
    var(--fluent-shadow-soft),
    var(--pack-glass-inset),
    0 0 0 2px rgba(255, 255, 255, 0.92),
    0 0 0 4px var(--fluent-border-focus);
}

.pha-btn:active {
  transform: scale(0.98);
}

.pha-btn--check {
  border-color: color-mix(in srgb, var(--fluent-accent) 35%, var(--pack-glass-border));
}

.pha-btn--export-main {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
  background: var(--fluent-accent);
  color: #fff;
  border-color: var(--fluent-accent);
}

.pha-btn--export-main:hover {
  background: var(--fluent-accent-hover);
  border-color: var(--fluent-accent-hover);
  color: #fff;
}

.pha-export {
  position: relative;
}

.pha-export-split {
  display: inline-flex;
  align-items: stretch;
}

.pha-btn--export-toggle {
  padding: 0.35rem 0.45rem;
  min-width: 1.75rem;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  background: var(--fluent-accent);
  color: #fff;
  border-color: var(--fluent-accent);
}

.pha-btn--export-toggle:hover {
  background: var(--fluent-accent-hover);
  border-color: var(--fluent-accent-hover);
  color: #fff;
}
</style>

<style>
.pha-export-menu--teleport {
  padding: 0.35rem 0;
  border-radius: var(--fluent-radius-lg);
  border: 1px solid var(--pack-glass-border);
  background: var(--fluent-bg-card);
  box-shadow: var(--fluent-shadow-card);
}

.pha-export-menu--teleport .pha-menu-item {
  display: block;
  width: 100%;
  padding: 0.45rem 0.85rem;
  border: none;
  background: transparent;
  color: var(--fluent-text-primary);
  font-size: 0.8125rem;
  font-family: var(--fluent-font);
  text-align: left;
  cursor: pointer;
}

.pha-export-menu--teleport .pha-menu-item:hover {
  background: var(--fluent-bg-subtle);
}

.pha-export-menu--teleport .pha-menu-footer {
  margin-top: 0.25rem;
  padding: 0.55rem 0.85rem 0.45rem;
  border-top: 1px solid var(--pack-glass-border);
}

.pha-export-menu--teleport .pha-chk {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  font-size: 0.78rem;
  color: var(--fluent-text-primary);
  cursor: pointer;
  user-select: none;
}

.pha-export-menu--teleport .pha-chk input[type='checkbox'] {
  margin-top: 0.12rem;
  width: 0.95rem;
  height: 0.95rem;
  accent-color: var(--fluent-accent);
  flex-shrink: 0;
}

.pha-export-menu--teleport .pha-wasm {
  margin: 0.45rem 0 0;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--fluent-success-text);
  line-height: 1.4;
}

.pha-export-menu--teleport .pha-wasm--muted {
  font-weight: 400;
  color: var(--fluent-text-secondary);
}
</style>
