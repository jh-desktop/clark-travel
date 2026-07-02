import { useEffect, useRef } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

const PLACES = [
  {
    id: 'airport',
    name: '클락 국제공항 (CRK)',
    label: '공항',
    lat: 15.1866,
    lng: 120.5512,
    color: '#0ea5e9',
    category: '공항',
    desc: '제주항공 도착 공항. 소형이라 입국심사 빠름.\n세관 통과 후 그랩 바로 잡힘.',
    emoji: '✈️',
  },
  {
    id: 'hann',
    name: '한 카지노 리조트 (Hann Casino)',
    label: '카지',
    lat: 15.1920,
    lng: 120.5240,
    color: '#f59e0b',
    category: '카지노',
    desc: '5399 Manuel A. Roxas Hwy, Clark Freeport.\n24시간 운영. 홀덤·바카라·슬롯 전 게임.',
    emoji: '🎰',
  },
  {
    id: 'sm',
    name: 'SM City Clark',
    label: 'SM',
    lat: 15.1688,
    lng: 120.5801,
    color: '#3b82f6',
    category: '쇼핑몰',
    desc: '클락 최대 쇼핑몰. 마트·레스토랑·영화관.\n환전·쇼핑·식사 원스톱. 에어컨 성지.',
    emoji: '🛍️',
  },
  {
    id: 'hotel',
    name: '센트럴파크 타워 리조트',
    label: '호텔',
    lat: 15.1635,
    lng: 120.5912,
    color: '#10b981',
    category: '숙소',
    desc: '888 Lourdes St, Balibago, Angeles City.\n워킹스트리트 도보권. SM 차로 5분.',
    emoji: '🏨',
  },
  {
    id: 'walking',
    name: '워킹스트리트 (Red Street)',
    label: '워킹',
    lat: 15.1621,
    lng: 120.5913,
    color: '#ec4899',
    category: '나이트라이프',
    desc: 'Fields Ave, Balibago. 밤 9시~새벽 5시.\n바·클럽·라이브밴드·고고바 밀집 지역.',
    emoji: '🌃',
  },
  {
    id: 'koreatown',
    name: '한인타운 (코리안타운)',
    label: '한인',
    lat: 15.1505,
    lng: 120.5849,
    color: '#8b5cf6',
    category: '한인타운',
    desc: 'Fil-Am Friendship Hwy, Anunas 일대.\n한식당·KTV·해운대 술집. 한국어 OK.',
    emoji: '🇰🇷',
  },
]

const MAP_STYLE = [
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a8d5f5' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#ffe082' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e6a817' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
]

export default function MapPage() {
  const mapRef = useRef(null)
  const mapInst = useRef(null)
  const markersRef = useRef({})
  const infoWindowsRef = useRef({})

  useEffect(() => {
    if (mapInst.current) return
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
    })
    loader.load().then(() => {
      const google = window.google
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 15.172, lng: 120.562 },
        zoom: 13,
        styles: MAP_STYLE,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
      })
      mapInst.current = map

      PLACES.forEach(place => {
        const marker = new google.maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          map,
          title: place.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 16,
            fillColor: place.color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2.5,
          },
          label: {
            text: place.label,
            color: '#ffffff',
            fontWeight: '800',
            fontSize: '9px',
          },
          zIndex: 10,
        })

        const info = new google.maps.InfoWindow({
          content: `
            <div style="font-family:-apple-system,sans-serif;padding:6px 4px;min-width:190px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <span style="font-size:22px;line-height:1">${place.emoji}</span>
                <div>
                  <div style="font-weight:800;font-size:13px;color:#111827;line-height:1.3">${place.name}</div>
                  <div style="font-size:11px;font-weight:700;color:${place.color};margin-top:2px">${place.category}</div>
                </div>
              </div>
              <div style="font-size:11.5px;color:#6b7280;white-space:pre-line;line-height:1.65;border-top:1px solid #f3f4f6;padding-top:6px">${place.desc}</div>
            </div>
          `,
        })

        marker.addListener('click', () => {
          Object.values(infoWindowsRef.current).forEach(w => w.close())
          info.open(map, marker)
        })

        markersRef.current[place.id] = marker
        infoWindowsRef.current[place.id] = info
      })

      const bounds = new google.maps.LatLngBounds()
      PLACES.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }))
      map.fitBounds(bounds, { top: 50, bottom: 20, left: 30, right: 30 })
    })
  }, [])

  function focusPlace(id) {
    const place = PLACES.find(p => p.id === id)
    if (!place || !mapInst.current || !window.google) return
    mapInst.current.panTo({ lat: place.lat, lng: place.lng })
    mapInst.current.setZoom(16)
    Object.values(infoWindowsRef.current).forEach(w => w.close())
    infoWindowsRef.current[id]?.open(mapInst.current, markersRef.current[id])
  }

  return (
    <div className="map-page-wrap pt-nav">
      <div className="map-page-map" ref={mapRef} />
      <div className="map-page-cards">
        {PLACES.map(place => (
          <button
            key={place.id}
            className="map-place-btn"
            onClick={() => focusPlace(place.id)}
          >
            <span className="map-place-dot" style={{ background: place.color }} />
            <span className="map-place-emoji">{place.emoji}</span>
            <div className="map-place-info">
              <div className="map-place-name">{place.name}</div>
              <div className="map-place-cat" style={{ color: place.color }}>{place.category}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
