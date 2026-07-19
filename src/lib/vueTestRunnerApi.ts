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
  _method: string,
  _params: Record<string, unknown>,
  _searchRoots: string[],
): Promise<unknown> {
  throw new Error('编写器已停用可执行目录插件的测试入口；请在隔离的 OCLive 运行时中测试插件')
}
