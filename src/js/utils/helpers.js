// 유틸리티 함수들 (ES5 호환)

/**
 * HTML 특수문자 이스케이프 함수
 * @param {string} str - 이스케이프할 문자열
 * @returns {string} 이스케이프된 문자열
 */
function escapeHTML(str) {
    if (typeof str !== 'string') {
        return '';
    }
    return str.replace(/[&<>"']/g, function (match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}

/**
 * 이미지 로드 실패 시 플레이스홀더 생성
 * @param {string} text - 플레이스홀더에 표시할 텍스트
 * @returns {HTMLElement} 플레이스홀더 요소
 */
function createPlaceholderThumbnail(text) {
    if (text === undefined) text = "No Image";
    
    var placeholder = document.createElement('div');
    placeholder.className = 'placeholder-thumbnail';
    var span = document.createElement('span');
    span.textContent = text;
    placeholder.appendChild(span);
    return placeholder;
}

/**
 * Grid 컬럼 수 계산 함수 - TV 호환성 개선
 * @returns {number} 현재 활성 컨테이너의 컬럼 수
 */
function getColumnCount() {
    var liveStreamContainer = document.getElementById('live-stream-list-container');
    var searchResultsContainer = document.getElementById('search-results-container');
    var activeContainer = null;
    var isSearchView = false;

    // 활성 컨테이너 찾기
    if (searchResultsContainer && searchResultsContainer.style.display !== 'none' && 
        searchResultsContainer.children.length > 0) {
        activeContainer = searchResultsContainer;
        isSearchView = true;
    } else if (liveStreamContainer) {
        activeContainer = liveStreamContainer;
    }

    // TV 환경에서는 고정값 사용 (안정성)
    if (window.isWebOSTV) {
        console.log("[TV Debug] Using fixed column count for TV");
        return 4; // 검색 결과와 라이브 모두 4열로 통일
    }

    if (activeContainer) {
        try {
            var gridComputedStyle = window.getComputedStyle(activeContainer);
            var gridTemplateColumns = gridComputedStyle.getPropertyValue('grid-template-columns');
            
            // Grid가 아닌 경우 (flexbox 폴백)
            if (!gridTemplateColumns || gridTemplateColumns === 'none') {
                // Flexbox 레이아웃에서 실제 카드 수로 계산
                var cards = activeContainer.querySelectorAll('.live-card');
                if (cards.length > 0) {
                    var containerWidth = activeContainer.offsetWidth;
                    var cardWidth = cards[0].offsetWidth;
                    if (cardWidth > 0) {
                        var calculatedCols = Math.floor(containerWidth / cardWidth);
                        console.log("[Debug] Flexbox column calculation:", calculatedCols);
                        return calculatedCols || 4;
                    }
                }
                // 폴백 값
                return 4;
            }
            
            // Grid 레이아웃 파싱
            var columns = gridTemplateColumns.split(' ').filter(function(s) {
                return s.trim() !== '';
            });
            
            if (columns.length > 0) {
                console.log("[Debug] Grid columns detected:", columns.length);
                return columns.length;
            }
        } catch (e) {
            console.error("[Error] getColumnCount failed:", e);
        }
    }
    
    // 기본값: 라이브는 4열, 검색은 6열
    return 4;
}

/**
 * webOS 뒤로가기 처리
 */
function handlePlatformBack() {
    if (typeof webOS !== 'undefined' && webOS.platformBack) {
        webOS.platformBack();
    } else {
        console.warn("webOS.platformBack() is not available.");
    }
}

// 모듈 내보내기
window.Utils = {
    escapeHTML: escapeHTML,
    createPlaceholderThumbnail: createPlaceholderThumbnail,
    getColumnCount: getColumnCount,
    handlePlatformBack: handlePlatformBack
}; 