import { useState, useEffect, useRef } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { db, auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, onSnapshot, collection, serverTimestamp } from 'firebase/firestore'

const STALE_MS = 30 * 60 * 1000

function getDeviceId() {
  let id = localStorage.getItem('clark-device-id')
  if (!id) {
    id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now())
    localStorage.setItem('clark-device-id', id)
  }
  return id
}

const DEVICE_ID = getDeviceId()
const CLARK_CENTER = { lat: 15.179, lng: 120.554 }

const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2d45' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0d1825' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e3a56' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#051225' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#374151' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
]

export default function LocationPage() {
  const [name, setName] = useState(() => localStorage.getItem('clark-name') || '')
  const [nameInput, setNameInput] = useState('')
  const [authed, setAuthed] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [locations, setLocations] = useState([])
  const [status, setStatus] = useState('')
  const [mapReady, setMapReady] = useState(false)

  const mapRef = useRef(null)
  const mapInst = useRef(null)
  const markers = useRef({})
  const infoWindows = useRef({})
  const watchId = useRef(null)

  function saveName(e) {
    e.preventDefault()
    const n = nameInput.trim()
    if (!n) return
    localStorage.setItem('clark-name', n)
    setName(n)
  }

  // Google Maps 초기화
  useEffect(() => {
    if (!name || !mapRef.current || mapInst.current) return

    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
    })

    loader.load().then(() => {
      const google = window.google
      mapInst.current = new google.maps.Map(mapRef.current, {
        center: CLARK_CENTER,
        zoom: 14,
        styles: DARK_STYLE,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      })
      setMapReady(true)
    }).catch(err => {
      setStatus('지도 로드 실패: ' + err.message)
    })

    return () => {
      Object.values(markers.current).forEach(m => m.setMap(null))
      Object.values(infoWindows.current).forEach(w => w.close())
      markers.current = {}
      infoWindows.current = {}
      mapInst.current = null
      setMapReady(false)
    }
  }, [name])

  // 마커 업데이트
  useEffect(() => {
    if (!mapReady || !mapInst.current || !window.google) return
    const map = mapInst.current
    const google = window.google

    // 사라진 유저 제거
    Object.keys(markers.current).forEach(id => {
      if (!locations.find(l => l.id === id)) {
        markers.current[id].setMap(null)
        infoWindows.current[id]?.close()
        delete markers.current[id]
        delete infoWindows.current[id]
      }
    })

    locations.forEach(loc => {
      const isMe = loc.id === DEVICE_ID
      const time = loc.updatedAt?.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      const pos = { lat: loc.lat, lng: loc.lng }

      const icon = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 22,
        fillColor: isMe ? '#0ea5e9' : '#374151',
        fillOpacity: 1,
        strokeColor: isMe ? '#bae6fd' : '#6b7280',
        strokeWeight: 2,
      }

      const label = {
        text: loc.name.slice(0, 2),
        color: isMe ? '#060d1a' : '#e2e8f0',
        fontWeight: '700',
        fontSize: '12px',
      }

      const infoContent = `
        <div style="background:#0d1825;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-family:sans-serif;min-width:80px">
          <div style="font-weight:700;font-size:14px">${loc.name}${isMe ? ' <span style="color:#0ea5e9">(나)</span>' : ''}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:2px">${time} 업데이트</div>
        </div>`

      if (markers.current[loc.id]) {
        markers.current[loc.id].setPosition(pos)
        markers.current[loc.id].setIcon(icon)
        markers.current[loc.id].setLabel(label)
        infoWindows.current[loc.id]?.setContent(infoContent)
      } else {
        const marker = new google.maps.Marker({ position: pos, map, icon, label, title: loc.name })
        const infoWindow = new google.maps.InfoWindow({ content: infoContent })

        marker.addListener('click', () => {
          Object.values(infoWindows.current).forEach(w => w.close())
          infoWindow.open(map, marker)
        })

        markers.current[loc.id] = marker
        infoWindows.current[loc.id] = infoWindow
      }
    })

    // 지도 범위 맞추기
    if (locations.length === 1) {
      map.setCenter({ lat: locations[0].lat, lng: locations[0].lng })
      map.setZoom(17)
    } else if (locations.length > 1) {
      const bounds = new google.maps.LatLngBounds()
      locations.forEach(l => bounds.extend({ lat: l.lat, lng: l.lng }))
      map.fitBounds(bounds, { top: 60, bottom: 100, left: 40, right: 40 })
    }
  }, [locations, mapReady])

  // 익명 인증 상태 추적
  useEffect(() => {
    return onAuthStateChanged(auth, user => setAuthed(!!user))
  }, [])

  // Firestore 실시간 구독 — 인증 완료 후에만 시작
  useEffect(() => {
    if (!name || !authed) return
    return onSnapshot(
      collection(db, 'clark-locations'),
      snap => {
        const now = Date.now()
        setLocations(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(l => l.active && l.lat != null && l.lng != null && l.updatedAt)
            .filter(l => now - (l.updatedAt.toMillis?.() ?? 0) < STALE_MS)
        )
      },
      err => setStatus('데이터 로드 오류: ' + err.message)
    )
  }, [name, authed])

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
        }).catch(err => setStatus('저장 오류: ' + err.message))
        setSharing(true)
        setStatus('')
      },
      err => {
        if (err.code === 1) setStatus('위치 접근이 거부되었습니다. 브라우저 설정에서 허용해 주세요.')
        else setStatus('위치를 가져오지 못했습니다. (' + err.message + ')')
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
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

  useEffect(() => () => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
  }, [])

  useEffect(() => {
    if (!sharing) return
    const handler = () => setDoc(doc(db, 'clark-locations', DEVICE_ID), { active: false }, { merge: true })
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
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

      <div className="loc-map-wrap" ref={mapRef} />

      {locations.length > 0 && (
        <div className="loc-member-bar">
          {locations.map(loc => {
            const time = loc.updatedAt?.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
            return (
              <div
                key={loc.id}
                className={'loc-member' + (loc.id === DEVICE_ID ? ' loc-member-me' : '')}
                onClick={() => {
                  if (!mapInst.current || !window.google) return
                  mapInst.current.setCenter({ lat: loc.lat, lng: loc.lng })
                  mapInst.current.setZoom(17)
                  Object.values(infoWindows.current).forEach(w => w.close())
                  infoWindows.current[loc.id]?.open(mapInst.current, markers.current[loc.id])
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
