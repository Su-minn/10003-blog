import type { CollectionConfig } from 'payload'

// 10003 블로그 포스트 — AI 워커가 Local API로 생성하고, admin에서 CEO가 검수(draft→published)한다.
export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'publishedAt'],
  },
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'excerpt', type: 'textarea' },
    // 마크다운 본문 — AI 워커 친화적. 정적 빌더가 HTML로 변환한다.
    { name: 'content', type: 'textarea', required: true },
    { name: 'tags', type: 'text', hasMany: true },
    { name: 'publishedAt', type: 'date' },
    // 베팅 계약: 발행 시 반응 예측을 함께 기록 (판례 장부 연동)
    { name: 'prediction', type: 'textarea', admin: { description: '이 글의 반응 예측 — 48시간 후 복기' } },
  ],
}
