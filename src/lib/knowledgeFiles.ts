export type KnowledgeMarkdownFile = {
  /** path under role root, e.g. `knowledge/world.md` */
  path: string
  content: string
}

export function normalizeKnowledgePath(path: string): string {
  const p = path.trim().replace(/\\/g, '/').replace(/^\/+/, '')
  const withPrefix = p.startsWith('knowledge/') ? p : `knowledge/${p}`
  const clean = withPrefix
    .split('/')
    .filter((x) => x && x !== '.' && x !== '..')
    .join('/')
  if (!clean.startsWith('knowledge/')) return 'knowledge/world.md'
  if (!clean.endsWith('.md')) return `${clean}.md`
  return clean
}

