<script setup lang="ts">

import { useI18n } from 'vue-i18n'



const visualEnabled = defineModel<boolean>('visualEnabled', { default: false })

const visualBackend = defineModel<string>('visualBackend', { default: 'image' })

const live2dModel = defineModel<string>('live2dModel', { default: '' })



const { t } = useI18n()

</script>



<template>

  <details class="adv-details">

    <summary>{{ t('advancedCreation.visualPresentation.foldTitle') }}</summary>

    <div class="form-row">

      <label class="check-line">

        <input v-model="visualEnabled" type="checkbox" />

        {{ t('advancedCreation.visualPresentation.enabled') }}

      </label>

      <label class="labelish">{{ t('advancedCreation.visualPresentation.backend') }}</label>

      <select v-model="visualBackend" class="select-lite">

        <option value="image">image</option>

        <option value="live2d">live2d</option>

        <option value="rig3d">rig3d</option>

        <option value="procedural">procedural</option>

        <option value="directory">directory</option>

      </select>

      <label v-if="visualBackend === 'live2d'" class="labelish">

        {{ t('advancedCreation.visualPresentation.live2dModel') }}

        <input

          v-model="live2dModel"

          type="text"

          class="path-input"

          placeholder="assets/live2d/model.model3.json"

        />

      </label>

      <p class="hint tiny">{{ t('advancedCreation.visualPresentation.hint') }}</p>

      <p v-if="visualBackend !== 'image' && visualEnabled" class="hint tiny warn">

        {{ t('advancedCreation.visualPresentation.backendHint') }}

      </p>

    </div>

  </details>

</template>



<style scoped>

.form-row {

  display: flex;

  flex-direction: column;

  gap: 0.35rem;

  margin-top: 0.5rem;

}

.check-line {

  display: flex;

  align-items: center;

  gap: 0.35rem;

}

.select-lite,

.path-input {

  max-width: 24rem;

}

.path-input {

  padding: 0.35rem 0.45rem;

  border: 1px solid var(--fluent-border-control);

  border-radius: var(--fluent-radius);

  font-size: 0.78rem;

  font-family: var(--fluent-mono);

}

.hint.warn {

  color: var(--fluent-danger-text, #b10e1e);

}

</style>

