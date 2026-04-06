<script setup lang="ts">
defineProps<{
  summary: string
}>()

const emit = defineEmits<{
  pick: [e: Event]
  append: [e: Event]
  clear: []
}>()
</script>

<template>
  <div class="emotion-row">
    <label>情绪图片</label>
    <div class="emotion-actions">
      <label class="btn-lite">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          class="sr-only"
          @change="emit('pick', $event)"
        />
        选择图片（覆盖当前列表）
      </label>
      <label class="btn-lite">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          class="sr-only"
          @change="emit('append', $event)"
        />
        追加图片
      </label>
      <button type="button" class="btn-lite ghost" @click="emit('clear')">清空列表</button>
    </div>
    <p class="emotion-sum">{{ summary }}</p>
  </div>
</template>

<style scoped>
.emotion-row .emotion-actions {
  margin-top: 0.25rem;
}
.emotion-sum {
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  color: #555;
}
.btn-lite {
  display: inline-block;
  padding: 0.35rem 0.65rem;
  border: 1px solid #aaa;
  border-radius: 6px;
  background: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  margin-right: 0.35rem;
  margin-bottom: 0.35rem;
}
.btn-lite.ghost {
  border-color: #ccc;
  color: #444;
}
.btn-lite:hover {
  background: #f3f3f3;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
