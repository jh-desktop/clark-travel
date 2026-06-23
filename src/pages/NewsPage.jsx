import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function NewsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'clark-news'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  async function handleDelete(id) {
    if (!confirm('삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'clark-news', id))
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
              <span className="post-date">{selected.createdAt?.toDate().toLocaleDateString('ko-KR')}</span>
            </div>
            <h1 className="post-title">{selected.title}</h1>
            <div className="post-body">{selected.body}</div>
            {user && (
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

        {user && (
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
                <span className="post-date">{post.createdAt?.toDate().toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="news-card-title">{post.title}</div>
              <div className="news-card-preview">{post.body?.slice(0, 120)}{post.body?.length > 120 ? '...' : ''}</div>
              {user && (
                <button
                  className="delete-btn-sm"
                  onClick={e => { e.stopPropagation(); handleDelete(post.id) }}
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
