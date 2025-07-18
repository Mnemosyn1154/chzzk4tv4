/**
 * Mediator 패턴 구현 (ES5)
 * 모듈 간의 직접적인 의존성을 제거하고 느슨한 결합을 제공
 */

(function() {
    'use strict';
    
    /**
     * Mediator 생성자 함수
     */
    function Mediator() {
        // 비공개 멤버: 이벤트 저장소
        var events = {};
        
        /**
         * 이벤트 구독
         * @param {string} eventName - 구독할 이벤트 이름
         * @param {function} callback - 이벤트 발생 시 실행될 콜백 함수
         * @returns {object} - 구독 해제를 위한 객체
         */
        this.subscribe = function(eventName, callback) {
            if (typeof eventName !== 'string' || typeof callback !== 'function') {
                console.error('Mediator.subscribe: Invalid parameters');
                return null;
            }
            
            // 이벤트가 없으면 새로 생성
            if (!events[eventName]) {
                events[eventName] = [];
            }
            
            // 콜백 추가
            events[eventName].push(callback);
            
            console.log('Mediator: Subscribed to event:', eventName);
            
            // 구독 해제를 위한 객체 반환
            return {
                unsubscribe: function() {
                    var index = events[eventName].indexOf(callback);
                    if (index > -1) {
                        events[eventName].splice(index, 1);
                        console.log('Mediator: Unsubscribed from event:', eventName);
                    }
                }
            };
        };
        
        /**
         * 이벤트 발행
         * @param {string} eventName - 발행할 이벤트 이름
         * @param {*} data - 이벤트와 함께 전달할 데이터
         */
        this.publish = function(eventName, data) {
            if (typeof eventName !== 'string') {
                console.error('Mediator.publish: Invalid event name');
                return;
            }
            
            // 해당 이벤트에 등록된 콜백이 없으면 종료
            if (!events[eventName] || events[eventName].length === 0) {
                console.log('Mediator: No subscribers for event:', eventName);
                return;
            }
            
            console.log('Mediator: Publishing event:', eventName, 'with data:', data);
            
            // 모든 구독자에게 이벤트 전달
            var subscribers = events[eventName].slice(); // 배열 복사
            for (var i = 0; i < subscribers.length; i++) {
                try {
                    subscribers[i].call(null, data);
                } catch (error) {
                    console.error('Mediator: Error in subscriber callback for event:', eventName, error);
                }
            }
        };
        
        /**
         * 특정 이벤트의 모든 구독 해제
         * @param {string} eventName - 구독 해제할 이벤트 이름
         */
        this.unsubscribeAll = function(eventName) {
            if (events[eventName]) {
                delete events[eventName];
                console.log('Mediator: Unsubscribed all from event:', eventName);
            }
        };
        
        /**
         * 현재 등록된 이벤트 목록 반환 (디버깅용)
         * @returns {string[]} - 이벤트 이름 배열
         */
        this.getEvents = function() {
            var eventNames = [];
            for (var eventName in events) {
                if (events.hasOwnProperty(eventName)) {
                    eventNames.push(eventName);
                }
            }
            return eventNames;
        };
        
        /**
         * 특정 이벤트의 구독자 수 반환 (디버깅용)
         * @param {string} eventName - 확인할 이벤트 이름
         * @returns {number} - 구독자 수
         */
        this.getSubscriberCount = function(eventName) {
            return events[eventName] ? events[eventName].length : 0;
        };
    }
    
    // 전역 인스턴스 생성 및 노출
    window.AppMediator = new Mediator();
    
    console.log('AppMediator initialized');
})();

/**
 * 사용 예제:
 * 
 * // 이벤트 구독
 * var subscription = AppMediator.subscribe('user:login', function(userData) {
 *     console.log('User logged in:', userData);
 * });
 * 
 * // 이벤트 발행
 * AppMediator.publish('user:login', { userId: 123, name: 'John' });
 * 
 * // 구독 해제
 * subscription.unsubscribe();
 * 
 * // 모든 구독 해제
 * AppMediator.unsubscribeAll('user:login');
 */