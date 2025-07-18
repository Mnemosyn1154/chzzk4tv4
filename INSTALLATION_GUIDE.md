# Chzzk4LGTV4 설치 가이드

## 📺 앱 소개
Chzzk4LGTV4는 LG WebOS TV에서 치지직(CHZZK) 스트리밍을 시청할 수 있는 앱입니다.

### 주요 기능
- 실시간 라이브 방송 시청
- 스트리머 검색
- 즐겨찾기 기능
- 채팅 보기

### 지원 TV
- LG WebOS TV 3.0 이상 (2016년 이후 모델)
- 권장: WebOS 4.0 이상 (2018년 이후 모델)

## 🔧 설치 방법

### 방법 1: 웹 브라우저로 직접 설치 (가장 간단) ⭐⭐⭐

#### 준비사항
- IPK 파일을 웹에서 다운로드 가능한 링크
- TV가 인터넷에 연결되어 있어야 함

#### 설치 과정
1. TV에서 웹 브라우저 실행
2. IPK 파일 다운로드 링크로 이동
   - 예: `https://github.com/Mnemosyn1154/chzzk4tv4/releases/download/v0.9.0/com.example.chzzk4lgtv4_0.9.0_all.ipk`
3. 파일 다운로드
4. 다운로드 완료 후 자동으로 설치 프롬프트가 나타남
5. '설치' 선택

### 방법 2: 파일 공유 앱 사용 (간단) ⭐⭐

#### 준비사항
- PC나 스마트폰에 IPK 파일
- 파일 공유 앱 (예: Send Files to TV, TV File Share)

#### 설치 과정
1. TV와 스마트폰/PC가 같은 WiFi에 연결
2. TV에서 파일 공유 앱 설치 및 실행
3. 스마트폰/PC에서 같은 앱 또는 웹 인터페이스 접속
4. IPK 파일 전송
5. TV에서 받은 파일 실행하여 설치

### 방법 3: 개발자 모드 설치 (안정적) ⭐

#### 1단계: LG 개발자 계정 생성
1. [LG 개발자 사이트](http://webostv.developer.lge.com) 접속
2. 우측 상단 'Sign In' → 'Sign Up' 클릭
3. 이메일 인증 후 계정 생성

#### 2단계: TV에서 개발자 모드 활성화
1. TV 리모컨으로 '설정' 메뉴 진입
2. '일반' → '정보' 메뉴로 이동
3. '소프트웨어 버전' 항목을 리모컨으로 5번 클릭
4. 개발자 모드 앱이 설치됨

#### 3단계: 개발자 모드 앱 실행
1. TV 홈 화면에서 'Developer Mode' 앱 실행
2. LG 개발자 계정으로 로그인
3. 'Dev Mode Status'를 'ON'으로 변경
4. TV 재시작

#### 4단계: Dev Manager 설치 (PC)
1. [webOS TV SDK](https://webostv.developer.lge.com/sdk/installation/) 다운로드
2. 운영체제에 맞는 버전 설치
3. 설치 후 'webOS TV Dev Manager' 실행

#### 5단계: TV 연결
1. Dev Manager에서 'Device' → 'Add Device' 클릭
2. TV IP 주소 입력 (TV 설정 → 네트워크 → 네트워크 상태에서 확인)
3. Passphrase는 TV 개발자 모드 앱에 표시된 6자리 입력
4. 'Add' 클릭하여 연결

#### 6단계: IPK 설치
1. Dev Manager에서 연결된 TV 선택
2. 우측 'Install' 버튼 클릭
3. `com.example.chzzk4lgtv4_0.9.0_all.ipk` 파일 선택
4. 설치 완료 대기

### 방법 4: USB 드라이브로 설치 ⭐

#### 준비사항
- USB 드라이브 (FAT32 또는 NTFS 포맷)
- IPK 파일

#### 설치 과정
1. USB 드라이브 루트에 `ipk` 폴더 생성
2. IPK 파일을 `ipk` 폴더에 복사
3. USB를 TV에 연결
4. TV에서 파일 관리자 앱 실행
5. USB 드라이브 → ipk 폴더로 이동
6. IPK 파일 선택 후 '설치' 또는 '열기' 선택

### 방법 5: Homebrew Channel 설치 (고급)

#### 사전 준비
- [Homebrew Channel](https://github.com/webosbrew/webos-homebrew-channel) 설치 필요
- USB 드라이브 (FAT32 포맷)

#### 설치 과정
1. IPK 파일을 USB 드라이브 루트에 복사
2. USB를 TV에 연결
3. Homebrew Channel 실행
4. 'Install from USB' 선택
5. `com.example.chzzk4lgtv4_0.9.0_all.ipk` 선택하여 설치

### 방법 6: 원격 설치 (PC에서 TV로 직접 전송)

#### 준비사항
- PC와 TV가 같은 네트워크에 연결
- Python 3 설치

#### 설치 과정
```bash
# 간단한 웹 서버 실행 (IPK 파일이 있는 폴더에서)
python3 -m http.server 8000

# 또는 Node.js가 있다면
npx http-server -p 8000
```

1. TV 웹 브라우저에서 `http://PC_IP주소:8000` 접속
2. IPK 파일 클릭하여 다운로드
3. 자동 설치 프롬프트에서 '설치' 선택

### 방법 7: CLI 설치 (개발자용)

```bash
# webOS CLI 설치 (Node.js 필요)
npm install -g @webosose/ares-cli

# TV 등록
ares-setup-device --add myTV --info "host=TV_IP_ADDRESS" --info "port=9922"

# 개발자 모드 TV에 설치
ares-install --device myTV com.example.chzzk4lgtv4_0.9.0_all.ipk
```

## ⚙️ 설치 전 확인사항

### TV 모델 확인
1. TV 설정 → 일반 → 정보
2. 모델명이 'OLED', 'NANO', 'UHD' 등으로 시작하는지 확인
3. WebOS 버전 확인 (3.0 이상 필요)

### 네트워크 설정
- TV가 인터넷에 연결되어 있어야 함
- 개발자 모드 설치 시 PC와 TV가 같은 네트워크에 있어야 함

### 필요 파일
- IPK 파일: `com.example.chzzk4lgtv4_0.9.0_all.ipk`
- 다운로드 링크: [GitHub Releases](https://github.com/Mnemosyn1154/chzzk4tv4/releases)

## 🎮 사용 방법

### 앱 실행
1. TV 홈 화면에서 'Chzzk4LGTV4' 앱 선택
2. 리모컨 'OK' 버튼으로 실행

### 기본 조작
- **방향키**: 메뉴 이동
- **OK 버튼**: 선택/재생
- **뒤로가기**: 이전 화면
- **0번**: 즐겨찾기 토글
- **1번**: 채팅 표시/숨기기

### 주요 기능
1. **라이브 시청**: 메인 화면에서 원하는 방송 선택
2. **검색**: 상단 검색창에서 스트리머 이름 입력
3. **즐겨찾기**: 방송 카드의 별 아이콘 클릭 또는 시청 중 0번 버튼

## 🔧 문제 해결

### 설치 실패 시
1. TV 재시작 후 재시도
2. 개발자 모드가 제대로 활성화되었는지 확인
3. 이전 버전이 설치되어 있다면 삭제 후 재설치

### 앱이 실행되지 않을 때
1. TV 설정 → 일반 → 초기화 → 앱 초기화
2. 앱 삭제 후 재설치

### 영상이 재생되지 않을 때
1. 인터넷 연결 확인
2. TV 재시작
3. 앱 캐시 삭제 (설정 → 앱 → Chzzk4LGTV4 → 캐시 삭제)

### 앱 삭제 방법
1. TV 홈 화면에서 앱에 포커스
2. 리모컨 '위' 버튼 길게 누르기
3. 'X' 버튼 선택하여 삭제

## 🔄 업데이트

### 새 버전 확인
- [GitHub Releases](https://github.com/Mnemosyn1154/chzzk4tv4/releases) 페이지 확인

### 업데이트 방법
1. 기존 앱 삭제 (선택사항)
2. 새 IPK 파일 다운로드
3. 위의 설치 방법으로 재설치

## ❓ 자주 묻는 질문

**Q: 개발자 모드는 영구적인가요?**
A: 아니요, TV를 초기화하면 해제됩니다. 50회 재시작 후에도 자동 해제될 수 있습니다.

**Q: 여러 TV에 설치할 수 있나요?**
A: 네, 각 TV에서 개발자 모드를 활성화하면 가능합니다.

**Q: 앱이 느려요.**
A: TV 설정 → 일반 → 초기화 → 캐시 삭제를 시도해보세요.

**Q: 채팅이 보이지 않아요.**
A: 시청 중 리모컨 '1'번 버튼을 눌러 채팅을 활성화하세요.

## 📞 지원

문제가 지속되면 다음으로 문의하세요:
- GitHub Issues: [https://github.com/Mnemosyn1154/chzzk4tv4/issues](https://github.com/Mnemosyn1154/chzzk4tv4/issues)

---

**주의**: 이 앱은 비공식 앱입니다. LG전자 및 네이버와 무관합니다.