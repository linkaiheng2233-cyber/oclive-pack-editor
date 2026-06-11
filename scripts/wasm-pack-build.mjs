/**
 * 跨平台 wasm-pack：可用环境变量覆盖路径（仓库布局不同时不必改 package.json）。
 *
 * - OCLIVE_VALIDATION_WASM_CRATE：指向 `oclive_validation_wasm` 的 Cargo 目录（含 Cargo.toml）
 * - OCLIVE_WASM_OUT：输出目录（默认本仓库 `src/wasm/pkg`）
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const editorRoot = join(here, '..')

const defaultCrate = join(
  editorRoot,
  '..',
  'oclivenewnew',
  'crates',
  'oclive_validation_wasm',
)
const defaultOut = join(editorRoot, 'src', 'wasm', 'pkg')

const crate =
  process.env.OCLIVE_VALIDATION_WASM_CRATE ??
  process.env.OCLIVE_VALIDATION_CRATE ??
  defaultCrate
const outDir = process.env.OCLIVE_WASM_OUT ?? defaultOut

if (!existsSync(join(crate, 'Cargo.toml'))) {
  console.error(
    `[wasm-pack-build] 找不到 crate：${crate}\n` +
      '请设置 OCLIVE_VALIDATION_WASM_CRATE 指向 oclive_validation_wasm 目录，或将 oclivenewnew 放在与本编写器同级目录。',
  )
  process.exit(1)
}

const r = spawnSync(
  'wasm-pack',
  [
    'build',
    crate,
    '--target',
    'web',
    '--out-dir',
    outDir,
    '--out-name',
    'oclive_validation',
    '--no-opt',
  ],
  { stdio: 'inherit', shell: false },
)

if (r.error) {
  console.error(
    '[wasm-pack-build] 无法执行 wasm-pack：',
    r.error.message,
    '\n请安装：https://rustwasm.github.io/wasm-pack/installer/',
  )
  process.exit(1)
}
process.exit(r.status ?? 1)
