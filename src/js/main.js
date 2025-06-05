// Main JavaScript for Chzzk4LGTV4 - 리팩토링된 버전
console.log("Chzzk4LGTV4 App Started!");

// 전역 변수들
var currentSelectedLiveData = null;
var previousView = null;

/**
 * 애플리케이션 초기화
 */
function initializeApp() {
    console.log("Initializing Chzzk4LGTV4 App...");
    
    // 리모컨 이벤트 리스너 초기화
    RemoteControl.initializeRemoteControl();
    
    // 검색 기능 초기화
    SearchManager.initializeSearch();
    
    // 초기 라이브 목록 로드
    SearchManager.showLiveList();
    
    console.log("App initialization complete!");
}

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', function () {
    console.log('Main app initializing...');
    
    // 모든 모듈이 로드되었는지 확인
    if (typeof ChzzkAPI === 'undefined' || 
        typeof Utils === 'undefined' || 
        typeof CardManager === 'undefined' || 
        typeof Navigation === 'undefined' || 
        typeof SearchManager === 'undefined' ||
        typeof RemoteControl === 'undefined') {
        console.error('Some modules are not loaded!');
        return;
    }
    
    console.log('All modules loaded successfully');
    
    initializeApp();
});

// 기존 호환성을 위한 전역 함수 매핑
window.fetchLives = ChzzkAPI.fetchLives;
window.fetchSearchResults = ChzzkAPI.fetchSearchResults;
window.fetchFullLiveDetails = ChzzkAPI.fetchFullLiveDetails;
window.createLiveCard = CardManager.createLiveCard;
window.createSearchResultCard = CardManager.createSearchResultCard;

// 전역 함수들 (기존 호환성 유지)
window.fetchAndDisplayLives = SearchManager.showLiveList;
window.fetchAndDisplaySearchResults = SearchManager.showSearchResults;
window.currentSelectedLiveData = currentSelectedLiveData;
window.previousView = previousView; 