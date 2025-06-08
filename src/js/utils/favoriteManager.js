// 즐겨찾기 관리 모듈 (ES5 호환)

var FAVORITES_STORAGE_KEY = 'chzzk_favorites';

/**
 * localStorage에서 즐겨찾기 목록 가져오기
 * @returns {Array} 즐겨찾기 목록 배열
 */
function getFavorites() {
    try {
        var favoritesJson = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (favoritesJson) {
            return JSON.parse(favoritesJson);
        }
    } catch (error) {
        console.error('즐겨찾기 목록 로드 실패:', error);
    }
    return [];
}

/**
 * localStorage에 즐겨찾기 목록 저장
 * @param {Array} favorites - 저장할 즐겨찾기 목록
 * @returns {boolean} 저장 성공 여부
 */
function saveFavorites(favorites) {
    try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
        return true;
    } catch (error) {
        console.error('즐겨찾기 목록 저장 실패:', error);
        return false;
    }
}

/**
 * 채널이 즐겨찾기에 있는지 확인
 * @param {string} channelId - 확인할 채널 ID
 * @returns {boolean} 즐겨찾기 여부
 */
function isFavorite(channelId) {
    if (!channelId) return false;
    
    var favorites = getFavorites();
    for (var i = 0; i < favorites.length; i++) {
        if (favorites[i].channelId === channelId) {
            return true;
        }
    }
    return false;
}

/**
 * 즐겨찾기에 채널 추가
 * @param {Object} channelData - 추가할 채널 데이터
 * @param {string} channelData.channelId - 채널 ID
 * @param {string} channelData.channelName - 채널 이름
 * @param {string} [channelData.channelImageUrl] - 채널 이미지 URL
 * @returns {boolean} 추가 성공 여부
 */
function addFavorite(channelData) {
    if (!channelData || !channelData.channelId) {
        console.error('addFavorite: 유효하지 않은 채널 데이터');
        return false;
    }
    
    var favorites = getFavorites();
    
    // 이미 즐겨찾기에 있는지 확인
    for (var i = 0; i < favorites.length; i++) {
        if (favorites[i].channelId === channelData.channelId) {
            console.log('이미 즐겨찾기에 있는 채널:', channelData.channelName);
            return false;
        }
    }
    
    // 새 즐겨찾기 항목 생성
    var newFavorite = {
        channelId: channelData.channelId,
        channelName: channelData.channelName || '알 수 없는 채널',
        channelImageUrl: channelData.channelImageUrl || null,
        addedAt: new Date().toISOString()
    };
    
    favorites.push(newFavorite);
    
    var success = saveFavorites(favorites);
    if (success) {
        console.log('즐겨찾기 추가 성공:', channelData.channelName);
    }
    
    return success;
}

/**
 * 즐겨찾기에서 채널 제거
 * @param {string} channelId - 제거할 채널 ID
 * @returns {boolean} 제거 성공 여부
 */
function removeFavorite(channelId) {
    if (!channelId) {
        console.error('removeFavorite: 채널 ID가 제공되지 않음');
        return false;
    }
    
    var favorites = getFavorites();
    var initialLength = favorites.length;
    
    // 해당 채널 ID를 가진 항목 제거
    var updatedFavorites = [];
    for (var i = 0; i < favorites.length; i++) {
        if (favorites[i].channelId !== channelId) {
            updatedFavorites.push(favorites[i]);
        }
    }
    
    if (updatedFavorites.length === initialLength) {
        console.log('제거할 즐겨찾기 항목을 찾을 수 없음:', channelId);
        return false;
    }
    
    var success = saveFavorites(updatedFavorites);
    if (success) {
        console.log('즐겨찾기 제거 성공:', channelId);
    }
    
    return success;
}

/**
 * 즐겨찾기 토글 (있으면 제거, 없으면 추가)
 * @param {Object} channelData - 토글할 채널 데이터
 * @returns {boolean} 토글 후 즐겨찾기 상태 (true: 추가됨, false: 제거됨)
 */
function toggleFavorite(channelData) {
    if (!channelData || !channelData.channelId) {
        console.error('toggleFavorite: 유효하지 않은 채널 데이터');
        return false;
    }
    
    if (isFavorite(channelData.channelId)) {
        removeFavorite(channelData.channelId);
        return false; // 제거됨
    } else {
        addFavorite(channelData);
        return true; // 추가됨
    }
}

/**
 * 특정 채널 ID들이 즐겨찾기인지 일괄 확인
 * @param {Array<string>} channelIds - 확인할 채널 ID 배열
 * @returns {Object} 채널 ID를 키로 하고 즐겨찾기 여부를 값으로 하는 객체
 */
function getFavoriteStatus(channelIds) {
    if (!Array.isArray(channelIds)) {
        return {};
    }
    
    var favorites = getFavorites();
    var favoriteChannelIds = {};
    
    // 즐겨찾기 채널 ID들을 객체로 변환 (빠른 조회를 위해)
    for (var i = 0; i < favorites.length; i++) {
        favoriteChannelIds[favorites[i].channelId] = true;
    }
    
    // 요청된 채널 ID들의 즐겨찾기 상태 확인
    var result = {};
    for (var j = 0; j < channelIds.length; j++) {
        var channelId = channelIds[j];
        result[channelId] = favoriteChannelIds[channelId] === true;
    }
    
    return result;
}

/**
 * 즐겨찾기 목록 초기화
 * @returns {boolean} 초기화 성공 여부
 */
function clearAllFavorites() {
    try {
        localStorage.removeItem(FAVORITES_STORAGE_KEY);
        console.log('모든 즐겨찾기가 초기화되었습니다.');
        return true;
    } catch (error) {
        console.error('즐겨찾기 초기화 실패:', error);
        return false;
    }
}

/**
 * 즐겨찾기 통계 정보 가져오기
 * @returns {Object} 즐겨찾기 통계
 */
function getFavoriteStats() {
    var favorites = getFavorites();
    return {
        totalCount: favorites.length,
        oldestAdded: favorites.length > 0 ? Math.min.apply(Math, favorites.map(function(f) { 
            return new Date(f.addedAt).getTime(); 
        })) : null,
        newestAdded: favorites.length > 0 ? Math.max.apply(Math, favorites.map(function(f) { 
            return new Date(f.addedAt).getTime(); 
        })) : null
    };
}

// 모듈 내보내기
window.FavoriteManager = {
    getFavorites: getFavorites,
    isFavorite: isFavorite,
    addFavorite: addFavorite,
    removeFavorite: removeFavorite,
    toggleFavorite: toggleFavorite,
    getFavoriteStatus: getFavoriteStatus,
    clearAllFavorites: clearAllFavorites,
    getFavoriteStats: getFavoriteStats
}; 