import { useState, useEffect } from 'react'

const DEPARTURE = new Date('2026-07-23T00:00:00+09:00')

function getCountdown() {
  const now = new Date()
  const diff = DEPARTURE - now
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, departed: true }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    departed: false,
  }
}

const MEMBERS = [
  { name: '윤드완', role: '나', tag: '총대장', emoji: '👑', color: '#f59e0b', desc: '이 여행의 기획자\n& 원정대 주인공' },
  { name: '구구', role: '아는동생', tag: '막내', emoji: '🔥', color: '#ef4444', desc: '에너지 넘치는\n여행 활력소' },
  { name: '프리샷', role: '형님', tag: '베테랑', emoji: '🎯', color: '#8b5cf6', desc: '믿고 따라가는\n경험 많은 형님' },
]

const STARS = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  top: ((Math.sin(i * 2.3) * 0.5 + 0.5) * 94 + 2).toFixed(1),
  left: ((Math.sin(i * 1.7 + 1) * 0.5 + 0.5) * 94 + 2).toFixed(1),
  size: ((Math.abs(Math.sin(i * 0.9)) * 2) + 0.8).toFixed(1),
  delay: ((Math.abs(Math.sin(i * 3.1)) * 3.5)).toFixed(1),
  duration: ((Math.abs(Math.sin(i * 1.3)) * 2) + 2).toFixed(1),
  opacity: ((Math.abs(Math.sin(i * 0.7)) * 0.5) + 0.3).toFixed(2),
}))

export default function DdayPage() {
  const [cd, setCd] = useState(getCountdown)

  useEffect(() => {
    const id = setInterval(() => setCd(getCountdown()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="dday-wrap pt-nav">
      {/* 별 배경 */}
      <div className="dday-stars-bg" aria-hidden="true">
        {STARS.map(s => (
          <div
            key={s.id}
            className="dday-star"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
        <div className="dday-orb dday-orb-1" />
        <div className="dday-orb dday-orb-2" />
      </div>

      <div className="dday-inner">
        <div className="dday-crew-label">✈ CLARK EXPEDITION 2026</div>

        <div className="dday-tagline">
          {cd.departed ? '우리 지금 클락에 있다! 🎉' : '설레는 출국까지 남은 시간'}
        </div>

        {/* 경로 */}
        <div className="dday-route">
          <div className="dday-city-box">
            <span className="dday-city-code">ICN</span>
            <span className="dday-city-name">인천공항</span>
          </div>
          <div className="dday-route-line">
            <div className="dday-route-track" />
            <span className="dday-plane">✈</span>
          </div>
          <div className="dday-city-box">
            <span className="dday-city-code">CRK</span>
            <span className="dday-city-name">클락공항</span>
          </div>
        </div>

        {/* D-day 배지 */}
        {!cd.departed && (
          <div className="dday-badge-wrap">
            <div className="dday-badge-glow" />
            <div className="dday-badge">D-{cd.days}</div>
          </div>
        )}

        {/* 카운트다운 */}
        <div className="dday-timer">
          <div className="dday-unit">
            <div className="dday-num">{String(cd.days).padStart(2, '0')}</div>
            <div className="dday-unit-label">DAYS</div>
          </div>
          <div className="dday-colon">:</div>
          <div className="dday-unit">
            <div className="dday-num">{String(cd.hours).padStart(2, '0')}</div>
            <div className="dday-unit-label">HOURS</div>
          </div>
          <div className="dday-colon">:</div>
          <div className="dday-unit">
            <div className="dday-num">{String(cd.minutes).padStart(2, '0')}</div>
            <div className="dday-unit-label">MIN</div>
          </div>
          <div className="dday-colon">:</div>
          <div className="dday-unit">
            <div className="dday-num">{String(cd.seconds).padStart(2, '0')}</div>
            <div className="dday-unit-label">SEC</div>
          </div>
        </div>

        <div className="dday-date">🗓 2026년 7월 23일 (목) · 제주항공 21:35 출발</div>

        {/* 멤버 섹션 */}
        <div className="dday-members">
          <div className="dday-members-title">🛫 원정대 멤버</div>
          <div className="dday-member-cards">
            {MEMBERS.map(m => (
              <div key={m.name} className="dday-member-card">
                <div className="dday-member-emoji">{m.emoji}</div>
                <div
                  className="dday-member-tag"
                  style={{ background: m.color + '22', color: m.color, borderColor: m.color + '55' }}
                >
                  {m.tag}
                </div>
                <div className="dday-member-name">{m.name}</div>
                <div className="dday-member-role">{m.role}</div>
                <div className="dday-member-desc">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 정보 카드 */}
        <div className="dday-info-row">
          <div className="dday-info-card">
            <div className="dday-info-icon">🌏</div>
            <div className="dday-info-text">
              <div className="dday-info-title">목적지</div>
              <div className="dday-info-val">필리핀 클락</div>
            </div>
          </div>
          <div className="dday-info-card">
            <div className="dday-info-icon">🌡️</div>
            <div className="dday-info-text">
              <div className="dday-info-title">7월 평균기온</div>
              <div className="dday-info-val">27 ~ 33°C</div>
            </div>
          </div>
          <div className="dday-info-card">
            <div className="dday-info-icon">⏱️</div>
            <div className="dday-info-text">
              <div className="dday-info-title">비행시간</div>
              <div className="dday-info-val">약 3시간 30분</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
