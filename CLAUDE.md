# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요
FORMA - ERP/업무시스템 AI 활용 개발 프레임워크.
설계서(YAML) 기반으로 AI가 코드를 생성하고, 개발자가 수정하는 구조.

## 빌드 및 실행

```bash
# 빌드
./gradlew build

# 실행 (http://localhost:8080)
./gradlew bootRun

# 테스트
./gradlew test

# 단일 테스트 클래스
./gradlew test --tests "com.forma.domain.sales.order.SalesOrderServiceTest"

# H2 콘솔: http://localhost:8080/h2 (JDBC URL: jdbc:h2:mem:forma, user: sa, 비밀번호 없음)
```

- Gradle 8.5, Java 17, Spring Boot 3.4.3
- DDL은 `src/main/resources/schema.sql`에 작성하면 기동 시 자동 실행

## 기술 스택 제약 (엄수)
- **DB**: Spring JdbcTemplate만 사용. JPA/MyBatis/Hibernate 사용 금지
- **Frontend**: Vanilla JS만 사용. React/Vue/빌드도구 사용 금지
- **의존성**: spring-boot-starter-web, spring-boot-starter-jdbc, H2 외 추가 금지
- **Lombok 사용 금지** - getter/setter 직접 작성
- **외부 UI 라이브러리 금지** - FormaGrid/FormaSearch/FormaForm/FormaPopup 등 자체 컴포넌트 사용

## 아키텍처

### 핵심 구조: BaseController / BaseService 상속 패턴
모든 도메인 코드는 `common/base/`의 베이스 클래스를 상속하여 CRUD가 자동 완성되는 구조.

**BaseController** (`common/base/BaseController.java`):
- `service()` 추상 메서드만 구현하면 GET(list/get), POST(save), DELETE 엔드포인트 자동 제공
- 커스텀 엔드포인트(master-detail의 `/save-all` 등)만 서브클래스에 추가

**BaseService** (`common/base/BaseService.java`):
- 추상 메서드: `jdbc()`, `table()`, `pk()`, `selectColumns()`
- `appendWhere()` 오버라이드로 검색조건 구현
- `list()`는 `_page`, `_size`, `_sort` 파라미터를 자동 처리 (LIMIT/OFFSET 페이징)
- `save()`는 PK 존재 여부로 INSERT/UPDATE 자동 판별, 감사 필드 자동 세팅
- `validateBeforeSave()`: 저장 전 검증 훅 (서브클래스에서 오버라이드)
- `joins()`: LEFT JOIN 선언 (lookup 필드가 있는 경우 오버라이드)
- `replaceChildren()`: 마스터-디테일 저장 시 자식 테이블 전삭 후 재입력 패턴
- `mergeChildren()`: _status(C/U/D) 기반 분기 저장 패턴

### JOIN 패턴
lookup 필드가 있는 Service에서 `joins()`를 오버라이드하면 list()/get()에 자동 LEFT JOIN 적용:
```java
@Override protected String selectColumns() { return "t.*, c.cust_nm"; }
@Override protected String[] joins() {
    return new String[] { "tb_customer c ON t.cust_cd = c.cust_cd" };
}
```

### 감사 필드 자동화
`audit()` 기본값 true. save() 호출 시 자동으로:
- INSERT: `created_by`, `created_at`, `updated_by`, `updated_at` 세팅
- UPDATE: `updated_by`, `updated_at` 세팅
- 현재 사용자: `AuthContext.getCurrentUser()` (미인증 시 "system")

### mergeChildren 패턴
프론트에서 `_status` 필드로 행 변경 상태를 전달:
```javascript
// _status: "C" (신규), "U" (수정), "D" (삭제), 없으면 변경 없음
FormaApi.post('/api/sales-order/save-all', {
    master: {...},
    items: grid.getModifiedRows().map(r => ({...r, _status: r._isNew ? 'C' : 'U'}))
});
```

### AuthContext
`AuthContext` (`common/util/AuthContext.java`): ThreadLocal 기반 현재 사용자 정보
- `AuthContext.getCurrentUser()` - 현재 사용자 ID (기본 "system")
- `AuthContext.hasRole("ROLE_ADMIN")` - 권한 체크

### 데이터 흐름
모든 데이터는 `Map<String, Object>`로 전달 (타입 매핑 없음).
- API 응답: `ApiResponse<T>` 래퍼 (`{ success, data, message }`)
- 목록 응답: `PageResult<T>` (`{ data, total, page, size }`)

### Frontend 구조
`/static/forma/forma.js` 하나에 모든 공통 컴포넌트 포함:

**FormaApi** - fetch 래퍼 (get/post/del), API 호출 시 로딩 인디케이터 자동 표시

**FormaGrid** - ERP 수준 데이터 그리드:
- 옵션: `columns`, `editable`, `onSelect`, `onCellChange`, `onSort`, `onPageChange`, `defaultSort`, `pageSize`
- features: `['addRow', 'deleteRow', 'export', 'checkbox', 'rowNum']`
- 정렬: 헤더 클릭 ASC→DESC→없음 순환, `_sort` 파라미터로 서버 재조회
- 페이징: 하단 페이징바 (페이지 번호, 사이즈 선택 20/50/100, 총 건수)
- 체크박스: `getCheckedRows()` 로 체크된 행 반환
- 엑셀: `exportCsv()` CSV 내보내기 (BOM, format 적용)
- 편집: 더블클릭 편집 진입, Tab/Enter 다음 셀, ESC 취소, 변경 행 좌측 초록 바
- `getModifiedRows()`: 변경된 행 반환
- 컬럼 리사이즈: 헤더 우측 드래그 (최소 50px)
- frozen 컬럼: `frozen: true` → `position: sticky` 좌측 고정

**FormaSearch** - 검색바:
- 위젯: `text`, `combo`, `dateRange`, `codePopup`
- codePopup: 입력+돋보기 버튼, FormaPopup 연동, Tab 시 자동 조회
- dateRange 기본값: `THIS_MONTH`, `TODAY`, `THIS_YEAR`
- 초기화 버튼 내장
- 5개 이상 검색조건 시 상세 접기/펼치기 자동 적용

**FormaForm** - 입력 폼 빌더

**FormaPopup** - 코드 검색 팝업

**FormaToast** - 토스트 메시지:
```javascript
FormaToast.success('저장되었습니다');
FormaToast.error('오류가 발생했습니다');
FormaToast.info('처리 중입니다');
```

**FormaDialog** - 모달 다이얼로그 (Promise 반환):
```javascript
const ok = await FormaDialog.confirm('삭제하시겠습니까?');
if (ok) { /* 삭제 처리 */ }
await FormaDialog.alert('완료되었습니다');
```

**FormaPage** - 페이지 헬퍼 (`confirm`/`alert`은 FormaDialog 사용)

화면 JS는 `page` 객체에 모든 것을 담고, `DOMContentLoaded`에서 `page.init()` 호출.

## 설계서 기반 코드 생성 워크플로

### 새 화면 추가 시:
1. `design/screens/{화면ID}.yml` 읽기
2. `design/_entities.yml`에서 entity 정의 참조
3. 생성 파일:
   - `src/main/java/com/forma/domain/{모듈}/{기능}/{Entity}Controller.java`
   - `src/main/java/com/forma/domain/{모듈}/{기능}/{Entity}Service.java`
   - `src/main/resources/static/pages/{모듈}/{화면ID}.html`
   - `src/main/resources/static/pages/{모듈}/{화면ID}.js`
   - `src/main/resources/schema/{entity}.sql` (DDL)
4. 설계서 `notes` 섹션은 자연어 지시이므로 로직에 반영

### 검색조건 → appendWhere 변환 규칙:
- text → `LIKE '%value%'`
- combo (단일) → `= ?`
- combo (multi: true) → `IN (?, ?, ...)`
- dateRange → `{field}_from >= ?`, `{field}_to <= ?`
- codePopup → `= ?`

### Grid 컬럼 속성 규칙:
- format: currency → align: 'right' 자동 적용
- format: badge → code 속성 필수
- frozen: true → 좌측 고정 (position: sticky)
- link: '{화면ID}' → 클릭 시 해당 화면으로 이동
- auto: true → 자동 순번 (seq 필드)
- readOnly: true → 편집 불가 (editable 모드에서도)

## 네이밍 규칙
- **패키지**: `com.forma.domain.{모듈}.{기능}`
- **클래스**: PascalCase (`SalesOrderService`)
- **메서드**: camelCase (`saveWithItems`)
- **SQL 테이블**: `tb_{snake_case}` (`tb_sales_order`)
- **SQL 컬럼**: snake_case (`order_no`)
- **화면 ID**: `{모듈약어}-{3자리순번}` (`ORD-001`, `CUS-001`)
- **API 경로**: `/api/{도메인-케밥}` (`/api/sales-order`)
- **코드 그룹**: UPPER_SNAKE (`ORD_STATUS`, `CUST_TYPE`)
- 모든 쓰기 메서드에 `@Transactional`
- 비즈니스 예외는 `BusinessException("사용자 메시지")`
