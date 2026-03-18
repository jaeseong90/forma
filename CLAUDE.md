# CLAUDE.md

## 프로젝트 개요
FORMA v2 - ERP/업무시스템 AI 활용 개발 프레임워크.
백엔드(Spring Boot REST API)와 프론트(Static HTML/JS)가 완전 분리된 구조.

## 빌드 및 실행
```bash
./gradlew build
./gradlew bootRun  # http://localhost:8080
# H2 콘솔: http://localhost:8080/h2 (jdbc:h2:mem:forma, sa, 비밀번호 없음)
```

## 기술 스택
- Spring Boot 3.4.3, Java 17, MyBatis 3.0.4
- JWT (jjwt), Apache POI, Lombok
- 프론트: Vanilla JS (자체 컴포넌트), Static HTML (빌드도구/프레임워크 없음)
- Thymeleaf 사용하지 않음
- JPA/Hibernate 사용하지 않음

## 패키지 구조
```
com.forma/
├── frame/              # 프레임워크 코어 (수정 금지)
│   ├── annotation/     # @FormaController, @FormaService, @AddUserInfo
│   ├── aop/            # UserInfoAspect
│   ├── base/           # BaseController, BaseService, BaseResponse, ResultCode
│   ├── mybatis/        # FormaSqlSession (Simple + Batch), PrimaryMybatisConfig
│   ├── db/             # PrimaryDataSourceConfig
│   ├── security/       # SecurityConfig, JwtTokenProvider, TokenInterceptor, CookieUtil
│   ├── trace/          # TraceFilter, ServiceTraceAspect, TraceController, TraceEvent, TraceStore, TraceToggleStore
│   ├── sse/            # SseBroadcaster, SseRegistry
│   ├── mvc/            # WebMvcConfig, GlobalExceptionAdvice
│   ├── excel/          # ExcelUtil
│   ├── log/            # FormaLogService, FormaLogType
│   ├── exception/      # FormaException
│   └── util/           # Constants, SeqGenerator, StringUtil
├── common/             # 공통 (PgmController, CodeController, CommonService)
├── login/              # 로그인 (LoginController, LoginService, LoginUserVo)
└── domain/             # 업무 코드 (AI가 생성)
    ├── base/
    │   ├── customer/       # SDA010 거래처관리
    │   └── estimate/       # SDA020 견적템플릿관리
    └── sales/
        ├── order/          # SOA010 수주관리
        └── registration/   # SDB010 수주등록
```

## 프론트엔드 구조
```
static/
├── index.html
├── pages/{module}/{PGMID}.html
└── assets/
    ├── css/forma.css
    └── js/framework/
        ├── forma.core.js      # Listener, platform.post/get, Callback, RESULT_CODE
        ├── forma.grid.js      # FormaGrid (편집, 체크박스, gstat, 정렬, footer, 멀티헤더, frozen, 페이징, CSV)
        ├── forma.form.js      # FormaForm (검색폼/입력폼)
        ├── forma.toolbar.js   # FormaToolbar (권한 기반 버튼바, 단축키)
        ├── forma.tab.js       # FormaTab (탭 전환)
        ├── forma.modal.js     # FormaModal (팝업, fetch로 HTML 로딩)
        ├── forma.popup.js     # FormaPopup.alert/confirm/loading/toast
        └── forma.util.js      # FormaUtil (날짜, 숫자, initSplit)
```

---

## 백엔드 패턴

### Controller
```java
@FormaController(value = "/sda010", pgmId = "SDA010", description = "거래처관리")
@RequiredArgsConstructor
public class Sda010Controller extends BaseController {
    private final Sda010Service service;

    @PostMapping("/selectGrid1")
    public BaseResponse<List<Map<String, Object>>> selectGrid1(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(service.selectGrid1(param));
    }

    @AddUserInfo  // 쓰기 작업에만 — AOP가 Map에 user_id, user_name 자동 주입
    @PostMapping("/saveGrid1")
    public BaseResponse<?> saveGrid1(@RequestBody List<Map<String, Object>> param) {
        service.saveGrid1(param);
        return BaseResponse.Ok(param);
    }
}
```
- BaseResponse.Ok(data), BaseResponse.Warn(msg), BaseResponse.Error(msg)
- GlobalExceptionAdvice: FormaException → WARN, Exception → ERROR 자동 처리

### Service
```java
@FormaService(pgmId = "SDA010", description = "거래처관리")
public class Sda010Service extends BaseService {
    private final FormaSqlSession sql;
    private final String ns = "sda010";

    public Sda010Service(FormaSqlSession sql) { this.sql = sql; }

    public List<Map<String, Object>> selectGrid1(Map<String, Object> param) {
        return sql.selectList(ns + ".selectGrid1", param);
    }

    @Transactional
    public void saveGrid1(List<Map<String, Object>> param) {
        for (Map<String, Object> item : param) {
            if (Constants.GSTAT_INSERT.equals(item.get(Constants.GSTAT))) {
                sql.insert(ns + ".insertGrid1", item);
            } else {
                sql.update(ns + ".updateGrid1", item);
            }
        }
    }
}
```
- FormaSqlSession namespace 기반 호출 (Mapper 인터페이스 없음)
- gstat: "I" = Insert, "U" = Update (프론트 FormaGrid가 관리)
- SeqGenerator.next("ORD") — 채번이 필요한 경우

### MyBatis XML
- 경로: `resources/mapper/domain/{module}/{pgmId소문자}.xml`
- namespace: pgmId 소문자 (sda010, soa010)
```xml
<mapper namespace="sda010">
    <sql id="whereGrid1">
        <if test="cust_cd != null and cust_cd != ''">AND cust_cd LIKE '%' || #{cust_cd} || '%'</if>
    </sql>
    <select id="selectGrid1" parameterType="map" resultType="map">
        SELECT ... FROM tb_customer <where><include refid="whereGrid1"/></where> ORDER BY ...
    </select>
</mapper>
```
- parameterType="map", resultType="map"
- 동적 조건: `<if test="field != null and field != ''">`
- dateRange: `{field}_from`, `{field}_to` 조건으로 분리
- INSERT에 created_by=#{user_id}, created_at=NOW()
- UPDATE에 updated_by=#{user_id}, updated_at=NOW()

---

## 프론트엔드 패턴

### 화면 초기화 흐름
1. 브라우저가 `/pages/{module}/{PGMID}.html` 접근 (정적 파일)
2. `platform.startPage(PGM, listener)` 호출
3. GET `/api/pgm/{PGM}/init` → `{ pgmInfo, pgmAuth }` 획득
4. `FormaToolbar.render('#forma-toolbar', { listener, pgmInfo, pgmAuth })` — 권한 기반 버튼 + 단축키 등록
5. `listener.initPgm()` 실행
6. 이후 업무 로직 (조회/저장/삭제)

### 화면 JS 패턴 (IIFE)
```javascript
(function() {
    const PGM = 'SDA010';
    const listener = platform.initListener(PGM);
    const ctx = {};

    listener.initPgm = function() {
        ctx.searchForm = new FormaForm('#search-area', { search: true, elements: [...] });
        ctx.grid1 = new FormaGrid('#grid-area', { editable: true, checkable: true, columns: [...] });
        listener.button.search.click();
    };

    listener.button.search.click = function() {
        platform.post('/' + PGM.toLowerCase() + '/selectGrid1', ctx.searchForm.getData(), new Callback(function(result) {
            if (result.resultCode === RESULT_CODE.OK) ctx.grid1.setData(result.resultData);
        }));
    };

    document.addEventListener('DOMContentLoaded', () => platform.startPage(PGM, listener));
})();
```

---

## Listener 이벤트 전체 목록

| 카테고리 | 이벤트 | 파라미터 |
|---------|--------|---------|
| button | search/news/save/del/print/upload/init.click | — |
| button | etc1~etc10.click | — |
| button | *.show() / *.hide() | — (런타임 버튼 표시/숨김) |
| gridRow | click | (record, grid, col) |
| gridRow | dblclick | (rowId, colId, record, grid) |
| gridEditor | changed | (grid, state, editor) |
| gridEditor | beforeEditStart | (grid, record, curCol) → return true/false |
| treeGridRow | click / dblclick | (동일) |
| treeGridEditor | changed / beforeEditStart | (동일) |
| tabBar | tabChange | (tab) |
| editor | change | (el) |
| editor | keydown | (el, event) |

---

## FormaGrid

### 옵션
| 옵션 | 타입 | 설명 |
|------|------|------|
| columns | Array | 컬럼 정의 배열 |
| editable | Boolean | 인라인 편집 활성화 (더블클릭) |
| checkable | Boolean | 체크박스 컬럼 |
| sortable | Boolean | 헤더 클릭 정렬 |
| rowNum | Boolean | 행번호 컬럼 |
| paging | Boolean | 페이징 바 표시 |
| pageSize | Number | 페이지 크기 (기본 50) |
| onRowClick | Function | (row, idx) |
| onRowDblClick | Function | (row, idx) |
| onCellChange | Function | (row, field, idx) |
| onPageChange | Function | (page, size) — 서버 페이징 콜백 |

### 컬럼 속성
| 속성 | 타입 | 설명 |
|------|------|------|
| field | String | 데이터 필드명 |
| label | String/Array | 헤더 텍스트. 멀티헤더: [{text, colspan}, {text}] |
| width | Number | 컬럼 너비 (px) |
| type | String | 'number' 등 |
| format | String | 'currency', 'date' |
| editor | String | 'text', 'select', 'check', 'date' |
| options | Array | select용 [{value, label}] |
| code | String | select용 코드 그룹 (서버 조회) |
| frozen | Boolean | 고정 컬럼 (좌측 sticky) |
| readOnly | Boolean | 편집 불가 |
| required | Boolean | checkGridValidation 필수 |
| footer | String | 'sum', 'count', 'avg' |
| align | String | 'left', 'center', 'right' |

### API
| 메서드 | 설명 |
|--------|------|
| setData(data, totalCount?) | 데이터 세팅 (totalCount: 페이징용) |
| getData() | 전체 데이터 반환 |
| getCheckedData() | 체크된 행 반환 (gstat 포함) |
| getModifiedData() | gstat이 I 또는 U인 행 반환 |
| getSelectedItem() | 현재 선택된 행 (없으면 null) |
| getSelectedIndex() | 선택된 행 인덱스 |
| getItem(idx) | 특정 행 데이터 |
| clearData() | 데이터 초기화 |
| addRow(defaults) | 행 추가 (gstat="I") |
| deleteRow() | 체크된/선택된 행 삭제 |
| updateItem(idx, data) | 특정 행 업데이트 (gstat 자동 "U") |
| eachRow(callback) | 전체 행 순회 |
| clearSelect() | 선택 해제 |
| checkGridValidation() | required 컬럼 빈 값 검증 |
| addCellCss(rowIdx, field, css) | 셀별 CSS 추가 |
| removeCellCss(rowIdx, field, css) | 셀별 CSS 제거 |
| addCss(rowIdx, css) | 행별 CSS 추가 |
| removeCss(rowIdx, css) | 행별 CSS 제거 |
| exportCsv(filename) | CSV 다운로드 (BOM, 토스트) |

---

## FormaForm

### 위젯 타입
| widget | 설명 | 속성 |
|--------|------|------|
| text | 텍스트 입력 (기본) | placeholder, readOnly, type='number' |
| number | 숫자 입력 | (text에 type='number') |
| combo | 드롭다운 | options: [{value, label}] |
| date | 날짜 | readOnly |
| dateRange | 기간 (from~to) | default: 'THIS_MONTH', 'TODAY', 'THIS_YEAR' |
| codePopup | 코드 팝업 | popup: {url, codeField, nameField, width, height} |
| textarea | 텍스트영역 | readOnly, rows |
| checkbox | 체크박스 | — |

### API
| 메서드 | 설명 |
|--------|------|
| getData() | 폼 데이터 반환. dateRange는 {field}_from, {field}_to로 분리 |
| setData(obj) | 폼 데이터 세팅 |
| clear() | 전체 초기화 |
| formReadonly(boolean) | 전체 읽기 전용 토글 |

---

## FormaTab

### 생성
```javascript
const tab = new FormaTab('#tab-area', {
    tabs: [
        { id: 'tab-basic', label: '기본정보' },
        { id: 'tab-items', label: '품목명세' },
    ],
    listener: listener,
    onTabChange: function(tabId) { ... }
});
```

### API
| 메서드 | 설명 |
|--------|------|
| selectTab(tabId) / setActiveTab(tabId) | 탭 전환 |
| getActiveTab() | 현재 활성 탭 ID |
| getContentEl(tabId) | 탭 패널 DOM (컴포넌트 삽입용) |
| hideTab(tabId) / showTab(tabId) | 탭 버튼 숨김/표시 |

---

## FormaModal

### 사용법
```javascript
const modal = new FormaModal({
    title: '거래처 검색',
    url: '/pages/popup/CUS_P01.html',
    width: 800, height: 600,
    okCallback: function(result) { ... },
    cancelCallback: function(result) { ... },
});
modal.show(param);
```

### SIZE 프리셋
`FormaModal.SIZE.XS(400x300)`, `S(600x400)`, `M(800x600)`, `L(1000x700)`, `XL(1200x800)`

### 팝업 내부에서
- `modal.ok(result)` — 결과 전달 후 닫기
- `modal.cancel(result)` — 취소 후 닫기

---

## FormaToolbar

권한 기반 버튼바. `tb_pgm_info`의 `srch_yn`, `new_yn`, `save_yn`, `del_yn`, `prnt_yn`, `upld_yn`, `init_yn`에 따라 버튼 표시.

| 버튼 | key | 단축키 |
|------|-----|--------|
| 조회 | search | F3 |
| 신규 | news | F4 |
| 삭제 | del | F5 |
| 저장 | save | F9 |
| 출력 | print | F11 |
| 초기화 | init | F12 |
| 업로드 | upload | — |
| 커스텀 | etc1~etc10 | — |

커스텀 버튼: `tb_pgm_info.etc_desc1~etc_desc5`에 라벨 지정.
런타임 버튼 제어: `listener.button.etc1.show()`, `listener.button.etc1.hide()`

---

## FormaPopup

| API | 설명 |
|-----|------|
| FormaPopup.alert.show(msg) | 알림 (Promise 반환) |
| FormaPopup.confirm.show(msg, callback) | 확인/취소 (callback(true/false)) |
| FormaPopup.loading.show() / .hide() | 로딩 오버레이 |
| FormaPopup.toast.success(msg) | 성공 토스트 (3초) |
| FormaPopup.toast.error(msg) | 에러 토스트 |
| FormaPopup.toast.info(msg) | 정보 토스트 |

---

## FormaUtil

| API | 설명 |
|-----|------|
| FormaUtil.today() | 오늘 날짜 'YYYY-MM-DD' |
| FormaUtil.formatCurrency(val) | 숫자 → 천단위 콤마 |
| FormaUtil.formatDate(val) | 날짜 → 'YYYY-MM-DD' |
| FormaUtil.isEmpty(v) / isNotEmpty(v) | null/undefined/'' 체크 |
| FormaUtil.initSplit(selector) | Split 패널 드래그 초기화 |
| getCodeItems(grpCode) | 코드 그룹 조회 (비동기, 캐시) |

---

## 네이밍 규칙
| 대상 | 규칙 | 예시 |
|------|------|------|
| 패키지 | `com.forma.domain.{module}.{sub}` | `com.forma.domain.base.customer` |
| Controller | `{PgmId}Controller.java` | `Sda010Controller.java` |
| Service | `{PgmId}Service.java` | `Sda010Service.java` |
| MyBatis XML | `mapper/domain/{module}/{pgmId소문자}.xml` | `mapper/domain/base/sda010.xml` |
| namespace | pgmId 소문자 | `sda010` |
| 화면 HTML | `static/pages/{module}/{PGMID}.html` | `pages/base/SDA010.html` |
| API 경로 | `/{pgmId소문자}/{action}` | `/sda010/selectGrid1` |
| SQL 테이블 | `tb_{snake_case}` | `tb_customer` |
| SQL 컬럼 | snake_case | `cust_cd`, `created_at` |
| 코드 그룹 | UPPER_SNAKE | `CUST_TYPE` |

---

## 화면 유형별 패턴

### list — 단순 목록 (SDA010 거래처관리)
검색폼 + 편집 가능 그리드. gstat 기반 I/U 분기 저장.
```
[검색폼] → [그리드 (editable, checkable)]
```

### split-detail — 좌우분할 마스터-디테일 (SDA020 견적템플릿관리)
좌측 마스터 그리드 클릭 → 우측 디테일 그리드 로딩.
```
[검색폼]
[좌측 마스터 그리드 | 우측 디테일 그리드 (editable)]
```
`FormaUtil.initSplit('#split-area')` 필수.

### master-detail — 상하 마스터-디테일 + 입력폼 (SOA010 수주관리)
상단 마스터 그리드 + 중간 입력폼 + 하단 디테일 그리드.
```
[검색폼]
[마스터 그리드]
[입력 폼 (row 클릭 시 표시)]
[디테일 그리드 (editable)]
```

### split-tab — 좌우분할 + 탭 복합 (SDB010 수주등록)
좌측 목록 그리드 + 우측 FormaTab (기본정보폼 + 품목그리드 + 이력그리드).
```
[검색폼]
[좌측 목록 그리드 | 우측 Tab[기본정보|품목명세|수주이력]]
```

---

## SQL 구조
```
resources/schema/
├── 01-tables.sql    # DDL (CREATE TABLE)
├── 02-codes.sql     # 코드 마스터 데이터
├── 03-samples.sql   # 샘플 업무 데이터
└── 04-pgm.sql       # PGM 정보
```

---

## AI 코드 생성 워크플로

### 새 화면 추가 시
1. `design/screens/{화면ID}.yml` 설계서 읽기
2. `design/_schema_guide.yml`에서 스키마 규칙 참조
3. 화면 type에 따라 생성:
   - **list** → Controller + Service + Mapper XML + HTML(검색폼+그리드)
   - **master-detail** → Controller + Service + Mapper XML + HTML(검색폼+마스터+입력폼+디테일)
   - **split-detail** → Controller + Service + Mapper XML + HTML(Split+좌측그리드+우측그리드)
   - **split-tab** → Controller + Service + Mapper XML + HTML(Split+좌측그리드+우측Tab)
4. `schema/01-tables.sql`에 DDL 추가 (필요 시)
5. `schema/04-pgm.sql`에 PGM_INFO INSERT 추가
6. `index.html`에 링크 추가

### 기존 화면 수정 시
1. 설계서 변경 내용 확인
2. 영향받는 파일만 수정 (전체 재생성 아님)
3. Mapper XML 수정 시 SQL 문법 주의 (H2 기준, DB 독립성 고려)
