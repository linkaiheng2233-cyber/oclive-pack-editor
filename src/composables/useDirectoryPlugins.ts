import { ref, watch, type Ref } from 'vue'
import { listDirectoryPluginsForRolesRoot } from '../lib/directoryPluginsApi'
import type { DirectoryPluginInfo } from '../types/plugin'

export type PluginCapability = 'memory' | 'emotion' | 'event' | 'prompt' | 'llm'

/** 未声明 `provides` 的插件视为可用于任意能力。 */
export function pluginsForCapability(
  list: DirectoryPluginInfo[],
  cap: PluginCapability,
): DirectoryPluginInfo[] {
  return list.filter((p) => {
    if (!p.provides.length) {
      return true
    }
    return p.provides.map((x) => x.trim().toLowerCase()).includes(cap)
  })
}

export function useDirectoryPlugins(rolesRoot: Ref<string>) {
  const plugins = ref<DirectoryPluginInfo[]>([])
  const loadError = ref<string | null>(null)
  const loading = ref(false)
  let lastLoadedRoot = ''
  let debounceTimer: number | null = null

  async function load(): Promise<void> {
    const root = rolesRoot.value?.trim() ?? ''
    if (root === lastLoadedRoot && plugins.value.length > 0) {
      return
    }
    loading.value = true
    try {
      plugins.value = await listDirectoryPluginsForRolesRoot(root === '' ? null : root)
      loadError.value = null
      lastLoadedRoot = root
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : String(e)
      plugins.value = []
    } finally {
      loading.value = false
    }
  }

  watch(
    rolesRoot,
    () => {
      if (debounceTimer != null) {
        window.clearTimeout(debounceTimer)
      }
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null
        void load()
      }, 200)
    },
    { immediate: true },
  )

  return { plugins, loadError, loading, load }
}
