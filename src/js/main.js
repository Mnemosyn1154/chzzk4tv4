// Main JavaScript for Chzzk4LGTV4
console.log("Chzzk4LGTV4 App Started!");

// API로부터 라이브 목록을 가져와 화면에 표시하는 함수
function fetchAndDisplayLives() {
    var xhr = new XMLHttpRequest();
    // 프록시 서버 주소 (개발 환경에서는 localhost, 실제 WebOS 앱에서는 앱이 배포된 서버의 IP/도메인 또는 상대 경로 사용 필요)
    // 우선 localhost로 가정합니다.
    var proxyUrl = 'http://localhost:3000/api/lives'; // .env에서 PORT를 변경했다면 해당 포트로 수정

    xhr.open('GET', proxyUrl, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) { // 요청 완료
            var liveListContainer = document.getElementById('live-stream-list-container'); // 대상 컨테이너 변경
            if (!liveListContainer) {
                console.error('Error: live-stream-list-container not found!');
                return;
            }

            if (xhr.status === 200) { // 성공
                try {
                    var response = JSON.parse(xhr.responseText);
                    // API 응답 구조에 따라 실제 데이터 경로를 확인해야 합니다.
                    // 예시 응답: { code: 200, message: null, content: { data: [...] } }
                    var lives = response.content && response.content.data ? response.content.data : [];

                    if (lives.length > 0) {
                        var htmlContent = ''; // live-list-container div는 CSS에서 관리하므로 내부 카드들만 생성
                        for (var i = 0; i < lives.length; i++) {
                            var live = lives[i];
                            htmlContent += '<div class="live-card">'; // 각 라이브 방송 카드
                            
                            if (live.liveImageUrl) {
                                var imageType = '480'; 
                                var imageUrl = live.liveImageUrl.replace('{type}', imageType);
                                // console.log('Generated Image URL for "' + live.liveTitle + '": ' + imageUrl); // 필요시 주석 해제
                                htmlContent += '<img class="live-card-thumbnail" src="' + escapeHTML(imageUrl) + '" alt="' + escapeHTML(live.liveTitle) + '"/>';
                            }
                            
                            htmlContent += '<div class="live-card-info">';
                            htmlContent += '<h3 class="live-card-title">' + escapeHTML(live.liveTitle) + '</h3>';
                            if (live.channel && live.channel.channelName) {
                                htmlContent += '<p class="live-card-channel">' + escapeHTML(live.channel.channelName) + '</p>';
                            }
                            htmlContent += '<p class="live-card-viewers">시청자: ' + live.concurrentUserCount + '</p>';
                            htmlContent += '</div>'; // live-card-info 끝
                            htmlContent += '</div>'; // live-card 끝
                        }
                        liveListContainer.innerHTML = htmlContent;
                    } else {
                        liveListContainer.innerHTML = '<p>현재 진행 중인 라이브 방송이 없습니다.</p>'; // 메시지 단순화
                    }
                } catch (e) {
                    console.error('Error parsing JSON response:', e);
                    liveListContainer.innerHTML = '<p>방송 목록을 가져오는 중 오류가 발생했습니다. (데이터 파싱 실패)</p>';
                }
            } else { // 실패
                console.error('Error fetching lives. Status:', xhr.status, xhr.statusText);
                liveListContainer.innerHTML = '<p>방송 목록을 가져오는 중 오류가 발생했습니다. (서버 응답: ' + xhr.status + ')</p>';
            }
        }
    };
    xhr.onerror = function () {
        console.error('Network error while fetching lives.');
        var liveListContainer = document.getElementById('live-stream-list-container');
        if (liveListContainer) {
            liveListContainer.innerHTML = '<p>방송 목록을 가져오는 중 네트워크 오류가 발생했습니다.</p>';
        }
    };
    xhr.send();
}

// 스트리머 검색 결과를 가져와 화면에 표시하는 함수
function fetchAndDisplaySearchResults(keyword) {
    var searchResultsContainer = document.getElementById('search-results-container');
    if (!searchResultsContainer) {
        console.error('Error: search-results-container not found!');
        return;
    }

    if (!keyword || keyword.trim() === '') {
        searchResultsContainer.innerHTML = '<p>검색어를 입력해주세요.</p>';
        return;
    }

    searchResultsContainer.innerHTML = '<p>검색 중...</p>';

    var xhr = new XMLHttpRequest();
    // encodeURIComponent를 사용하여 URL에 안전하게 키워드를 포함합니다.
    var proxyUrl = 'http://localhost:3000/api/search/streamers?keyword=' + encodeURIComponent(keyword);

    xhr.open('GET', proxyUrl, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) { // 요청 완료
            if (xhr.status === 200) { // 성공
                try {
                    var response = JSON.parse(xhr.responseText);
                    var channels = response.content && response.content.data ? response.content.data : [];

                    if (channels.length > 0) {
                        var htmlContent = '';
                        for (var i = 0; i < channels.length; i++) {
                            var channel = channels[i];
                            var cardClass = 'live-card search-result-card'; // 기본 카드 클래스
                            if (channel.isLive) {
                                cardClass += ' live-now'; // 라이브 중일 경우 클래스 추가
                            }

                            htmlContent += '<div class="' + cardClass + '">';
                            
                            var imageUrlToDisplay = null;
                            var altText = escapeHTML(channel.channelName) + " 채널 이미지";

                            if (channel.isLive && typeof channel.liveImageUrl === 'string' && channel.liveImageUrl.length > 0) {
                                // 라이브 중이고 liveImageUrl이 있으면 사용
                                imageUrlToDisplay = channel.liveImageUrl.replace('{type}', '480'); // {type} 플레이스홀더 처리
                                altText = escapeHTML(channel.channelName) + " 라이브 방송";
                            } else if (typeof channel.channelImageUrl === 'string' && channel.channelImageUrl.length > 0) {
                                // 라이브가 아니거나 liveImageUrl이 없으면 channelImageUrl 사용
                                // channelImageUrl도 {type} 플레이스홀더를 가질 수 있다면 여기서 처리 필요 (현재는 완전한 URL로 가정)
                                imageUrlToDisplay = channel.channelImageUrl;
                            }

                            if (imageUrlToDisplay) {
                                htmlContent += '<img class="live-card-thumbnail" src="' + escapeHTML(imageUrlToDisplay) + '" alt="' + altText + '"/>';
                            } else {
                                htmlContent += '<div class="live-card-thumbnail placeholder-thumbnail"><span>No Image</span></div>'; 
                            }

                            htmlContent += '<div class="live-card-info">';
                            htmlContent += '<h3 class="live-card-title">' + escapeHTML(channel.channelName) + (channel.verifiedMark ? ' <span class="verified-badge">✔️</span>' : '') + '</h3>';
                            htmlContent += '<p class="live-card-channel">팔로워: ' + (channel.followerCount ? channel.followerCount.toLocaleString() : '0') + '</p>';
                            if (channel.isLive) {
                                htmlContent += '<p class="live-status-badge live">LIVE</p>';
                            }
                            if (channel.description) {
                                htmlContent += '<p class="channel-description">' + escapeHTML(channel.description) + '</p>';
                            }
                            htmlContent += '</div>'; // live-card-info 끝
                            htmlContent += '</div>'; // live-card 끝
                        }
                        searchResultsContainer.innerHTML = htmlContent;
                    } else {
                        searchResultsContainer.innerHTML = '<p>\"' + escapeHTML(keyword) + '\"에 대한 검색 결과가 없습니다.</p>';
                    }
                } catch (e) {
                    console.error('Error parsing search JSON response:', e);
                    searchResultsContainer.innerHTML = '<p>검색 결과를 가져오는 중 오류가 발생했습니다. (데이터 파싱 실패)</p>';
                }
            } else { // 실패
                console.error('Error fetching search results. Status:', xhr.status, xhr.statusText);
                searchResultsContainer.innerHTML = '<p>검색 결과를 가져오는 중 오류가 발생했습니다. (서버 응답: ' + xhr.status + ')</p>';
            }
        }
    };
    xhr.onerror = function () {
        console.error('Network error while fetching search results.');
        searchResultsContainer.innerHTML = '<p>검색 결과를 가져오는 중 네트워크 오류가 발생했습니다.</p>';
    };
    xhr.send();
}

// HTML 특수문자 이스케이프 함수
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

// DOM 로드 완료 후 함수 실행
document.addEventListener('DOMContentLoaded', function () {
    fetchAndDisplayLives();

    var searchButton = document.getElementById('search-button');
    var searchKeywordInput = document.getElementById('search-keyword-input');

    if (searchButton && searchKeywordInput) {
        searchButton.addEventListener('click', function () {
            var keyword = searchKeywordInput.value;
            fetchAndDisplaySearchResults(keyword);
        });

        // 엔터 키로도 검색 실행
        searchKeywordInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                var keyword = searchKeywordInput.value;
                fetchAndDisplaySearchResults(keyword);
            }
        });
    } else {
        console.error('Search UI elements not found!');
    }
}); 