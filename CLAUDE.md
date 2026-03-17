# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요
FORMA - ERP/업무시스템 AI 활용 개발 프레임워크.
설계서(YAML) 기반으로 AI가 코드를 생성하고, 개발자가 수정하는 구조.

## 빌드 및 실행

```bash
./gradlew build          # 빌드
./gradlew bootRun        # 실행 (http://localhost:8081)
./gradlew test           # 테스트
./gradlew test --tests "com.forma.domain.sales.order.SalesOrderServiceTest"  # 단일 테스트
# H2 콘솔: http://localhost:8081/h2 (JDBC URL: jdbc:h2:mem:forma, user: sa, 비밀번호 없음)
```

- Gradle 8.5, Java 17, Spring Boot 3.4.3, MyBatis 3.0.4
- DDL은 `src/main/resources/schema.sql`에 작성하면 기동 시 자동 실행
- MyBatis 설정: `map-underscore-to-camel-case: true` (DB snake_case → 자동 camelCase)

## 기술 스택 제약
- **DB**: MyBatis (기본) + JdbcTemplate (단순 CRUD). JPA/Hibernate 사용 금지
- **Frontend**: Vanilla JS만 사용. React/Vue/빌드도구 사용 금지
- **Lombok 사용 금지** - getter/setter 직접 작성
- **외부 UI 라이브러리 금지** - FormaGrid/FormaSearch/FormaForm 등 자체 컴포넌트 사용

## 아키텍처

### Service 패턴 선택 (중요)

```
대부분의 업무 화면 (90%): MyBatis Mapper
  → 복잡한 JOIN, 서브쿼리, 동적 조건, 집계
  → Service + Mapper 인터페이스 + Mapper XML

단순 기준정보 CRUD (10%): BaseService
  → 단일 테이블, 검색 2-3개
  → BaseService 상속
```

**판단 기준**: 설계서에 `sql` 섹션이 있거나, 2개 이상 JOIN, 5개 이상 검색조건, 집계/리포트 → MyBatis.
확신이 안 서면 MyBatis를 쓴다.

### MyBatis 패턴 (기본)

**파일 구조:**
```
domain/{모듈}/{기능}/
  ├── {Entity}Controller.java   # REST API
  ├── {Entity}Service.java      # 비즈니스 로직 (Mapper 주입)
  └── {Entity}Mapper.java       # @Mapper 인터페이스
resources/mapper/{모듈}/
  └── {Entity}Mapper.xml        # SQL (AI가 생성)
```

**Service 패턴:**
```java
@Service
public class SalesOrderService {
    private final SalesOrderMapper mapper;
    private final SeqGenerator seq;

    public PageResult<Map<String, Object>> list(Map<String, String> search) {
        int page = Integer.parseInt(search.getOrDefault("_page", "1"));
        int size = Integer.parseInt(search.getOrDefault("_size", "50"));
        int offset = (page - 1) * size;
        int total = mapper.count(search);
        List<Map<String, Object>> data = mapper.list(search, size, offset);
        return PageResult.of(data, total, page, size);
    }
}
```

**Mapper 인터페이스:**
```java
@Mapper
public interface SalesOrderMapper {
    int count(@Param("search") Map<String, String> search);
    List<Map<String, Object>> list(@Param("search") Map<String, String> search,
                                    @Param("limit") int limit, @Param("offset") int offset);
    Map<String, Object> get(@Param("orderNo") String orderNo);
    int exists(@Param("orderNo") String orderNo);
    void insert(Map<String, Object> data);
    void update(Map<String, Object> data);
    void delete(@Param("orderNo") String orderNo);
}
```

**Mapper XML 패턴:**
- `<sql id="whereCondition">` 로 공통 WHERE 조건 분리, count/list에서 `<include refid="whereCondition"/>` 재사용
- 검색조건: `<if test="search.field != null and search.field != ''">` 로 동적 분기
- multi combo: `<foreach collection="search.status.split(',')" item="s">` 로 IN절
- LIKE 검색: `CONCAT('%', #{search.cust_nm}, '%')`

### BaseService 패턴 (단순 CRUD용)

`common/base/`의 BaseController/BaseService를 상속. `service()`, `jdbc()`, `table()`, `pk()`, `selectColumns()`, `appendWhere()` 구현으로 CRUD 자동 완성.

### Controller 패턴
MyBatis 사용 시 BaseController를 상속하지 않고 직접 엔드포인트를 정의한다.
기본 엔드포인트: GET(list), GET/{id}(get), POST(save), DELETE/{id}(delete)

### 감사 필드
INSERT 시 `created_by`, `created_at`, `updated_by`, `updated_at` 세팅.
UPDATE 시 `updated_by`, `updated_at` 세팅.
현재 사용자: `AuthContext.getCurrentUser()` (미인증 시 "system")

### 데이터 흐름
모든 데이터는 `Map<String, Object>`로 전달.
- API 응답: `ApiResponse<T>` (`{ success, data, message }`)
- 목록 응답: `PageResult<T>` (`{ data, total, page, size }`)

### Frontend 구조
`/static/forma/forma.js` 하나에 모든 공통 컴포넌트 포함:

**FormaApi** - fetch 래퍼 (get/post/del), 로딩 인디케이터 자동 표시

**FormaGrid** - ERP 수준 데이터 그리드:
- 옵션: `columns`, `editable`, `onSelect`, `onCellChange`, `onSort`, `onPageChange`, `defaultSort`, `pageSize`
- features: `['addRow', 'deleteRow', 'export', 'checkbox', 'rowNum']`
- 정렬, 페이징, 체크박스, CSV 내보내기, 더블클릭 편집, 컬럼 리사이즈, frozen 컬럼
- `getModifiedRows()`, `getCheckedRows()`, `exportCsv()`

**FormaSearch** - 검색바 (text/combo/dateRange/codePopup, 접기/펼치기, 초기화)

**FormaForm** - 입력 폼 빌더

**FormaToast** - `FormaToast.success/error/info('메시지')`

**FormaDialog** - `await FormaDialog.confirm('확인?')`, `await FormaDialog.alert('알림')`

## 설계서 기반 코드 생성 워크플로

### 새 화면 추가 시:
1. `design/screens/{화면ID}.yml` 읽기
2. `design/_entities.yml`에서 entity 정의 참조
3. 생성 파일 (MyBatis 기준):
   - `src/main/java/com/forma/domain/{모듈}/{기능}/{Entity}Controller.java`
   - `src/main/java/com/forma/domain/{모듈}/{기능}/{Entity}Service.java`
   - `src/main/java/com/forma/domain/{모듈}/{기능}/{Entity}Mapper.java`
   - `src/main/resources/mapper/{모듈}/{Entity}Mapper.xml`
   - `src/main/resources/static/pages/{모듈}/{화면ID}.html`
   - `src/main/resources/static/pages/{모듈}/{화면ID}.js`
   - `src/main/resources/schema/{entity}.sql` (DDL)
4. 설계서 `sql` 섹션의 joins/extraColumns 참조하여 Mapper XML 생성
5. 설계서 `notes` 섹션은 자연어 지시이므로 로직에 반영

### 검색조건 → Mapper XML 변환 규칙:
- text → `<if>` + `LIKE CONCAT('%', #{search.field}, '%')`
- combo (단일) → `<if>` + `= #{search.field}`
- combo (multi) → `<if>` + `<foreach>` IN절
- dateRange → `<if>` + `>= #{search.field_from}` / `<= #{search.field_to}`
- codePopup → `<if>` + `= #{search.field}`

### Grid 컬럼 속성 규칙:
- format: currency → align: 'right' 자동 적용
- format: badge → code 속성 필수
- frozen: true → 좌측 고정
- auto: true → 자동 순번

## 네이밍 규칙
- **패키지**: `com.forma.domain.{모듈}.{기능}`
- **Mapper XML**: `resources/mapper/{모듈}/{Entity}Mapper.xml`
- **SQL 테이블**: `tb_{snake_case}` (`tb_sales_order`)
- **SQL 컬럼**: snake_case (`order_no`)
- **화면 ID**: `{모듈약어}-{3자리순번}` (`ORD-001`)
- **API 경로**: `/api/{도메인-케밥}` (`/api/sales-order`)
- **코드 그룹**: UPPER_SNAKE (`ORD_STATUS`)
- 모든 쓰기 메서드에 `@Transactional`
- 비즈니스 예외는 `BusinessException("사용자 메시지")`
