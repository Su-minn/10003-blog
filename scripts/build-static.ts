/**
 * 10003 정적 빌드 워커 — Payload에서 published 글을 읽어 브랜드 정적 사이트 생성.
 * 사용: node --env-file=.env scripts/build-static.ts
 * 출력: dist-static/ (GitHub Pages 배포 대상)
 */
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'
import { marked } from 'marked'
import fs from 'fs'
import path from 'path'

const EPOCH = new Date('2026-06-12') // 가동 D+1 기산일 (brand.md §6)
const dPlus = Math.max(1, Math.floor((Date.now() - EPOCH.getTime()) / 86400000) + 1)

const css = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap');
:root{--orange:#FF5C1A;--ink:#1C1A17;--paper:#FAF6EF;--blue:#2B6FFF;--gray:#5C574E;--line:#8A857C}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Pretendard Variable',Pretendard,sans-serif;background:var(--paper);color:var(--ink);line-height:1.7;
background-image:linear-gradient(rgba(43,111,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(43,111,255,.05) 1px,transparent 1px);background-size:48px 48px}
.wrap{max-width:720px;margin:0 auto;padding:48px 24px 96px}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:72px}
.mark{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:28px;color:var(--ink);text-decoration:none}
.mark em{color:var(--orange);font-style:normal}
.counter{font-family:'JetBrains Mono',monospace;font-size:14px;color:var(--gray)}
.tagline{font-size:14px;color:var(--gray);margin-top:4px}
h1{font-size:40px;line-height:1.3;letter-spacing:-.02em;word-break:keep-all;margin-bottom:12px}
.meta{font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--gray);margin-bottom:48px}
article h2{font-size:26px;margin:56px 0 16px;word-break:keep-all}
article p{margin:0 0 20px;word-break:keep-all}
article strong{font-weight:800}
article blockquote{border-left:4px solid var(--orange);padding:4px 0 4px 20px;color:var(--gray);margin:24px 0}
article code{font-family:'JetBrains Mono',monospace;font-size:.9em;background:rgba(28,26,23,.06);padding:2px 8px;border-radius:6px}
article ol,article ul{padding-left:24px;margin-bottom:20px}
article li{margin-bottom:8px}
article hr{border:none;border-top:1px solid rgba(138,133,124,.4);margin:48px 0}
.card{display:block;text-decoration:none;color:inherit;border:1px solid rgba(138,133,124,.35);border-radius:16px;padding:28px;margin-bottom:20px;background:rgba(250,246,239,.7)}
.card:hover{border-color:var(--orange)}
.card h2{font-size:24px;margin-bottom:8px;word-break:keep-all}
.card p{color:var(--gray);font-size:15px;word-break:keep-all}
footer{margin-top:96px;padding-top:24px;border-top:1px solid rgba(138,133,124,.4);font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--gray);display:flex;justify-content:space-between}
.notice{font-size:13px;color:var(--gray);margin-top:8px}
`

const page = (title: string, body: string, depth = 0) => {
  const root = depth === 0 ? '.' : '..'
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><style>${css}</style></head><body><div class="wrap">
<header><div><a class="mark" href="${root}/index.html">1000<em>3</em></a>
<div class="tagline">만드는 삶 — The OS for the life of making</div></div>
<span class="counter">가동 D+${dPlus}</span></header>
${body}
<footer><span>10003 — 만드는 삶</span><span>AI 에이전트 팀과 함께 만든다</span></footer>
</div></body></html>`
}

const payload = await getPayload({ config })
const { docs } = await payload.find({
  collection: 'posts',
  where: { _status: { equals: 'published' } },
  sort: '-publishedAt',
  limit: 100,
})

const out = path.resolve(import.meta.dirname, '../dist-static')
fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(path.join(out, 'posts'), { recursive: true })

for (const post of docs) {
  // 본문 첫 H1은 템플릿 h1과 중복되므로 제거
  const md = (post.content as string).replace(/^#\s.+\n/, '')
  const html = marked.parse(md) as string
  const date = (post.publishedAt as string)?.slice(0, 10) ?? ''
  fs.writeFileSync(
    path.join(out, 'posts', `${post.slug}.html`),
    page(`${post.title} — 10003`, `<h1>${post.title}</h1><div class="meta">${date}</div><article>${html}</article>`, 1),
  )
}

const list = docs
  .map(p => `<a class="card" href="./posts/${p.slug}.html"><h2>${p.title}</h2><p>${p.excerpt ?? ''}</p></a>`)
  .join('\n')
fs.writeFileSync(
  path.join(out, 'index.html'),
  page('10003 — 만드는 삶', `<h1>가동 기록</h1><div class="meta">한 사람이 AI로 삶의 운영체제를 짓는 N=1 공개 실험실</div>${list}`),
)
fs.writeFileSync(path.join(out, '.nojekyll'), '')
console.log(`built ${docs.length} post(s) → dist-static/`)
process.exit(0)
