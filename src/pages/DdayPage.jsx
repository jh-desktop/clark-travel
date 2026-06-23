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

export default function DdayPage() {
  const [cd, setCd] = useState(getCountdown)

  useEffect(() => {
    const id = setInterval(() => setCd(getCountdown()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="dday-wrap pt-nav">
      <div className="dday-inner">
        <div className="dday-route">
          <span className="dday-city">인천공항</span>
          <span className="dday-plane">✈</span>
          <span className="dday-city">클락국제공항</span>
        </div>

        <div className="dday-label">
          {cd.departed ? '지금 클락에 있습니다!' : `출국까지`}
        </div>

        {!cd.departed && (
          <div className="dday-badge">D-{cd.days}</div>
        )}

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

        <div className="dday-date">출국일 · 2026년 7월 23일</div>

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
