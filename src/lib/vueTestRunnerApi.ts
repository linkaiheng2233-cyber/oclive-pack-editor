import { invoke } from '@tauri-apps/api/core'

export const VUE_TEST_RUNNER_PLUGIN_ID = 'com.oclive.official_vue_test_runner'

const LS_WORKSPACE = 'oclive.packEditor.vueTestWorkspaceRoot'

export type JsonRpcEnvelope = {
  jsonrpc?: string
  id?: unknown
  result?: unknown
  error?: { code?: number; message?: string }
}

export function loadVueTestWorkspaceRoot(): string {
  try {
    return localStorage.getItem(LS_WORKSPACE)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function saveVueTestWorkspaceRoot(path: string): void {
  try {
    localStorage.setItem(LS_WORKSPACE, path.trim())
  } catch {
    /* ignore */
  }
}

export async function directoryPluginJsonRpcInvoke(
  method: string,
  params: Record<string, unknown>,
  searchRoots: string[],
): Promise<unknown> {
  const env = await invoke<JsonRpcEnvelope>('directory_plugin_jsonrpc_invoke', {
    pluginId: VUE_TEST_RUNNER_PLUGIN_ID,
    method,
    params,
    searchRoots,
  })
  if (env.error?.message) {
    throw new Error(env.error.message)
  }
  return env.result
}
