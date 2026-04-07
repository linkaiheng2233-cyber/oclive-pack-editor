<script setup lang="ts">
const requireChecksBeforeExport = defineModel<boolean>('requireChecksBeforeExport', {
  required: true,
})

const emit = defineEmits<{
  runValidate: []
}>()
</script>

<template>
  <section class="panel checks">
    <h2>角色包检查</h2>
    <p class="check-desc">
      校验 manifest / settings JSON 与契约一致性。编写器内不提供运行时联调；导出时可选校验，通过后即可把包放入 roles 测试。
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
  </section>
</template>

<style scoped>
.checks {
  margin-top: 1rem;
  padding: 1rem 1.125rem;
  border: 1px solid var(--fluent-border-stroke);
  border-radius: var(--fluent-radius-lg);
  background: var(--fluent-bg-card);
  box-shadow: var(--fluent-shadow-card);
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
  transition: background 0.15s ease;
}
.check-row button:hover {
  background: var(--fluent-accent-hover);
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
