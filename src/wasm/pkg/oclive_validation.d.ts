export default function init(): Promise<void>

export function validateManifestWasm(
  manifestJson: string,
  mergedSceneIdsJson: string,
  hostRuntimeVersion: string,
): void

export function validateRolePackWasm(
  manifestJson: string,
  settingsJson: string,
  mergedSceneIdsJson: string,
  hostRuntimeVersion: string,
  settingsSchemaSupported: number,
): void
