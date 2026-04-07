/**
 * 占位模块：运行 `npm run wasm:build` 后由 wasm-pack 覆盖，以启用与 oclive 运行时一致的 manifest 校验。
 * 未覆盖时 `validateManifestWasm` 抛出 `__OCWASM_NOT_BUILT__`，前端回退到 TypeScript 轻量校验。
 */
export default async function init() {}

export function validateManifestWasm(_manifestJson, _mergedSceneIdsJson) {
  throw new Error('__OCWASM_NOT_BUILT__')
}
