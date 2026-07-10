/**
 * 对比 `src/lib/jsonKeys.ts` 与 oclivenewnew `crates/oclive_validation/src/json_keys.rs` 中的顶层键白名单。
 * 用于发版或与上游契约对齐时的例行检查。
 *
 * 环境变量：
 * - OCLIVE_JSON_KEYS_RS — Rust 源文件绝对或相对路径（默认从本仓库根解析 ../oclivenewnew/...）
 * - OCLIVE_JSON_KEYS_TS — TypeScript 源文件路径（默认 src/lib/jsonKeys.ts）
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

function parseRustKeys(src, constName) {
  const re = new RegExp(
    `const\\s+${constName}:\\s*&\\[\\s*&str\\s*\\]\\s*=\\s*&\\[([\\s\\S]*?)\\];`,
    'm',
  )
  const m = src.match(re)
  if (!m) throw new Error(`未在 Rust 源中找到 ${constName} 数组`)
  const body = m[1]
  const keys = []
  for (const line of body.split('\n')) {
    const q = /"([^"]+)"/.exec(line)
    if (q) keys.push(q[1])
  }
  return keys
}

function parseTsKeys(src, constName) {
  const re = new RegExp(`const\\s+${constName}\\s*=\\s*new\\s+Set\\(\\[([\\s\\S]*?)\\]\\)`, 'm')
  const m = src.match(re)
  if (!m) throw new Error(`未在 TS 源中找到 ${constName} Set`)
  const body = m[1]
  const keys = []
  for (const line of body.split('\n')) {
    const q = /'([^']+)'/.exec(line)
    if (q) keys.push(q[1])
  }
  return keys
}

function compareArrays(label, rustKeys, tsKeys) {
  const tsSet = new Set(tsKeys)
  const rustSet = new Set(rustKeys)
  const onlyRust = rustKeys.filter((k) => !tsSet.has(k))
  const onlyTs = tsKeys.filter((k) => !rustSet.has(k))
  if (onlyRust.length === 0 && onlyTs.length === 0) return
  console.error(`\n${label} 不一致：`)
  if (onlyRust.length) console.error(`  仅在 Rust: ${onlyRust.join(', ')}`)
  if (onlyTs.length) console.error(`  仅在 TS:   ${onlyTs.join(', ')}`)
  process.exitCode = 1
}

const rustPath =
  process.env.OCLIVE_JSON_KEYS_RS ||
  path.join(
    repoRoot,
    '..',
    'oclivenewnew',
    'kernel',
    'crates',
    'oclive_validation',
    'src',
    'json_keys.rs',
  )
const tsPath = process.env.OCLIVE_JSON_KEYS_TS || path.join(repoRoot, 'src', 'lib', 'jsonKeys.ts')

if (!fs.existsSync(rustPath)) {
  console.error(
    `找不到 Rust json_keys：${rustPath}\n请克隆 oclivenewnew 到相邻目录，或设置 OCLIVE_JSON_KEYS_RS。`,
  )
  process.exit(1)
}
if (!fs.existsSync(tsPath)) {
  console.error(`找不到 ${tsPath}`)
  process.exit(1)
}

const rustSrc = fs.readFileSync(rustPath, 'utf8')
const tsSrc = fs.readFileSync(tsPath, 'utf8')

const rm = parseRustKeys(rustSrc, 'MANIFEST_KEYS')
const rs = parseRustKeys(rustSrc, 'SETTINGS_KEYS')
const tm = parseTsKeys(tsSrc, 'MANIFEST_KEYS')
const ts = parseTsKeys(tsSrc, 'SETTINGS_KEYS')

compareArrays('MANIFEST_KEYS', rm, tm)
compareArrays('SETTINGS_KEYS', rs, ts)

if (process.exitCode === 1) {
  console.error(
    '\n请同步修改 src/lib/jsonKeys.ts 与 oclivenewnew kernel/crates/oclive_validation/src/json_keys.rs\n',
  )
} else {
  console.log('jsonKeys.ts 与 json_keys.rs 顶层键一致。')
}
