import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const target = resolve(repoRoot, '..', 'oclivenewnew')
const refFile = resolve(repoRoot, '.github', 'oclive-validation-ref')
const repository = 'https://github.com/linkaiheng2233-cyber/oclivenewnew.git'
const ref = (process.env.OCLIVE_VALIDATION_REF ?? readFileSync(refFile, 'utf8')).trim()

if (!/^[0-9a-f]{40}$/i.test(ref)) {
  throw new Error(`无效的 OCLive 校验版本：${JSON.stringify(ref)}；必须是完整的 40 位提交 SHA`)
}
if (existsSync(target)) {
  throw new Error(`目标目录已存在，拒绝覆盖：${target}`)
}

mkdirSync(target, { recursive: true })

function git(...args) {
  const result = spawnSync('git', args, { cwd: repoRoot, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} 失败（退出码 ${result.status ?? 'unknown'}）`)
  }
}

git('init', target)
git('-C', target, 'remote', 'add', 'origin', repository)
git('-C', target, 'fetch', '--depth', '1', 'origin', ref)
git('-C', target, 'checkout', '--detach', 'FETCH_HEAD')

console.log(`已检出 OCLive 校验依赖 ${ref} 到 ${target}`)
