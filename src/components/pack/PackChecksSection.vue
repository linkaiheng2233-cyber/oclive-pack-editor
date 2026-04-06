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
  padding: 0.85rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
}
.checks h2 {
  font-size: 1rem;
  margin: 0 0 0.35rem;
}
.check-desc {
  margin: 0 0 0.65rem;
  font-size: 0.88rem;
  color: #555;
  line-height: 1.45;
}
.check-sub {
  margin: 0.5rem 0 0;
  font-size: 0.82rem;
  color: #666;
  line-height: 1.45;
}
.check-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
}
.chk {
  font-size: 0.88rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  user-select: none;
}
</style>
