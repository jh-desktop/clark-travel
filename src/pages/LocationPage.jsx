import { useState, useEffect, useRef } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { auth, rtdb, googleProvider } from '../firebase'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { ref, set, onValue, remove } from 'firebase/database'

const STALE_MS = 30 * 60 * 1000
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
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
]

export default function LocationPage() {
  const [user, setUser] = useState(undefined)
  const [sharing, setSharing] = useState(false)
  const [locations, setLocations] = useState([])
  const [status, setStatus] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  const mapRef = useRef(null)
  const mapInst = useRef(null)
  const markers = useRef({})
  const infoWindows = useRef({})
  const watchId = useRef(null)

  // 인증 상태
  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u ?? null))
  }, [])

  // Google 로그인
  async function handleLogin() {
    setLoginLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') setStatus('로그인 실패: ' + err.message)
    } finally {
      setLoginLoading(false)
    }
  }

  // 로그아웃
  async function handleLogout() {
    if (sharing) stopSharing()
    await signOut(auth)
    setLocations([])
  }

  // Google Maps 초기화
  useEffect(() => {
    if (!user || !mapRef.current || mapInst.current) return
    const loader = new Loader({ apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '', version: 'weekly' })
    loader.load().then(() => {
      mapInst.current = new window.google.maps.Map(mapRef.current, {
        center: CLARK_CENTER, zoom: 14, styles: DARK_STYLE,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      })
      setMapReady(true)
    }).catch(err => setStatus('지도 로드 실패: ' + err.message))
    return () => {
      Object.values(markers.current).forEach(m => m.setMap(null))
      Object.values(infoWindows.current).forEach(w => w.close())
      markers.current = {}
      infoWindows.current = {}
      mapInst.current = null
      setMapReady(false)
    }
  }, [user])

  // 마커 업데이트
  useEffect(() => {
    if (!mapReady || !mapInst.current || !window.google) return
    const map = mapInst.current
    const google = window.google

    Object.keys(markers.current).forEach(id => {
      if (!locations.find(l => l.id === id)) {
        markers.current[id].setMap(null)
        infoWindows.current[id]?.close()
        delete markers.current[id]
        delete infoWindows.current[id]
      }
    })

    locations.forEach(loc => {
      const isMe = loc.id === user?.uid
      const time = new Date(loc.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      const pos = { lat: loc.lat, lng: loc.lng }
      const icon = {
        path: google.maps.SymbolPath.CIRCLE, scale: 22,
        fillColor: isMe ? '#0ea5e9' : '#374151', fillOpacity: 1,
        strokeColor: isMe ? '#bae6fd' : '#6b7280', strokeWeight: 2,
      }
      const label = { text: loc.name.slice(0, 2), color: isMe ? '#060d1a' : '#e2e8f0', fontWeight: '700', fontSize: '12px' }
      const infoContent = `<div style="background:#0d1825;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-family:sans-serif">
        <div style="font-weight:700;font-size:14px">${loc.name}${isMe ? ' <span style="color:#0ea5e9">(나)</span>' : ''}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px">${time} 업데이트</div></div>`

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

    if (locations.length === 1) {
      map.setCenter({ lat: locations[0].lat, lng: locations[0].lng })
      map.setZoom(17)
    } else if (locations.length > 1) {
      const bounds = new window.google.maps.LatLngBounds()
      locations.forEach(l => bounds.extend({ lat: l.lat, lng: l.lng }))
      map.fitBounds(bounds, { top: 60, bottom: 100, left: 40, right: 40 })
    }
  }, [locations, mapReady, user])

  // Realtime Database 구독
  useEffect(() => {
    if (!user) return
    const locRef = ref(rtdb, 'clark-locations')
    return onValue(locRef, snapshot => {
      const data = snapshot.val() || {}
      const now = Date.now()
      setLocations(
        Object.entries(data)
          .map(([id, loc]) => ({ id, ...loc }))
          .filter(l => l.active && l.lat != null && l.lng != null)
          .filter(l => now - (l.updatedAt ?? 0) < STALE_MS)
      )
    }, err => setStatus('연결 오류: ' + err.message))
  }, [user])

  // 위치 공유 시작
  function startSharing() {
    if (!navigator.geolocation) { setStatus('위치 기능을 지원하지 않는 브라우저예요.'); return }
    setStatus('위치 권한 요청 중...')
    const name = user.displayName || user.email?.split('@')[0] || '사용자'
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        set(ref(rtdb, `clark-locations/${user.uid}`), {
          name, lat, lng, active: true, updatedAt: Date.now(),
        }).catch(err => setStatus('저장 오류: ' + err.message))
        setSharing(true)
        setStatus('')
      },
      err => {
        if (err.code === 1) setStatus('위치 접근이 거부되었습니다.')
        else setStatus('위치를 가져오지 못했습니다.')
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
  }

  // 위치 공유 중단
  function stopSharing() {
    if (watchId.current != null) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null }
    if (user) set(ref(rtdb, `clark-locations/${user.uid}/active`), false)
    setSharing(false)
  }

  useEffect(() => () => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
  }, [])

  useEffect(() => {
    if (!sharing || !user) return
    const handler = () => set(ref(rtdb, `clark-locations/${user.uid}/active`), false)
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [sharing, user])

  if (user === undefined) return (
    <div className="pt-nav content"><div className="loc-setup"><div className="loc-setup-box" style={{ textAlign: 'center', color: 'var(--muted)' }}>로딩 중...</div></div></div>
  )

  if (!user) return (
    <div className="pt-nav content">
      <div className="loc-setup">
        <div className="loc-setup-box">
          <div className="loc-pin-icon">📍</div>
          <div className="loc-setup-title">위치 공유 참여</div>
          <div className="loc-setup-desc">Google 계정으로 로그인하면<br />그룹 멤버들과 실시간 위치를 공유할 수 있어요.</div>
          {status && <div className="admin-err" style={{ marginBottom: '0.75rem' }}>{status}</div>}
          <button className="btn-google" onClick={handleLogin} disabled={loginLoading}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            {loginLoading ? '로그인 중...' : 'Google로 로그인'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="loc-page pt-nav">
      <div className="loc-header">
        <div className="loc-header-info">
          <span className="loc-header-title">실시간 위치</span>
          <span className="loc-badge">{locations.length}명 공유 중</span>
        </div>
        <div className="loc-header-actions">
          <span className="loc-my-name">{user.displayName || user.email?.split('@')[0]}</span>
          {sharing
            ? <button className="loc-btn-stop" onClick={stopSharing}>■ 공유 중단</button>
            : <button className="loc-btn-start" onClick={startSharing}>📍 위치 공유</button>}
          <button className="nav-logout" onClick={handleLogout}>로그아웃</button>
        </div>
      </div>

      {status && <div className="loc-status-bar">{status}</div>}
      <div className="loc-map-wrap" ref={mapRef} />

      {locations.length > 0 && (
        <div className="loc-member-bar">
          {locations.map(loc => {
            const time = new Date(loc.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={loc.id}
                className={'loc-member' + (loc.id === user.uid ? ' loc-member-me' : '')}
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
