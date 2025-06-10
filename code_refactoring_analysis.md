# 코드 리팩토링 분석 보고서

## 📋 개요
현재 코드베이스를 분석한 결과, 여러 리팩토링이 필요한 부분들을 발견했습니다. 주요 문제점과 개선 방안을 정리했습니다.

## 🚨 주요 문제점들

### 1. **`ui/watchScreen.js` (636줄) - 최우선 리팩토링 대상**

**문제점:**
- 📏 **매우 큰 파일**: 636줄의 방대한 코드
- 🔀 **혼재된 책임**: HLS 플레이어, UI 관리, 즐겨찾기, 팝업 관리가 모두 한 파일에 있음
- 🌐 **전역 변수 남용**: 14개의 전역 변수 선언
- 📊 **복잡한 함수**: `initAndPlayStream` 함수가 150줄 이상

**개선 방안:**
```
ui/watchScreen.js → 다음과 같이 분리:
├── player/
│   ├── HlsPlayer.js       (HLS 스트림 관리)
│   ├── PlayerControls.js  (플레이어 UI 컨트롤)
│   └── PlayerStatus.js    (로딩/에러 상태 관리)
├── ui/
│   ├── WatchUI.js         (시청 화면 UI 관리)
│   ├── InfoPopup.js       (방송 정보 팝업)
│   └── FavoriteButton.js  (즐겨찾기 버튼)
└── WatchScreenManager.js  (전체 조합 및 관리)
```

### 2. **`src/js/ui/remoteControl.js` (419줄)**

**문제점:**
- 🎮 **복잡한 키 처리 로직**: 시청 화면과 일반 화면 처리가 섞여있음
- 🔄 **중복 코드**: 포커스 관리 로직의 중복

**개선 방안:**
```
remoteControl.js → 분리:
├── input/
│   ├── WatchScreenController.js  (시청 화면 키 처리)
│   ├── NavigationController.js   (일반 화면 키 처리)
│   └── FocusManager.js          (포커스 관리 전용)
└── RemoteControlManager.js       (통합 관리)
```

### 3. **`src/js/ui/chatManager.js` (416줄)**

**문제점:**
- 🔌 **WebSocket과 UI 로직 혼재**: 네트워크 로직과 UI 로직이 같은 파일에 있음
- 📝 **메시지 처리의 복잡성**: 다양한 메시지 타입 처리가 하나의 함수에 집중

**개선 방안:**
```
chatManager.js → 분리:
├── websocket/
│   ├── ChatWebSocket.js    (WebSocket 연결/관리)
│   ├── MessageHandler.js   (메시지 파싱/처리)
│   └── ChatProtocol.js     (치지직 채팅 프로토콜)
├── ui/
│   ├── ChatPanel.js        (채팅창 UI)
│   └── MessageRenderer.js  (메시지 렌더링)
└── ChatManager.js          (통합 관리)
```

### 4. **`src/js/ui/navigation.js` (300줄)**

**문제점:**
- 🧭 **포커스 로직의 복잡성**: 2D 그리드 네비게이션이 복잡함
- 🔄 **카드 선택 로직**: 검색 결과와 라이브 카드 처리가 혼재

**개선 방안:**
```
navigation.js → 분리:
├── focus/
│   ├── GridNavigation.js   (2D 그리드 네비게이션)
│   ├── FocusTracker.js     (포커스 상태 추적)
│   └── SearchNavigation.js (검색 영역 네비게이션)
└── NavigationManager.js    (통합 관리)
```

## 🛠️ 기술적 개선사항

### 1. **ES5 → ES6+ 모던화**
```javascript
// 현재 (ES5)
var currentWatchData = null;
function showWatchScreen(broadcastData) {
    // ...
}

// 개선 후 (ES6+)
class WatchScreenManager {
    #currentWatchData = null;
    
    showWatchScreen(broadcastData) {
        // ...
    }
}
```

### 2. **전역 변수 제거**
```javascript
// 현재 (전역 변수)
var watchSectionElement;
var watchInfoPanelElements;

// 개선 후 (모듈 내부 상태)
class WatchUI {
    #elements = {};
    
    constructor() {
        this.#elements = this.#initializeElements();
    }
}
```

### 3. **의존성 주입 패턴 도입**
```javascript
// 개선 후
class WatchScreenManager {
    constructor(player, ui, chatManager) {
        this.player = player;
        this.ui = ui;
        this.chatManager = chatManager;
    }
}
```

## 📊 우선순위별 리팩토링 계획

### Phase 1 (High Priority)
1. **`ui/watchScreen.js`** 파일 분리
2. **전역 변수 제거**
3. **ES6+ 모던화**

### Phase 2 (Medium Priority)
1. **`remoteControl.js`** 분리
2. **`chatManager.js`** 분리
3. **에러 처리 개선**

### Phase 3 (Low Priority)
1. **`navigation.js`** 최적화
2. **타입스크립트 도입 검토**
3. **테스트 코드 추가**

## 🔧 기타 개선사항

### 1. **에러 처리 개선**
- API 호출 실패 시 사용자 친화적 메시지
- 네트워크 에러 복구 로직 개선

### 2. **성능 최적화**
- 큰 함수들을 작은 단위로 분리
- 불필요한 DOM 조작 최소화
- 메모리 누수 방지

### 3. **코드 일관성**
- 네이밍 컨벤션 통일
- 주석 표준화
- 함수 크기 제한 (50줄 이하 권장)

## 📈 예상 효과

### Before 리팩토링
- 🔴 1개 파일에 636줄 (유지보수 어려움)
- 🔴 14개 전역 변수 (네임스페이스 오염)
- 🔴 복잡한 의존성 (테스트 어려움)

### After 리팩토링
- ✅ 작은 단위 모듈들 (단일 책임)
- ✅ 캡슐화된 상태 관리
- ✅ 테스트 가능한 구조
- ✅ 유지보수성 향상

## 🚀 실행 권장사항

1. **점진적 리팩토링**: 한 번에 모든 것을 바꾸지 말고 단계적으로 진행
2. **테스트 우선**: 기존 기능이 깨지지 않도록 테스트 케이스 작성
3. **백업**: 리팩토링 전 현재 코드의 백업 생성
4. **문서화**: 새로운 구조에 대한 문서 작성

---

*분석 완료일: 2024년 12월 19일*