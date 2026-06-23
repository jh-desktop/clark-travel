import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const TAGS = ['뉴스', '공지', '여행팁', '카지노', '골프', '음식', '기타']

export default function AdminPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tag, setTag] = useState('뉴스')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoginErr('')
    try {
      await signInWithEmailAndPassword(auth, email, pw)
    } catch {
      setLoginErr('이메일 또는 비밀번호가 틀렸습니다.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    await addDoc(collection(db, 'clark-news'), {
      title: title.trim(),
      body: body.trim(),
      tag,
      createdAt: serverTimestamp(),
    })
    setTitle('')
    setBody('')
    setTag('뉴스')
    setSaving(false)
    setDone(true)
    setTimeout(() => setDone(false), 2500)
  }

  if (!user) {
    return (
      <div className="pt-nav content">
        <div className="admin-page">
          <div className="admin-login-box">
            <div className="admin-login-title">관리자 로그인</div>
            <form onSubmit={handleLogin} className="admin-form">
              <input
                className="admin-input"
                type="email"
                placeholder="이메일"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <input
                className="admin-input"
                type="password"
                placeholder="비밀번호"
                value={pw}
                onChange={e => setPw(e.target.value)}
                required
              />
              {loginErr && <div className="admin-err">{loginErr}</div>}
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>로그인</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-nav content">
      <div className="admin-page">
        <div className="page-header">
          <h1 className="page-title">게시글 <span>작성</span></h1>
          <p className="page-sub">클락 뉴스 게시판에 글을 올립니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="post-form">
          <div className="post-form-row">
            <label className="post-form-label">태그</label>
            <div className="tag-select-row">
              {TAGS.map(t => (
                <button
                  key={t}
                  type="button"
                  className={'tag-btn' + (tag === t ? ' active' : '')}
                  onClick={() => setTag(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="post-form-row">
            <label className="post-form-label">제목</label>
            <input
              className="admin-input"
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="post-form-row">
            <label className="post-form-label">내용</label>
            <textarea
              className="admin-textarea"
              placeholder="내용을 입력하세요"
              value={body}
              onChange={e => setBody(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? '저장 중...' : '게시하기'}
          </button>
          {done && <span className="save-done">게시 완료!</span>}
        </form>
      </div>
    </div>
  )
}
