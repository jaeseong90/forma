# CLAUDE.md

## 프로젝트 개요
FORMA v2 - ERP/업무시스템 AI 활용 개발 프레임워크.
백엔드(Spring Boot REST API)와 프론트(Static HTML/JS)가 완전 분리된 구조.

## 빌드 및 실행
```bash
./gradlew build
./gradlew bootRun  # http://localhost:8081
# H2 콘솔: http://localhost:8081/h2 (jdbc:h2:mem:forma, sa, 비밀번호 없음)
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
│   ├── auth/           # DataAuthContext, DataAuthService (데이터 권한)
│   ├── audit/          # AuditLogAspect, AuditLogEntry, AuditLogService (감사 로그)
│   ├── base/           # BaseController, BaseService, BaseResponse, ResultCode
│   ├── mybatis/        # FormaSqlSession (Simple + Batch + 데이터권한 자동주입)
│   ├── db/             # PrimaryDataSourceConfig
│   ├── security/       # SecurityConfig, JwtTokenProvider, TokenInterceptor, CookieUtil
│   ├── screen/         # YAML 런타임 엔진 — ScreenRegistry, DynamicSqlExecutor, GenericCrudController
│   ├── screen/model/   # ScreenDefinition (YAML 파싱 모델)
│   ├── file/           # FileController, FileService (파일 첨부)
│   ├── trace/          # TraceFilter, ServiceTraceAspect, TraceStore
│   ├── mvc/            # WebMvcConfig (인터셉터 등록), GlobalExceptionAdvice
│   ├── excel/          # ExcelController, ExcelService (XLSX 서버사이드 다운로드)
│   ├── log/            # FormaLogService, FormaLogType
│   ├── exception/      # FormaException
│   └── util/           # Constants, SeqGenerator, OptimisticLockUtil
├── common/             # 공통 (PgmController, CodeController, CommonService, PopupController, UserSettingsController, AdminController)
├── login/              # 로그인 (LoginController, LoginService, LoginUserVo)
└── domain/             # 업무 코드 (AI가 생성하거나 YAML로 대체)
    ├── base/
    │   ├── customer/       # SDA010 거래처관리
    │   └── estimate/       # SDA020 견적템플릿관리
    ├── material/
    │   └── item/           # MMA010 품목관리
    └── sales/
        ├── order/          # SOA010 수주관리
        └── registration/   # SDB010 수주등록
```

## 프론트엔드 구조
```
static/
├── login.html                # 로그인 페이지
├── main.html                 # ERP 메인 (좌측 메뉴 + MDI 탭)
├── index.html                # 개발자 포털
├── pages/screen.html         # YAML 엔진 제네릭 화면 (list/split-detail/master-detail 지원)
├── pages/{module}/{PGMID}.html  # 커스텀 화면
├── pages/popup/              # 공통 팝업 (CUS_P01 거래처검색, ITM_P01 품목검색)
├── pages/admin/              # 관리자 화면 (SYS010 감사로그/트레이스)
├── pages/dev/                # 데모 페이지 (GRID_DEMO, FORM_DEMO, COMP_DEMO, FRAMEWORK_DEMO, AI_GUIDE)
└── assets/
    ├── css/forma.css          # CSS 변수 기반 테마
    └── js/framework/
        ├── forma.core.js      # platform.post/get (Promise/async), Listener, RESULT_CODE
        ├── forma.grid.js      # FormaGrid (에디터8종, 셀병합, 트리, 가상스크롤, 그룹핑, 키보드, 클립보드, Undo 등)
        ├── forma.form.js      # FormaForm (21종 위젯, 위젯 패턴 아키텍처, destroy, isDirty)
        ├── forma.toolbar.js   # FormaToolbar (권한 기반 버튼바, 단축키)
        ├── forma.tab.js       # FormaTab (탭 전환, hideTab/showTab)
        ├── forma.modal.js     # FormaModal (팝업, fetch HTML, SIZE 프리셋)
        ├── forma.popup.js     # FormaPopup.alert/confirm/loading/toast
        ├── forma.util.js      # FormaUtil (40+개 유틸 — 날짜/숫자/문자열/배열/검증/코드캐시 + Split 패널)
        ├── forma.mdi.js       # FormaMdi (SPA MDI — iframe 없음, div 기반 탭 관리)
        ├── forma.menu.js      # FormaMenu (좌측 트리 메뉴, 즐겨찾기, 우클릭 즐겨찾기 추가)
        ├── forma.i18n.js      # FormaI18n (다국어 ko/en/ja/zh)
        ├── forma.theme.js     # FormaTheme (light/dark/blue, CSS 변수 기반)
        └── forma.chart.js     # FormaChart (SVG 차트 5종: bar/line/pie/donut/hbar)
```

## 권한 체계 (3계층)

### 테이블 구조
```
tb_dept        부서 (트리, parent_code)
tb_role        역할 (ADMIN/MANAGER/USER/VIEWER)
tb_user_role   사용자↔역할 (N:N)
tb_menu        메뉴 (트리, pgm_id 연결)
tb_role_menu   역할↔메뉴 버튼 권한 (srch/new/save/del/prnt/upld/init)
tb_data_auth   데이터 권한 (ALL/DEPT/DEPT_SUB/USER/CUSTOM)
```

### 데이터 권한 타입
| auth_type | 설명 | SQL 조건 |
|-----------|------|---------|
| ALL | 전체 | (없음) |
| DEPT | 본인 부서 | `AND dept_code = #{_userDept}` |
| DEPT_SUB | 본인+하위 | `AND dept_code IN (하위부서 목록)` |
| USER | 본인만 | `AND created_by = #{_userId}` |

## 서버 페이징/정렬 패턴

### 요청
```json
{ "keyword": "삼성", "page": 1, "pageSize": 50, "sortField": "order_date", "sortDir": "desc" }
```

### Controller
```java
@PostMapping("/selectGrid1")
public BaseResponse<Map<String, Object>> selectGrid1(@RequestBody Map<String, Object> param) {
    int page = (int) param.getOrDefault("page", 1);
    int pageSize = (int) param.getOrDefault("pageSize", 50);
    param.put("_offset", (page - 1) * pageSize);
    Map<String, Object> result = new HashMap<>();
    result.put("data", service.selectGrid1(param));
    result.put("totalCount", service.selectGrid1Count(param));
    return BaseResponse.Ok(result);
}
```

### MyBatis XML
```xml
<select id="selectGrid1" parameterType="map" resultType="map">
    SELECT * FROM tb_sales_order
    <where><include refid="whereGrid1"/></where>
    <if test="sortField != null">ORDER BY ${sortField} ${sortDir}</if>
    <if test="page != null">LIMIT #{pageSize} OFFSET #{_offset}</if>
</select>
<select id="selectGrid1Count" parameterType="map" resultType="int">
    SELECT COUNT(*) FROM tb_sales_order
    <where><include refid="whereGrid1"/></where>
</select>
```

### 프론트 (onPageChange)
```javascript
ctx.grid1 = new FormaGrid('#grid-area', {
    paging: true, pageSize: 50,
    onPageChange: function(page, size) {
        loadGrid1(page, size);
    }
});
function loadGrid1(page, size) {
    platform.post('/soa010/selectGrid1', {
        ...ctx.searchForm.getData(), page, pageSize: size
    }, new Callback(function(result) {
        ctx.grid1.setData(result.resultData.data, result.resultData.totalCount);
    }));
}
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
| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| columns | Array | [] | 컬럼 정의 배열 |
| editable | Boolean | false | 인라인 편집 (더블클릭/Enter/F2) |
| checkable | Boolean | false | 체크박스 컬럼 |
| sortable | Boolean | false | 헤더 클릭 정렬 |
| rowNum | Boolean | false | 행번호 컬럼 |
| reorderable | Boolean | false | 드래그 행 순서 변경 (≡ 핸들) |
| filterable | Boolean | false | 헤더 아래 필터행 |
| paging | Boolean | false | 페이징 바 |
| pageSize | Number | 50 | 페이지 크기 |
| virtualScroll | Boolean | false | 가상 스크롤 (대량 데이터) |
| height | Number | 400 | virtualScroll 시 높이 (px) |
| groupBy | String | null | 그룹핑 필드명 |
| groupFooter | Boolean | false | 그룹별 소계 |
| treeField | String | null | 트리 표시 컬럼 |
| treeIdField | String | 'id' | 트리 노드 ID 필드 |
| treeParentField | String | 'parent_id' | 트리 부모 ID 필드 |
| rowDetail | Function | null | 멀티행 서브행 (row, idx) → Array |
| detailGrid | Function | null | 마스터-디테일 (row, container, idx) |
| onRowClick | Function | null | (row, idx) |
| onRowDblClick | Function | null | (row, idx) |
| onCellChange | Function | null | (row, field, idx) |
| onPageChange | Function | null | (page, size) — 서버 페이징 |
| onRowReorder | Function | null | (from, to, row) |

### 컬럼 속성
| 속성 | 타입 | 설명 |
|------|------|------|
| field | String | 데이터 필드명 |
| label | String/Array | 헤더. N단 멀티헤더: [{text, colspan}, ...] |
| width | Number | 너비 (px) |
| type | String | 'number' 등 |
| format | String | 'currency', 'date' |
| editor | String | 'text','select','combo','date','currency','check','switch','textarea' |
| options | Array | select/combo용 [{value, label}] |
| code | String | select/combo용 코드 그룹 (서버 조회) |
| frozen | Boolean | 고정 컬럼 (좌측 sticky) |
| readOnly | Boolean | 편집 불가 |
| required | Boolean | checkGridValidation 필수 |
| footer | String | 'sum', 'count', 'avg' |
| align | String | 'left', 'center', 'right' |
| merge | Boolean | 같은 값 연속 행 자동 rowspan 병합 |
| renderer | Function | (val, row, col, idx) → HTML/Element |

### API
| 메서드 | 설명 |
|--------|------|
| setData(data, totalCount?) | 데이터 세팅 |
| getData() / getCheckedData() / getModifiedData() | 데이터 조회 |
| getSelectedItem() / getItem(idx) | 행 조회 |
| addRow(defaults) / deleteRow() | 행 추가/삭제 |
| updateItem(idx, data) | 행 업데이트 (gstat 자동 "U") |
| clearData() / clearSelect() | 초기화 |
| eachRow(callback) | 전체 행 순회 |
| checkGridValidation() | required 검증 |
| exportCsv(filename) / exportXlsx(filename) | CSV/XLSX 내보내기 (클라이언트) |
| exportXlsxServer(filename, data?) | XLSX 서버사이드 다운로드 (대량 데이터용) |
| importExcel(callback?) | CSV/TSV 파일 임포트 |
| print(title?) | 인쇄 (새 창) |
| undo() / redo() | 실행 취소/다시 실행 |
| moveRow(from, to) | 행 이동 |
| hideColumn(field) / showColumn(field) | 컬럼 숨기기/표시 |
| autoFitAllColumns() | 전체 컬럼 자동 너비 |
| mergeCells(row, col, rowspan, colspan) | 수동 셀 병합 |
| toggleGroup(key) / expandAllGroups() / collapseAllGroups() | 그룹 제어 |
| toggleTreeNode(id) / expandAllTree() / collapseAllTree() | 트리 제어 |
| toggleDetail(rowIdx) | 마스터-디테일 토글 |
| addCellCss/removeCellCss(row, field, css) | 셀 CSS |
| addCss/removeCss(row, css) | 행 CSS |

### 키보드
Arrow(이동), Tab/Shift+Tab(셀), Enter/F2(편집), Esc(취소), Delete(지우기), Space(체크토글), Home/End, Ctrl+Home/End, PageUp/Down, Ctrl+C/V(클립보드), Ctrl+Z/Y(Undo/Redo), 우클릭(컨텍스트메뉴)

---

## FormaForm

### 생성자 옵션
```javascript
const form = new FormaForm('#area', {
    search: false,          // true면 검색폼 (가로 배치)
    columns: 2,             // form 모드 컬럼 수
    labelWidth: 80,         // 라벨 너비 (px)
    elements: [...],        // 위젯 정의 배열
    onChange: function(field, value, oldValue) {},  // 값 변경 콜백
    onBlur: function(field, value) {},              // 포커스 아웃 콜백
    onEnter: function(field, value) {},             // 엔터키 콜백
});
```

### 위젯 타입
| widget | 설명 | 주요 속성 |
|--------|------|----------|
| text | 텍스트 입력 (기본) | placeholder, readOnly, maxLength, type='number', min, max, step |
| number | 숫자 입력 | (text에 type='number'), min, max, step, suffix, prefix |
| combo | 드롭다운 | options: [{value, label}], code: 'CODE_GROUP', dependsOn |
| date | 날짜 | readOnly |
| dateRange | 기간 (from~to) | default: 'THIS_MONTH', 'TODAY', 'THIS_YEAR' |
| codePopup | 코드 팝업 | popup: {url, codeField, nameField, width, height} |
| textarea | 텍스트영역 | readOnly, rows |
| checkbox | 체크박스 | checkLabel |
| radio | 라디오 버튼 | options: [{value, label}] |
| hidden | 숨김 필드 | — |
| currency | 금액 입력 | 콤마 자동포맷, getData()에서 Number 반환, suffix, prefix |
| multiCombo | 복수 선택 | options: [{value, label}], getData()에서 쉼표구분 문자열 |
| yearMonth | 년월 선택 | default: 'THIS_MONTH', 'PREV_MONTH' |
| year | 년도 선택 | default: 'THIS_YEAR', range: 5 (±5년) |
| switch | ON/OFF 토글 | onLabel, offLabel, getData()에서 'Y'/'N' |
| divider | 구분선/섹션 | label (텍스트), getData()에서 무시 |
| display | 읽기전용 텍스트/뱃지 | badge: true, badgeColors: {값: 색상}, options |
| password | 비밀번호 | 눈 아이콘으로 보기/숨기기 토글 |

### 공통 필드 속성
| 속성 | 타입 | 설명 |
|------|------|------|
| field | String | 데이터 필드명 |
| label | String | 라벨 텍스트 |
| required | Boolean | 필수 여부 (라벨에 * 표시) |
| readOnly | Boolean | 읽기 전용 |
| colspan | Number | 차지할 컬럼 수 (form 모드) |
| prefix | String | 입력 앞 표시 ('₩', '$') |
| suffix | String | 입력 뒤 표시 ('원', 'kg', '%') |
| helpText | String | 필드 아래 도움말 텍스트 |
| onChange | Function | 개별 필드 변경 콜백 (value, oldValue) |
| dependsOn | Object | 의존 콤보 {field, paramKey} |

### API
| 메서드 | 설명 |
|--------|------|
| getData() | 폼 데이터 반환. dateRange는 {field}_from, {field}_to로 분리, currency는 Number, multiCombo는 쉼표구분 문자열 |
| setData(obj) | 폼 데이터 세팅 + 원본 데이터 저장 (isDirty 기준) |
| getField(field) | 개별 필드 값 조회 |
| setField(field, value) | 개별 필드 값 세팅 |
| clear() | 전체 초기화 |
| validate() | required 필드 검증 (false면 에러 표시 + 포커스) |
| formReadonly(boolean) | 전체 읽기 전용 토글 |
| showField(field) / hideField(field) | 필드 표시/숨김 |
| setOptions(field, options) | 콤보/multiCombo 옵션 교체 |
| setRequired(field, boolean) | 필수 여부 동적 변경 |
| setReadonly(field, boolean) | 개별 필드 readOnly 변경 |
| setDisabled(field, boolean) | 개별 필드 disabled 변경 |
| setLabel(field, text) | 라벨 텍스트 동적 변경 |
| focus(field) | 특정 필드 포커스 |
| isDirty() | 원본(setData) 대비 변경 여부 (true/false) |
| getChangedFields() | 변경된 필드명 배열 반환 |
| resetToOriginal() | 원본 데이터로 복원 |

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
```javascript
var modal = FormaModal.current();   // 현재 모달 인스턴스
var param = FormaModal.getParam();  // show()에 전달된 파라미터
modal.ok({ CUST_CD: 'C001' });     // 결과 전달 후 닫기
```
- 중첩 팝업 지원 (z-index 자동 증가)
- ESC는 최상위 팝업만 닫힘
- 드래그 이동 가능

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
| FormaPopup.confirm.show(msg) | 확인/취소 (Promise\<boolean\>, await 가능) |
| FormaPopup.loading.show() / .hide() | 로딩 오버레이 |
| FormaPopup.toast.success(msg) | 성공 토스트 (3초) |
| FormaPopup.toast.error(msg) | 에러 토스트 |
| FormaPopup.toast.info(msg) | 정보 토스트 |

---

## FormaUtil (40+개)

| 카테고리 | 주요 API |
|---------|---------|
| 날짜 | today(), now(), addDays(), addMonths(), firstDayOfMonth(), lastDayOfMonth(), diffDays() |
| 숫자 | formatCurrency(), formatNumber(val, 2), parseCurrency(), formatPercent(), round() |
| 문자열 | byteLength(), cutByByte(), formatBizNo(), formatPhone(), escapeHtml() |
| 배열 | groupBy(), sumBy(), unique(), deepCopy(), isEqual() |
| DOM | debounce(), throttle(), copyToClipboard(), show(), hide() |
| 코드 | getCodeItems(grpCode), getCodeLabel(), preloadCodes('A','B'), clearCodeCache() |
| 검증 | isEmail(), isBizNo(), isNumeric(), hasKorean() |
| Split | initSplit(selector, {minSize, maxSize, collapsible, saveKey}) |

## FormaMdi (SPA MDI)

iframe 없이 div 기반 탭 관리. 메모리 효율적, 화면간 직접 통신 가능.

| API | 설명 |
|-----|------|
| FormaMdi.init(tabBarSel, contentSel) | 초기화 |
| FormaMdi.open({id, label, url}) | 화면 열기 (이미 열려있으면 활성화) |
| FormaMdi.close(id) | 탭 닫기 (destroy + DOM 제거) |
| FormaMdi.closeAll() / closeOthers(id) | 전체/다른 탭 닫기 |
| FormaMdi.getActiveId() | 현재 활성 탭 |
| FormaMdi.isOpen(id) | 탭 열림 여부 |

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

## XLSX 서버사이드 다운로드

대량 데이터(1만건+) Excel 다운로드. Apache POI SXSSF(스트리밍) 기반.

### API
```
POST /api/excel/download
{ "fileName": "거래처목록", "sheetName": "Sheet1",
  "columns": [{ "field": "cust_cd", "label": "거래처코드", "width": 15, "type": "number" }],
  "data": [{ "cust_cd": "C001" }] }
→ XLSX 파일 스트림 응답
```

### 프론트 사용법
```javascript
// 소량 (클라이언트): ctx.grid1.exportXlsx('파일명');
// 대량 (서버): ctx.grid1.exportXlsxServer('파일명');
// 별도 데이터: ctx.grid1.exportXlsxServer('파일명', customData);
```

---

## 공통 팝업 (코드 검색)

| 팝업 | 경로 | 반환 |
|------|------|------|
| 거래처 검색 | `/pages/popup/CUS_P01.html` | `{ CUST_CD, CUST_NM }` |
| 품목 검색 | `/pages/popup/ITM_P01.html` | `{ ITEM_CD, ITEM_NM, UNIT_PRICE, UNIT_CD }` |

### API
```
POST /api/popup/customer  { keyword, cust_type }
POST /api/popup/item      { keyword, item_grp }
```

### FormaForm codePopup 연동
```javascript
{ field: 'cust_cd', label: '거래처', widget: 'codePopup',
  popup: { url: '/pages/popup/CUS_P01.html', codeField: 'CUST_CD', nameField: 'CUST_NM', width: 800, height: 600 } }
```

---

## 즐겨찾기 메뉴

메뉴 항목 우클릭 → 즐겨찾기 추가. 좌측 메뉴 상단에 즐겨찾기 섹션 표시.

### API
```
GET  /api/user/favorites           → 즐겨찾기 목록
POST /api/user/favorites/add       { menu_id } 또는 { pgm_id }
POST /api/user/favorites/remove    { menu_id }
```

### 테이블
```sql
tb_user_favorite (user_id, menu_id, sort_order, created_at)
```

---

## 개인 설정 저장

테마, 메뉴 접힘 상태 등을 서버에 저장. 재로그인 시 복원.

### API
```
GET  /api/user/settings                → { theme: "dark", menuCollapsed: "N" }
POST /api/user/settings  { key: val }  → 설정 저장 (MERGE)
```

### 테이블
```sql
tb_user_settings (user_id, setting_key, setting_value, updated_at)
```

---

## 감사 로그/트레이스 조회 화면 (SYS010)

관리자 전용. 두 탭 구성:
- **감사 로그 탭**: tb_audit_log 서버 페이징 조회 + before/after JSON 비교
- **트레이스 탭**: 인메모리 서비스 트레이스 (최근 200건, 실행시간 표시)

### API
```
POST /api/admin/auditLog  { page, pageSize, pgm_id, user_id, action, audit_dt_from, audit_dt_to }
GET  /api/trace/recent?count=200
```

---

## YAML 화면 엔진 레이아웃 지원

screen.html이 YAML의 `screen.type`에 따라 자동으로 DOM 구조를 생성:

| type | DOM 구조 | 동작 |
|------|----------|------|
| list | 검색폼 + grid1 | 기본 CRUD |
| split-detail | 검색폼 + [grid1 \| grid2] | grid1 클릭 → grid2 로드 |
| master-detail | 검색폼 + grid1 + masterForm + grid2 | grid1 클릭 → form + grid2 로드 |

---

## AI 코드 생성 워크플로

### 두 가지 방식

**방식 A: YAML 런타임 엔진 (코드 생성 불필요)**
```
사용자 요구 → YAML 설계서 (design/screens/{ID}.yml) → 끝
```
- 단순 CRUD 화면은 YAML 1파일로 완성
- Controller, Service, Mapper XML, HTML 전부 불필요
- /api/screen/{id}/* 엔드포인트가 동적 SQL 생성
- 지원 레이아웃: list, split-detail, master-detail, split-tab
- JOIN, 복합 WHERE, 다중 그리드 지원

**방식 B: 커스텀 코드 (복잡한 비즈니스 로직)**
```
사용자 요구 → YAML 설계서 → 코드 생성 (Controller + Service + Mapper + HTML)
```
- 복잡한 SQL, 트랜잭션, 계산 로직이 필요한 화면
- AI가 YAML 기반으로 보일러플레이트 생성 → 개발자가 로직 보완

### 핵심 원칙
- 단순 화면은 YAML만으로, 복잡한 화면만 코드 작성
- YAML과 커스텀 코드가 같은 프레임워크에서 공존
- 설계서(YAML)는 사람이 읽고 수정할 수 있는 중간 산출물
