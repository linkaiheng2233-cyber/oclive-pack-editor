/**
 * 将 `settings.json` 中字段覆盖到 manifest（与 oclivenewnew `DiskRoleSettings::apply_to_manifest` 一致）。
 */
export function mergeManifestWithSettings(
  manifest: Record<string, unknown>,
  settings: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...manifest }
  const m = settings.model
  const om = settings.ollama_model
  if (om != null) out.ollama_model = om
  else if (m != null) out.ollama_model = m
  if (settings.identity_binding !== undefined) {
    out.identity_binding = settings.identity_binding
  }
  if (settings.evolution !== undefined) {
    out.evolution = settings.evolution
  }
  if (settings.memory_config !== undefined) {
    out.memory_config = settings.memory_config
  }
  if (settings.knowledge !== undefined) {
    out.knowledge = settings.knowledge
  }
  return out
}
