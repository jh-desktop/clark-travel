import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { db } from '../firebase'
import { doc, setDoc, onSnapshot, collection, serverTimestamp } from 'firebase/firestore'

const STALE_MS = 30 * 60 * 1000 // 30분 이상 업데이트 없으면 제외

function getDeviceId() {
  let id = localStorage.getItem('clark-device-id')
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now()
    localStorage.setItem('clark-device-id', id)
  }
  return id
}

const DEVICE_ID = getDeviceId()
const CLARK_CENTER = [15.179, 120.554]

function makeIcon(name, isMe) {
  return L.divIcon({
    html: `<div class="map-pin${isMe ? ' map-pin-me' : ''}">${name.slice(0, 2)}</div>`,
    className: '',
    iconSize: [42, 52],
    iconAnchor: [21, 52],
    popupAnchor: [0, -54],
  })
}

export default function LocationPage() {
  const [name, setName] = useState(() => localStorage.getItem('clark-name') || '')
  const [nameInput, setNameInput] = useState('')
  const [sharing, setSharing] = useState(false)
  const [locations, setLocations] = useState([])
  const [status, setStatus] = useState('')

  const mapRef = useRef(null)
  const mapInst = useRef(null)
  const markers = useRef({})
  const watchId = useRef(null)

  // 이름 저장
  function saveName(e) {
    e.preventDefault()
    const n = nameInput.trim()
    if (!n) return
    localStorage.setItem('clark-name', n)
    setName(n)
  }

  // 지도 초기화
  useEffect(() => {
    if (!name || !mapRef.current || mapInst.current) return
    mapInst.current = L.map(mapRef.current, { center: CLARK_CENTER, zoom: 14 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInst.current)
    return () => {
      mapInst.current?.remove()
      mapInst.current = null
      markers.current = {}
    }
  }, [name])

  // 마커 업데이트
  useEffect(() => {
    const map = mapInst.current
    if (!map) return

    // 사라진 유저 마커 제거
    Object.keys(markers.current).forEach(id => {
      if (!locations.find(l => l.id === id)) {
        markers.current[id].remove()
        delete markers.current[id]
      }
    })

    // 마커 추가 / 위치 갱신
    locations.forEach(loc => {
      const icon = makeIcon(loc.name, loc.id === DEVICE_ID)
      const time = loc.updatedAt?.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      const popup = `<b>${loc.name}</b>${loc.id === DEVICE_ID ? ' <span style="color:#0ea5e9">(나)</span>' : ''}<br/><small>${time} 업데이트</small>`
      if (markers.current[loc.id]) {
        markers.current[loc.id].setLatLng([loc.lat, loc.lng]).setIcon(icon).setPopupContent(popup)
      } else {
        markers.current[loc.id] = L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup(popup)
      }
    })

    // 전체 마커 범위에 맞춰 뷰 조정
    const vals = Object.values(markers.current)
    if (vals.length === 1) {
      map.setView(vals[0].getLatLng(), 16)
    } else if (vals.length > 1) {
      map.fitBounds(L.featureGroup(vals).getBounds().pad(0.2), { maxZoom: 17 })
    }
  }, [locations])

  // Firestore 실시간 구독
  useEffect(() => {
    if (!name) return
    return onSnapshot(collection(db, 'clark-locations'), snap => {
      const now = Date.now()
      setLocations(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(l => l.active && l.lat && l.lng && l.updatedAt)
          .filter(l => now - (l.updatedAt.toMillis?.() ?? 0) < STALE_MS)
      )
    })
  }, [name])

  // 위치 공유 시작
  function startSharing() {
    if (!navigator.geolocation) {
      setStatus('이 브라우저는 위치 기능을 지원하지 않습니다.')
      return
    }
    setStatus('위치 권한 요청 중...')
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setDoc(doc(db, 'clark-locations', DEVICE_ID), {
          name, lat, lng, active: true, updatedAt: serverTimestamp(),
        })
        setSharing(true)
        setStatus('')
      },
      () => setStatus('위치 접근이 거부되었습니다. 브라우저 설정에서 허용해주세요.'),
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 10000 }
    )
  }

  // 위치 공유 중단
  function stopSharing() {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    setDoc(doc(db, 'clark-locations', DEVICE_ID), { active: false }, { merge: true })
    setSharing(false)
  }

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  // 탭 닫을 때 공유 중단
  useEffect(() => {
    if (!sharing) return
    const off = () => setDoc(doc(db, 'clark-locations', DEVICE_ID), { active: false }, { merge: true })
    window.addEventListener('beforeunload', off)
    return () => window.removeEventListener('beforeunload', off)
  }, [sharing])

  // ── 이름 입력 화면 ──
  if (!name) {
    return (
      <div className="pt-nav content">
        <div className="loc-setup">
          <div className="loc-setup-box">
            <div className="loc-pin-icon">📍</div>
            <div className="loc-setup-title">위치 공유 참여</div>
            <div className="loc-setup-desc">
              이름을 입력하면 그룹 멤버들과<br />실시간 위치를 공유할 수 있어요.
            </div>
            <form onSubmit={saveName} className="admin-form">
              <input
                className="admin-input"
                type="text"
                placeholder="이름 또는 닉네임 (최대 6자)"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                maxLength={6}
                autoFocus
                required
              />
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>참여하기</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── 지도 화면 ──
  return (
    <div className="loc-page pt-nav">
      {/* 상단 헤더 */}
      <div className="loc-header">
        <div className="loc-header-info">
          <span className="loc-header-title">실시간 위치</span>
          <span className="loc-badge">{locations.length}명 공유 중</span>
        </div>
        <div className="loc-header-actions">
          <span className="loc-my-name">{name}</span>
          {sharing ? (
            <button className="loc-btn-stop" onClick={stopSharing}>■ 공유 중단</button>
          ) : (
            <button className="loc-btn-start" onClick={startSharing}>📍 위치 공유</button>
          )}
        </div>
      </div>

      {status && <div className="loc-status-bar">{status}</div>}

      {/* 지도 */}
      <div className="loc-map-wrap" ref={mapRef} />

      {/* 하단 멤버 목록 */}
      {locations.length > 0 && (
        <div className="loc-member-bar">
          {locations.map(loc => {
            const time = loc.updatedAt?.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
            return (
              <div
                key={loc.id}
                className={'loc-member' + (loc.id === DEVICE_ID ? ' loc-member-me' : '')}
                onClick={() => {
                  mapInst.current?.setView([loc.lat, loc.lng], 17)
                  markers.current[loc.id]?.openPopup()
                }}
              >
                <div className="loc-member-avatar">{loc.name.slice(0, 2)}</div>
                <div className="loc-member-name">{loc.name}</div>
                <div className="loc-member-time">{time}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
