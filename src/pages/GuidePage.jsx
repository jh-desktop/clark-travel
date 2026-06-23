const SECTIONS = [
  {
    icon: '📍',
    title: '클락이란?',
    body: `클락(Clark)은 필리핀 팜팡가 주에 위치한 도시로, 마닐라에서 북쪽으로 약 80km 거리에 있습니다. 과거 미군 기지였던 자리에 조성된 클락경제자유구역(CSEZ)을 중심으로 카지노, 골프장, 리조트, 쇼핑몰 등이 밀집해 있어 필리핀 대표 관광·레저 도시로 성장했습니다.`,
  },
  {
    icon: '✈️',
    title: '인천 → 클락 이동',
    body: `클락국제공항(CRK)으로 직항 노선이 운항됩니다. 비행시간은 약 3시간 30분이며, 공항에서 시내까지 택시·그랩으로 15~20분 거리입니다. 입국 시 필리핀 비자는 30일 무비자 체류 가능합니다.`,
  },
  {
    icon: '🎰',
    title: '카지노 & 엔터테인먼트',
    body: `클락에는 Widus Hotel & Casino, Hann Casino Resort 등 대형 카지노 리조트가 있습니다. 포커룸, 슬롯, 테이블게임을 즐길 수 있으며 호텔 내 레스토랑과 나이트라이프도 함께 즐길 수 있습니다.`,
  },
  {
    icon: '⛳',
    title: '골프',
    body: `클락에는 세계적 수준의 골프 코스들이 있습니다. Mimosa Golf Course, Fontana Golf & Country Club 등이 대표적이며, 필리핀 특유의 저렴한 캐디비와 그린피로 골프 여행지로 인기가 높습니다.`,
  },
  {
    icon: '🍽️',
    title: '식사 & 쇼핑',
    body: `Marquee Mall, SM Clark 등 대형 쇼핑몰에서 식사와 쇼핑이 가능합니다. 현지 필리핀 음식부터 한식당, 일식, 양식 레스토랑까지 다양하게 즐길 수 있으며 물가가 저렴한 편입니다.`,
  },
  {
    icon: '💡',
    title: '여행 팁',
    body: `• 환전: 공항보다 시내 환전소가 유리합니다.\n• 교통: 그랩(Grab) 앱 필수 설치. 택시보다 저렴하고 안전합니다.\n• 날씨: 7월은 우기로 스콜이 잦으나 짧게 내리고 맑아집니다.\n• 복장: 카지노 입장 시 슬리퍼·민소매 금지 업장이 많습니다.\n• 언어: 영어가 잘 통합니다.`,
  },
]

export default function GuidePage() {
  return (
    <div className="pt-nav content">
      <div className="guide-page">
        <div className="page-header">
          <h1 className="page-title">클락 <span>여행가이드</span></h1>
          <p className="page-sub">필리핀 클락 여행에 필요한 모든 정보.</p>
        </div>

        <div className="guide-grid">
          {SECTIONS.map((s, i) => (
            <div key={i} className="guide-card">
              <div className="guide-icon">{s.icon}</div>
              <div className="guide-title">{s.title}</div>
              <div className="guide-body">{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
