<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from "vue-i18n";
import type { AdvFaqItem } from '../lib/advancedEditorFaq'
import { buildHighlightSegments } from '../lib/advancedEditorFaq'

const props = withDefaults(
  defineProps<{
    items: readonly AdvFaqItem[]
    /** 为 true 时显示顶部「怎么用这份列表」说明；多段里只开一处即可 */
    showIntro?: boolean
  }>(),
  { showIntro: false },
)

const activeId = ref<string | null>(null)

const { t } = useI18n()

function onToggle(id: string, ev: Event): void {
  const el = ev.target as HTMLDetailsElement
  const container = el.closest('.adv-faq-list')
  if (el.open) {
    container?.querySelectorAll('details.faq-item').forEach((d) => {
      if (d !== el) (d as HTMLDetailsElement).open = false
    })
    activeId.value = id
  } else if (activeId.value === id) {
    activeId.value = null
  }
}

function segs(code: string, tokens: readonly string[] | undefined) {
  return buildHighlightSegments(code, tokens)
}
</script>

<template>
  <div class="adv-faq-list" role="region">
    <p v-if="showIntro" class="adv-faq-lead">
      {{ t("advFaqList.introPrefix") }}<strong>{{ t("advFaqList.introStrong") }}</strong>{{ t("advFaqList.introSuffix") }}
    </p>
    <details
      v-for="item in items"
      :key="item.id"
      class="faq-item"
      :class="{ 'faq-item--active': activeId === item.id }"
      @toggle="onToggle(item.id, $event)"
    >
      <summary class="faq-summary">
        <span class="faq-q">{{ item.question }}</span>
      </summary>
      <div class="faq-body">
        <p class="faq-plain">{{ item.plainExplain }}</p>
        <div class="faq-compare">
          <div class="faq-col">
            <span class="faq-lbl">{{ t("advFaqList.beforeLabel") }}</span>
            <pre class="faq-pre" :aria-label="String(t('advFaqList.beforeAria'))"><template
                v-for="(seg, i) in segs(item.beforeCode, item.highlightBefore)"
                :key="'b' + item.id + i"
                ><mark v-if="seg.hl" class="faq-mark">{{ seg.text }}</mark
                ><span v-else class="faq-txt">{{ seg.text }}</span></template
              ></pre>
          </div>
          <div class="faq-col">
            <span class="faq-lbl">{{ t("advFaqList.afterLabel") }}</span>
            <pre class="faq-pre" :aria-label="String(t('advFaqList.afterAria'))"><template
                v-for="(seg, i) in segs(item.afterCode, item.highlightAfter)"
                :key="'a' + item.id + i"
                ><mark v-if="seg.hl" class="faq-mark">{{ seg.text }}</mark
                ><span v-else class="faq-txt">{{ seg.text }}</span></template
              ></pre>
          </div>
        </div>
      </div>
    </details>
  </div>
</template>

<style scoped>
.adv-faq-lead {
  margin: 0 0 0.75rem;
  font-size: 0.78rem;
  line-height: 1.55;
  color: var(--fluent-text-secondary);
}
.adv-faq-lead strong {
  color: var(--fluent-text-primary);
}
.faq-item {
  margin-bottom: 0.45rem;
  border: 1px solid var(--pack-glass-border);
  border-radius: var(--fluent-radius);
  background: color-mix(in srgb, var(--fluent-bg-card) 70%, transparent);
  overflow: hidden;
}
.faq-summary {
  list-style: none;
  cursor: pointer;
  padding: 0.55rem 0.65rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--fluent-text-primary);
  line-height: 1.45;
}
.faq-summary::-webkit-details-marker {
  display: none;
}
.faq-summary::before {
  content: '▸';
  display: inline-block;
  margin-right: 0.4rem;
  color: var(--fluent-accent);
  transition: transform 0.15s ease;
  font-size: 0.75rem;
}
.faq-item[open] .faq-summary::before {
  transform: rotate(90deg);
}
.faq-summary:hover {
  background: color-mix(in srgb, var(--fluent-accent) 8%, transparent);
}
.faq-q {
  display: inline;
}
.faq-body {
  padding: 0 0.65rem 0.65rem;
  border-top: 1px solid color-mix(in srgb, var(--pack-glass-border) 70%, transparent);
}
.faq-plain {
  margin: 0.5rem 0 0.65rem;
  font-size: 0.78rem;
  line-height: 1.55;
  color: var(--fluent-text-secondary);
}
.faq-compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
@media (max-width: 720px) {
  .faq-compare {
    grid-template-columns: 1fr;
  }
}
.faq-col {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.faq-lbl {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--fluent-text-secondary);
}
.faq-pre {
  margin: 0;
  padding: 0.45rem 0.5rem;
  font-size: 0.68rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--fluent-mono);
  border-radius: 6px;
  border: 1px solid var(--pack-glass-border);
  background: var(--fluent-bg-input);
  color: var(--fluent-text-primary);
  max-height: min(36vh, 260px);
  overflow: auto;
}
.faq-mark {
  background: color-mix(in srgb, var(--fluent-text-secondary) 20%, transparent);
  color: inherit;
  padding: 0.05rem 0;
  border-radius: 2px;
}
.faq-item--active .faq-mark {
  background: color-mix(in srgb, var(--fluent-text-secondary) 32%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--fluent-text-secondary) 28%, transparent);
}
.faq-item--active .faq-summary {
  background: color-mix(in srgb, var(--fluent-accent) 10%, transparent);
}
</style>
