import { useState, useEffect } from 'react'
import { ref, onValue, remove } from 'firebase/database'
import { rtdb } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

function renderWithLinks(text) {
  const urlRegex = /https?:\/\/[^\s<>"']+|[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,6}(?:\/[^\s]*)?/g
  const parts = []
  let last = 0, m
  while ((m = urlRegex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const raw = m[0].replace(/[.,;!?）)]+$/, '')
    const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    parts.push(
      <a key={m.index} href={href} target="_blank" rel="noopener noreferrer" className="post-link">{raw}</a>
    )
    last = m.index + raw.length
    urlRegex.lastIndex = last
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : text
}

function renderBody(body) {
  if (!body) return null
  return body.split('\n').map((line, i) => {
    const trimmed = line.trim()
    // 한 줄 전체가 이미지 URL인 경우 (확장자 or 이미지 CDN 도메인)
    if (
      /^https?:\/\//i.test(trimmed) &&
      (/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(trimmed) ||
       /unsplash\.com|pexels\.com|imgur\.com|googleusercontent\.com/i.test(trimmed))
    ) {
      return <img key={i} src={trimmed} alt="" className="post-image" />
    }
    if (trimmed === '') return <div key={i} className="post-br" />
    return <span key={i}>{renderWithLinks(line)}<br /></span>
  })
}

export default function NewsPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onValue(ref(rtdb, 'clark-news'), snapshot => {
      const data = snapshot.val() || {}
      const list = Object.entries(data)
        .map(([id, p]) => ({ id, ...p }))
        .sort((a, b) => b.createdAt - a.createdAt)
      setPosts(list)
      setLoading(false)
    })
  }, [])

  async function handleDelete(id) {
    if (!confirm('삭제하시겠습니까?')) return
    await remove(ref(rtdb, `clark-news/${id}`))
    if (selected?.id === id) setSelected(null)
  }

  if (selected) {
    return (
      <div className="pt-nav content">
        <div className="news-page">
          <button className="back-btn" onClick={() => setSelected(null)}>← 목록으로</button>
          <div className="post-detail">
            <div className="post-meta-row">
              <span className="post-tag">{selected.tag || '뉴스'}</span>
              <span className="post-date">{new Date(selected.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
            <h1 className="post-title">{selected.title}</h1>
            <div className="post-body">{renderBody(selected.body)}</div>
            {isAdmin && (
              <button className="delete-btn" onClick={() => handleDelete(selected.id)}>삭제</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-nav content">
      <div className="news-page">
        <div className="page-header">
          <h1 className="page-title">클락 <span>뉴스</span></h1>
          <p className="page-sub">클락 여행 관련 최신 소식을 전합니다.</p>
        </div>

        {isAdmin && (
          <button className="btn-primary" style={{ marginBottom: '1.5rem' }} onClick={() => navigate('/admin')}>
            + 새 글 작성
          </button>
        )}

        {loading && <p className="muted-text">불러오는 중...</p>}
        {!loading && posts.length === 0 && <p className="muted-text">아직 게시글이 없습니다.</p>}

        <div className="news-list">
          {posts.map(post => (
            <div key={post.id} className="news-card" onClick={() => setSelected(post)}>
              <div className="news-card-top">
                <span className="post-tag">{post.tag || '뉴스'}</span>
                <span className="post-date">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="news-card-title">{post.title}</div>
              <div className="news-card-preview">
                {post.body?.replace(/^https?:\/\/.+$/gm, '').replace(/\n+/g, ' ').trim().slice(0, 120)}
                {post.body?.length > 120 ? '...' : ''}
              </div>
              {isAdmin && (
                <button className="delete-btn-sm" onClick={e => { e.stopPropagation(); handleDelete(post.id) }}>삭제</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
