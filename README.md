# FORMA

**YAML 1파일로 ERP 화면을 완성하는 업무시스템 개발 프레임워크**

FORMA는 Controller, Service, Mapper, HTML 없이 YAML 설계서 하나만 작성하면 완전한 CRUD 화면이 런타임에 생성되는 ERP 개발 프레임워크입니다. 복잡한 비즈니스 로직이 필요한 화면은 커스텀 코드로 확장할 수 있습니다.

## Quick Start

```bash
git clone https://github.com/jaeseong90/forma.git
cd forma
./gradlew bootRun
```

- **개발자 포털**: http://localhost:8081
- **ERP 메인**: http://localhost:8081/login.html (admin / 빈 비밀번호)
- **H2 콘솔**: http://localhost:8081/h2 (jdbc:h2:mem:forma, sa)

## YAML = 화면

```yaml
screen:
  id: MMA010
  name: 품목관리
  type: list

search:
  - { field: item_nm, label: 품목명, widget: text }

grids:
  grid1:
    editable: true
    checkable: true
    columns:
      - { field: ITEM_CD, label: 품목코드, width: 100 }
      - { field: ITEM_NM, label: 품목명, width: 200, editor: text }
      - { field: UNIT_PRICE, label: 단가, width: 120, editor: currency }

sql:
  tables:
    - { name: tb_item }
```

이 파일 하나로 검색폼, 데이터 그리드, SELECT/INSERT/UPDATE/DELETE SQL, 서버 페이징, 데이터 권한, 감사 로그가 전부 자동 생성됩니다.

## 지원 레이아웃

| 타입 | 설명 | 예시 |
|------|------|------|
| `list` | 검색폼 + 편집 그리드 | 거래처관리, 품목관리 |
| `split-detail` | 좌측 마스터 + 우측 디테일 | 견적템플릿관리 |
| `master-detail` | 마스터 그리드 + 입력폼 + 디테일 그리드 | 수주관리 |

## 주요 기능

### 프레임워크 코어
- **YAML 런타임 엔진** — YAML 1파일 = 완성 화면 (코드 생성 불필요)
- **3계층 권한** — 역할-메뉴(버튼단위)-데이터(부서/사용자) 권한
- **SPA MDI** — iframe 없는 div 기반 멀티탭, 메모리 효율적
- **JWT 인증** — 쿠키 기반 토큰, 자동 갱신 (잔여 6시간 미만 시)
- **감사 로그** — INSERT/UPDATE/DELETE 자동 추적, Before/After JSON 비교
- **서비스 트레이스** — 메서드 실행시간 모니터링, 1초 초과 경고
- **서버 페이징** — LIMIT/OFFSET 기반, 프론트 그리드 연동
- **데이터 권한** — ALL/DEPT/DEPT_SUB/USER 자동 SQL 주입

### 프론트엔드 컴포넌트
- **FormaGrid** — 인라인 편집 8종, 셀 병합, 트리, 가상 스크롤, 그룹핑, 키보드, 클립보드, Undo
- **FormaForm** — 21종 위젯 (text, combo, date, currency, codePopup, switch 등)
- **FormaToolbar** — 권한 기반 버튼바, F3~F12 단축키 자동 등록
- **FormaModal** — 팝업 (중첩 지원, 드래그 이동, ESC 닫기)
- **FormaMenu** — 트리 메뉴, 즐겨찾기, 우클릭 추가
- **FormaChart** — SVG 차트 5종 (bar/line/pie/donut/hbar)

### 운영 도구
- **시스템 관리 UI** — 사용자/역할/메뉴 관리 (SQL 없이 UI에서)
- **감사로그 뷰어** — 변경 이력 조회, 서비스 트레이스
- **XLSX 서버 다운로드** — Apache POI SXSSF 스트리밍 (대량 데이터)
- **공통 팝업** — 거래처 검색, 품목 검색 (확장 가능)
- **개인 설정** — 테마, 메뉴 접힘 상태 서버 저장
- **파일 첨부** — 업로드/다운로드/삭제

## Tech Stack

| 영역 | 기술 |
|------|------|
| Backend | Spring Boot 3.4.3, Java 17, MyBatis 3 |
| Auth | JWT (jjwt), BCrypt |
| DB | H2 (개발) / MySQL / PostgreSQL (프로덕션) |
| Frontend | Vanilla JS (빌드 도구 없음), Static HTML |
| Excel | Apache POI (SXSSF 스트리밍) |
| Deploy | Docker, Gradle |

## 프로젝트 구조

```
com.forma/
├── frame/          # 프레임워크 코어 (수정 금지)
│   ├── screen/     # YAML 런타임 엔진
│   ├── security/   # JWT, 인터셉터
│   ├── auth/       # 데이터 권한
│   ├── audit/      # 감사 로그
│   ├── excel/      # XLSX 다운로드
│   └── ...
├── common/         # 공통 API (코드, 팝업, 관리자, 설정)
├── login/          # 로그인/인증
└── domain/         # 업무 코드 (커스텀 화면)

static/
├── index.html      # 개발자 포털
├── login.html      # 로그인
├── main.html       # ERP 메인 (MDI)
├── pages/screen.html  # YAML 엔진 렌더러
└── assets/js/framework/  # 프론트 컴포넌트 (12개)

design/screens/     # YAML 화면 설계서
```

## Docker

```bash
# 기본 (H2 인메모리)
docker compose up -d

# MySQL 연동
docker compose --profile mysql up -d
```

## 프로덕션 배포

```bash
# JAR 빌드
./gradlew bootJar

# MySQL 프로필로 실행
java -jar build/libs/forma-0.2.0.jar \
  --spring.profiles.active=mysql \
  --DB_URL=jdbc:mysql://db-host:3306/forma \
  --DB_USER=forma \
  --DB_PASS=secret \
  --FORMA_JWT_SECRET=your-secure-random-string
```

## 새 화면 만들기

### 방법 A: YAML (단순 CRUD)

`design/screens/` 에 YAML 파일을 추가하면 서버 재시작 없이 `/api/screen/_reload` 호출로 즉시 반영됩니다.

### 방법 B: 커스텀 코드 (복잡 로직)

```
src/main/java/com/forma/domain/{module}/{sub}/
  {PgmId}Controller.java
  {PgmId}Service.java
src/main/resources/mapper/domain/{module}/{pgmId}.xml
src/main/resources/static/pages/{module}/{PGMID}.html
```

## License

MIT
