import { ref, watch } from 'vue'

export type EditorViewId = 'start' | 'simple' | 'advanced' | 'check' | 'chat' | 'feedback' | 'frontendTests' | 'rolePackEditor'

export function useEditorViewState(onBeforeSwitch?: (id: EditorViewId) => void) {
  const editorView = ref<EditorViewId>('start')
  const mountedViews = ref<Set<EditorViewId>>(new Set(['start']))

  watch(editorView, (view) => {
    mountedViews.value.add(view)
    onBeforeSwitch?.(view)
  })

  function shouldMountView(id: EditorViewId): boolean {
    return mountedViews.value.has(id)
  }

  return {
    editorView,
    shouldMountView,
  }
}
