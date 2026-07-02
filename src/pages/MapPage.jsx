import { useEffect, useRef } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

// 정확한 좌표 출처:
// 공항: latlong.net  |  SM: distancesto.com  |  Hann: casinocity.ph
// 로이스: roycehotelandcasino.com 공식  |  워킹/호텔: Balibago 주소 기반
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
    label: '한',
    lat: 15.1920,
    lng: 120.5240,
    color: '#f59e0b',
    category: '카지노',
    desc: '5399 Manuel A. Roxas Hwy, Clark Freeport.\n24시간 운영. 홀덤·바카라·슬롯 전 게임.',
    emoji: '🎰',
  },
  {
    id: 'royce',
    name: '로이스 호텔 & 카지노 (Royce)',
    label: '로이',
    lat: 15.1808,
    lng: 120.5301,
    color: '#f97316',
    category: '카지노',
    desc: 'M.A. Roxas Hwy corner Ninoy Aquino Ave.\n공항 5분 거리. 500객실 대형 복합 리조트.',
    emoji: '🎲',
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
]

// 한인타운: Fil-Am Friendship Hwy 구역 (nearbyph.com 좌표 기반)
// 중심: 15.1497, 120.5591 (Anunas) / 15.1416, 120.5618 (남단)
const ZONES = [
  {
    id: 'koreatown',
    name: '한인타운 (코리안타운)',
    emoji: '🇰🇷',
    color: '#8b5cf6',
    category: '한인타운',
    desc: 'Fil-Am Friendship Hwy, Anunas 일대.\n한식당·KTV·해운대 술집. 한국어 OK.\n약 6km 구간, 1,000여 개 한국 업소 밀집.',
    center: { lat: 15.1500, lng: 120.5594 },
    focusZoom: 14,
    path: [
      { lat: 15.1585, lng: 120.5545 },
      { lat: 15.1585, lng: 120.5625 },
      { lat: 15.1415, lng: 120.5650 },
      { lat: 15.1415, lng: 120.5570 },
    ],
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
  const polygonsRef = useRef({})

  useEffect(() => {
    if (mapInst.current) return
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
    })
    loader.load().then(() => {
      const google = window.google
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 15.165, lng: 120.558 },
        zoom: 13,
        styles: MAP_STYLE,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
      })
      mapInst.current = map

      // ── 일반 마커 ──
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
            <div style="font-family:-apple-system,sans-serif;padding:6px 4px;min-width:195px">
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

      // ── 구역 폴리곤 (한인타운 등) ──
      ZONES.forEach(zone => {
        const polygon = new google.maps.Polygon({
          paths: zone.path,
          strokeColor: zone.color,
          strokeOpacity: 0.9,
          strokeWeight: 2.5,
          fillColor: zone.color,
          fillOpacity: 0.18,
          map,
          zIndex: 5,
        })

        // 구역 중심 라벨 마커
        const labelMarker = new google.maps.Marker({
          position: zone.center,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: zone.color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2.5,
          },
          label: {
            text: '한인',
            color: '#ffffff',
            fontWeight: '800',
            fontSize: '9px',
          },
          zIndex: 10,
        })

        const info = new google.maps.InfoWindow({
          content: `
            <div style="font-family:-apple-system,sans-serif;padding:6px 4px;min-width:195px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <span style="font-size:22px;line-height:1">${zone.emoji}</span>
                <div>
                  <div style="font-weight:800;font-size:13px;color:#111827;line-height:1.3">${zone.name}</div>
                  <div style="font-size:11px;font-weight:700;color:${zone.color};margin-top:2px">${zone.category} · 구역</div>
                </div>
              </div>
              <div style="font-size:11.5px;color:#6b7280;white-space:pre-line;line-height:1.65;border-top:1px solid #f3f4f6;padding-top:6px">${zone.desc}</div>
            </div>
          `,
        })

        const openInfo = () => {
          Object.values(infoWindowsRef.current).forEach(w => w.close())
          info.open(map, labelMarker)
        }
        polygon.addListener('click', openInfo)
        labelMarker.addListener('click', openInfo)

        polygonsRef.current[zone.id] = { polygon, labelMarker, info, zone }
        infoWindowsRef.current[zone.id] = info
        markersRef.current[zone.id] = labelMarker
      })

      // 전체 범위에 맞게 초기 화면 설정
      const bounds = new google.maps.LatLngBounds()
      PLACES.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }))
      ZONES.forEach(z => z.path.forEach(pt => bounds.extend(pt)))
      map.fitBounds(bounds, { top: 50, bottom: 20, left: 30, right: 30 })
    })
  }, [])

  function focusItem(id) {
    if (!mapInst.current || !window.google) return
    Object.values(infoWindowsRef.current).forEach(w => w.close())

    const zone = ZONES.find(z => z.id === id)
    if (zone) {
      mapInst.current.panTo(zone.center)
      mapInst.current.setZoom(zone.focusZoom)
      infoWindowsRef.current[id]?.open(mapInst.current, markersRef.current[id])
      return
    }

    const place = PLACES.find(p => p.id === id)
    if (place) {
      mapInst.current.panTo({ lat: place.lat, lng: place.lng })
      mapInst.current.setZoom(17)
      infoWindowsRef.current[id]?.open(mapInst.current, markersRef.current[id])
    }
  }

  const allItems = [
    ...PLACES.map(p => ({ ...p, isZone: false })),
    ...ZONES.map(z => ({ ...z, isZone: true, lat: z.center.lat, lng: z.center.lng })),
  ]

  return (
    <div className="map-page-wrap pt-nav">
      <div className="map-page-map" ref={mapRef} />
      <div className="map-page-cards">
        {allItems.map(item => (
          <button
            key={item.id}
            className="map-place-btn"
            onClick={() => focusItem(item.id)}
          >
            <span
              className="map-place-dot"
              style={{
                background: item.isZone ? 'transparent' : item.color,
                border: item.isZone ? `2px solid ${item.color}` : 'none',
                width: item.isZone ? '10px' : '8px',
                height: item.isZone ? '10px' : '8px',
              }}
            />
            <span className="map-place-emoji">{item.emoji}</span>
            <div className="map-place-info">
              <div className="map-place-name">{item.name}</div>
              <div className="map-place-cat" style={{ color: item.color }}>
                {item.category}{item.isZone ? ' · 구역' : ''}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
