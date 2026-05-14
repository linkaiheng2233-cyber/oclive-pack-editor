/**
 * 占位：未执行 `npm run wasm:build` 时由 Vite 解析；真实构建会覆盖本目录。
 * 与 `src/lib/wasmValidation.ts` 中 `__OCWASM_NOT_BUILT__` 回退逻辑一致。
 */
export default function init() {
  return Promise.resolve()
}

export function validateManifestWasm() {
  throw new Error('__OCWASM_NOT_BUILT__')
}

export function validateRolePackWasm() {
  throw new Error('__OCWASM_NOT_BUILT__')
}
