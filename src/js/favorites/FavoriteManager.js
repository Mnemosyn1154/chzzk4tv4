// 즐겨찾기 관리 모듈 (ES5 호환)

var FavoriteManager = (function() {

    var FAVORITES_KEY = 'chzzk_favorites';

    /**
     * localStorage에서 즐겨찾기 목록을 가져옵니다.
     * @returns {string[]} 즐겨찾는 채널 ID 목록
     */
    function getFavorites() {
        var favorites = localStorage.getItem(FAVORITES_KEY);
        return favorites ? JSON.parse(favorites) : [];
    }

    /**
     * 즐겨찾기 목록을 localStorage에 저장합니다.
     * @param {string[]} favorites - 저장할 채널 ID 목록
     */
    function saveFavorites(favorites) {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }

    /**
     * 채널을 즐겨찾기에 추가합니다.
     * @param {string} channelId - 추가할 채널의 ID
     */
    function addFavorite(channelId) {
        var favorites = getFavorites();
        if (favorites.indexOf(channelId) === -1) {
            favorites.push(channelId);
            saveFavorites(favorites);
            console.log('Added to favorites:', channelId);
        }
    }

    /**
     * 채널을 즐겨찾기에서 제거합니다.
     * @param {string} channelId - 제거할 채널의 ID
     */
    function removeFavorite(channelId) {
        var favorites = getFavorites();
        var index = favorites.indexOf(channelId);
        if (index > -1) {
            favorites.splice(index, 1);
            saveFavorites(favorites);
            console.log('Removed from favorites:', channelId);
        }
    }

    /**
     * 특정 채널이 즐겨찾기에 포함되어 있는지 확인합니다.
     * @param {string} channelId - 확인할 채널의 ID
     * @returns {boolean} 즐겨찾기 포함 여부
     */
    function isFavorite(channelId) {
        var favorites = getFavorites();
        return favorites.indexOf(channelId) > -1;
    }

    // Public API
    return {
        addFavorite: addFavorite,
        removeFavorite: removeFavorite,
        getFavorites: getFavorites,
        isFavorite: isFavorite
    };

})();

// 전역 스코프에 노출 (다른 모듈에서 사용할 수 있도록)
window.FavoriteManager = FavoriteManager; 