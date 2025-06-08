// 검색 관련 기능 모듈 (ES5 호환)

/**
 * 라이브 중인 즐겨찾기 채널과 인기 목록을 합치고 정렬
 * @param {Array} popularLives - 인기 방송 목록
 * @param {Array} favoriteLives - 라이브 중인 즐겨찾기 목록
 * @returns {Array} 정렬된 라이브 방송 목록
 */
function mergeFavoriteAndPopularLives(popularLives, favoriteLives) {
    if (!popularLives) popularLives = [];
    if (!favoriteLives) favoriteLives = [];
    
    // 중복 제거: 인기 목록에서 이미 즐겨찾기에 있는 채널 제거
    var favoriteChannelIds = {};
    for (var i = 0; i < favoriteLives.length; i++) {
        var live = favoriteLives[i];
        var channelId = null;
        
        if (live.channel && live.channel.channelId) {
            channelId = live.channel.channelId;
        } else if (live.channelId) {
            channelId = live.channelId;
        }
        
        if (channelId) {
            favoriteChannelIds[channelId] = true;
        }
    }
    
    // 인기 목록에서 즐겨찾기에 없는 채널들만 필터링
    var filteredPopularLives = [];
    for (var j = 0; j < popularLives.length; j++) {
        var popularLive = popularLives[j];
        var popularChannelId = null;
        
        if (popularLive.channel && popularLive.channel.channelId) {
            popularChannelId = popularLive.channel.channelId;
        } else if (popularLive.channelId) {
            popularChannelId = popularLive.channelId;
        }
        
        // 즐겨찾기에 없는 채널만 추가
        if (!popularChannelId || !favoriteChannelIds[popularChannelId]) {
            filteredPopularLives.push(popularLive);
        }
    }
    
    // 각각 시청자 수 기준으로 정렬
    favoriteLives.sort(function(a, b) {
        var viewersA = a.concurrentUserCount || 0;
        var viewersB = b.concurrentUserCount || 0;
        return viewersB - viewersA;
    });
    
    filteredPopularLives.sort(function(a, b) {
        var viewersA = a.concurrentUserCount || 0;
        var viewersB = b.concurrentUserCount || 0;
        return viewersB - viewersA;
    });
    
    // 라이브 중인 즐겨찾기를 앞에, 나머지 인기 채널을 뒤에 배치
    var mergedLives = favoriteLives.concat(filteredPopularLives);
    
    console.log('라이브 목록 병합 및 정렬 완료:', {
        favoriteLiveChannels: favoriteLives.length,
        popularChannels: filteredPopularLives.length,
        totalChannels: mergedLives.length
    });
    
    return mergedLives;
}

/**
 * 라이브 방송 목록 표시
 */
function showLiveList() {
    var liveStreamListContainer = document.getElementById('live-stream-list-container');
    var searchResultsContainer = document.getElementById('search-results-container');
    
    liveStreamListContainer.style.display = 'grid';
    searchResultsContainer.style.display = 'none';
    searchResultsContainer.innerHTML = '';
    
    // 즐겨찾기 상태 변경 반영을 위해 항상 새로 로드
    liveStreamListContainer.innerHTML = '<p>방송 목록을 불러오는 중...</p>';
    
    // 인기 방송 목록과 라이브 중인 즐겨찾기 채널을 병렬로 가져오기
    return Promise.all([
        ChzzkAPI.fetchLives(),
        ChzzkAPI.fetchFavoriteLiveChannels()
    ]).then(function(results) {
        var popularLives = results[0] || [];
        var favoriteLives = results[1] || [];
        
        liveStreamListContainer.innerHTML = '';
        
        // 즐겨찾기 라이브 채널과 인기 목록 병합
        var mergedLives = mergeFavoriteAndPopularLives(popularLives, favoriteLives);
        
        if (mergedLives && mergedLives.length > 0) {
            // 병합된 목록으로 카드 생성
            for (var i = 0; i < mergedLives.length; i++) {
                CardManager.createLiveCard(mergedLives[i], liveStreamListContainer);
            }
        } else {
            liveStreamListContainer.innerHTML = '<p>현재 진행 중인 방송이 없습니다.</p>';
        }
        
        // 카드 목록이 변경되었으므로 포커스 시스템 업데이트
        if (window.Navigation) {
            Navigation.initializeFocus();
        }
    }).catch(function(error) {
        console.error('라이브 목록 로드 실패:', error);
        liveStreamListContainer.innerHTML = '<p>방송 목록을 불러오는데 실패했습니다.</p>';
    });
}

/**
 * 검색 결과 표시
 * @param {string} keyword - 검색 키워드
 */
function showSearchResults(keyword) {
    var searchResultsContainer = document.getElementById('search-results-container');
    var liveStreamListContainer = document.getElementById('live-stream-list-container');
    
    // 라이브 목록은 유지하고 검색 결과만 추가로 표시
    searchResultsContainer.style.display = 'grid';
    searchResultsContainer.innerHTML = '<p>검색 중...</p>';
    
    return ChzzkAPI.fetchSearchResults(keyword).then(function(searchData) {
        searchResultsContainer.innerHTML = '';
        
        if (searchData && searchData.length > 0) {
            for (var i = 0; i < searchData.length; i++) {
                CardManager.createSearchResultCard(searchData[i], searchResultsContainer);
            }
            
            // 검색 결과가 로드된 후 첫 번째 카드로 포커스 이동
            if (window.Navigation) {
                Navigation.initializeFocus();
                // 첫 번째 검색 결과 카드로 포커스 설정 (인덱스 2: 검색창=0, 검색버튼=1, 첫번째카드=2)
                Navigation.setFocus(2);
            }
        } else {
            searchResultsContainer.innerHTML = '<p>검색 결과가 없습니다.</p>';
        }
    }).catch(function(error) {
        console.error('검색 실패:', error);
        searchResultsContainer.innerHTML = '<p>검색에 실패했습니다.</p>';
    });
}

/**
 * 검색 기능 초기화
 */
function initializeSearch() {
    var searchButton = document.getElementById('search-button');
    var searchKeywordInput = document.getElementById('search-keyword-input');
    
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            var keyword = searchKeywordInput.value.trim();
            if (keyword) {
                showSearchResults(keyword);
            }
        });
    }
    
    if (searchKeywordInput) {
        searchKeywordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                var keyword = searchKeywordInput.value.trim();
                if (keyword) {
                    showSearchResults(keyword);
                }
            }
        });
        
        // 검색어 입력 감지하여 빈값이면 검색 결과 숨기기
        searchKeywordInput.addEventListener('input', function() {
            var keyword = searchKeywordInput.value.trim();
            if (keyword === '') {
                // 검색어가 삭제되면 검색 결과 숨기고 라이브 목록만 표시
                var searchResultsContainer = document.getElementById('search-results-container');
                if (searchResultsContainer && searchResultsContainer.style.display === 'grid') {
                    searchResultsContainer.style.display = 'none';
                    searchResultsContainer.innerHTML = '';
                    showLiveList();
                }
            }
        });
    }
}

/**
 * 라이브 목록 새로고침 (즐겨찾기 변경 시 사용)
 */
function refreshLiveList() {
    var liveStreamListContainer = document.getElementById('live-stream-list-container');
    
    // 기존 데이터 강제 제거 후 다시 로드
    if (liveStreamListContainer) {
        liveStreamListContainer.innerHTML = '';
        showLiveList();
    }
}

// 모듈 내보내기
window.SearchManager = {
    showLiveList: showLiveList,
    showSearchResults: showSearchResults,
    initializeSearch: initializeSearch,
    mergeFavoriteAndPopularLives: mergeFavoriteAndPopularLives,
    refreshLiveList: refreshLiveList
}; 