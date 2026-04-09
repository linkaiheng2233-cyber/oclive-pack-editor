<script setup lang="ts">
import AdvFaqList from '../AdvFaqList.vue'
import { CHECKS_FAQ } from '../../lib/simpleEditorFaq'

const requireChecksBeforeExport = defineModel<boolean>('requireChecksBeforeExport', {
  required: true,
})

defineProps<{
  /** 最近一次检查是否使用 wasm；未运行过检查时为 `null` */
  validationLastUsedWasm: boolean | null
}>()

const emit = defineEmits<{
  runValidate: []
}>()
</script>

<template>
  <section class="panel checks">
    <h2>角色包检查</h2>
    <p class="check-desc">
      校验 manifest / settings JSON 与契约一致性。若已用 <code>wasm-pack</code> 生成校验模块，则优先使用与
      oclivenewnew 共享的 Rust 逻辑；否则回退到 TypeScript 检查。导出时可选校验，通过后即可把包放入 roles 测试。
    </p>
    <p v-if="validationLastUsedWasm === null" class="check-wasm check-wasm--muted" role="status">
      尚未运行检查；运行后将显示使用的校验方式（Rust wasm 或 TypeScript）。
    </p>
    <p v-else-if="validationLastUsedWasm" class="check-wasm" role="status">
      最近一次检查：Rust wasm
    </p>
    <p v-else class="check-wasm check-wasm--muted" role="status">
      最近一次检查：TypeScript（wasm 未启用或未构建）
    </p>
    <div class="check-row">
      <button type="button" @click="emit('runValidate')">运行全部检查</button>
      <label class="chk">
        <input v-model="requireChecksBeforeExport" type="checkbox" />
        导出前校验包内容
      </label>
    </div>
    <p class="check-sub">
      关闭后可直接导出 .zip / 写入文件夹，便于携带未完成包或使用插件在 oclive 中自由实测。
    </p>
    <details class="checks-faq-details">
      <summary class="checks-faq-sum">常见问题 · 检查与导出</summary>
      <AdvFaqList :items="CHECKS_FAQ" />
    </details>
  </section>
</template>

<style scoped>
.checks {
  margin-top: 1rem;
  padding: 1rem 1.125rem;
  border: 1px solid var(--pack-glass-border);
  border-radius: var(--fluent-radius-lg);
  background: var(--pack-glass-fill);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  box-shadow: var(--fluent-shadow-card), var(--pack-glass-inset);
}
.checks h2 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}
.check-desc {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--fluent-text-secondary);
  line-height: 1.5;
}
.check-desc code {
  font-size: 0.8125rem;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  background: var(--fluent-bg-subtle);
}
.check-wasm {
  margin: 0 0 0.65rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--fluent-success-text);
}
.check-wasm--muted {
  font-weight: 400;
  color: var(--fluent-text-secondary);
}
.check-sub {
  margin: 0.75rem 0 0;
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
  line-height: 1.5;
}
.check-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
}
.check-row button {
  padding: 0.5rem 1rem;
  min-height: 32px;
  border-radius: var(--fluent-radius);
  border: none;
  background: var(--fluent-accent);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: var(--fluent-font);
  cursor: pointer;
  box-shadow:
    var(--fluent-shadow-soft),
    0 1px 0 color-mix(in srgb, #fff 18%, transparent);
  transition:
    background 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.15s ease;
}
.check-row button:hover {
  background: var(--fluent-accent-hover);
}
.checks-faq-details {
  margin-top: 1rem;
  padding: 0.55rem 0.75rem 0.75rem;
  border: 1px solid var(--pack-glass-border);
  border-radius: var(--fluent-radius-lg);
  background: color-mix(in srgb, var(--fluent-bg-card) 50%, transparent);
}
.checks-faq-sum {
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--fluent-text-primary);
  list-style: none;
}
.checks-faq-details[open] .checks-faq-sum {
  margin-bottom: 0.6rem;
}
.checks-faq-sum::-webkit-details-marker {
  display: none;
}
.check-row button:focus-visible {
  outline: none;
  box-shadow:
    var(--fluent-shadow-soft),
    0 0 0 2px rgba(255, 255, 255, 0.92),
    0 0 0 4px var(--fluent-border-focus);
}
.check-row button:active {
  transform: scale(0.985);
}
.chk {
  font-size: 0.875rem;
  color: var(--fluent-text-primary);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}
.chk input[type='checkbox'] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--fluent-accent);
}
</style>
