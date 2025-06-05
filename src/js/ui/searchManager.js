// 검색 관련 기능 모듈 (ES5 호환)

/**
 * 라이브 방송 목록 표시
 */
function showLiveList() {
    var liveStreamListContainer = document.getElementById('live-stream-list-container');
    var searchResultsContainer = document.getElementById('search-results-container');
    
    liveStreamListContainer.style.display = 'grid';
    searchResultsContainer.style.display = 'none';
    searchResultsContainer.innerHTML = '';
    
    // 이미 데이터가 있다면 재사용, 없으면 새로 로드
    if (liveStreamListContainer.children.length === 0) {
        liveStreamListContainer.innerHTML = '<p>방송 목록을 불러오는 중...</p>';
        
        return ChzzkAPI.fetchLives().then(function(lives) {
            liveStreamListContainer.innerHTML = '';
            
            if (lives && lives.length > 0) {
                for (var i = 0; i < lives.length; i++) {
                    CardManager.createLiveCard(lives[i], liveStreamListContainer);
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
    } else {
        // 기존 데이터가 있으면 포커스만 업데이트
        if (window.Navigation) {
            Navigation.initializeFocus();
        }
        return Promise.resolve();
    }
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

// 모듈 내보내기
window.SearchManager = {
    showLiveList: showLiveList,
    showSearchResults: showSearchResults,
    initializeSearch: initializeSearch
}; 