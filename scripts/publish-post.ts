/**
 * 10003 발행 워커 — AI가 Local API로 글을 발행한다.
 * 사용: npx payload run scripts/publish-post.ts -- <markdown-file>
 * 마크다운 프론트매터(title/slug/excerpt/tags/date)를 파싱해 posts 컬렉션에 upsert.
 */
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'
import fs from 'fs'

const file = process.argv[2]
if (!file) {
  console.error('usage: npx payload run scripts/publish-post.ts -- <markdown-file>')
  process.exit(1)
}

const raw = fs.readFileSync(file, 'utf-8')
const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
if (!m) throw new Error('frontmatter not found')

const fm: Record<string, string> = {}
for (const line of m[1].split('\n')) {
  const i = line.indexOf(':')
  if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, '')
}
const content = m[2].trim()
const tags = (fm.tags || '').replace(/[\[\]]/g, '').split(',').map(s => s.trim()).filter(Boolean)

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'posts',
  where: { slug: { equals: fm.slug } },
})

const data = {
  title: fm.title,
  slug: fm.slug,
  excerpt: fm.excerpt || '',
  content,
  tags,
  publishedAt: fm.date ? new Date(fm.date).toISOString() : new Date().toISOString(),
  _status: 'published' as const,
}

if (existing.docs.length > 0) {
  await payload.update({ collection: 'posts', id: existing.docs[0].id, data })
  console.log(`updated: ${fm.slug}`)
} else {
  await payload.create({ collection: 'posts', data })
  console.log(`created: ${fm.slug}`)
}
process.exit(0)
