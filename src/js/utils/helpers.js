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
 * Grid 컬럼 수 계산 함수
 * @returns {number} 현재 활성 컨테이너의 컬럼 수
 */
function getColumnCount() {
    var liveStreamContainer = document.getElementById('live-stream-list-container');
    var searchResultsContainer = document.getElementById('search-results-container');
    var activeContainer = null;

    if (liveStreamContainer && liveStreamContainer.style.display !== 'none') {
        activeContainer = liveStreamContainer;
    } else if (searchResultsContainer && searchResultsContainer.style.display !== 'none') {
        activeContainer = searchResultsContainer;
    }

    if (activeContainer) {
        var gridComputedStyle = window.getComputedStyle(activeContainer);
        var gridTemplateColumns = gridComputedStyle.getPropertyValue('grid-template-columns');
        var columns = gridTemplateColumns.split(' ').filter(function(s) {
            return s.trim() !== '';
        });
        return columns.length > 0 ? columns.length : 1; 
    }
    
    return 4; // 기본값
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