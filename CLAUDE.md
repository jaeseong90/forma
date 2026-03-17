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
│   ├── mybatis/        # FormaSqlSession (Simple + Batch)
│   ├── db/             # DataSource 설정
│   ├── security/       # SecurityConfig, JWT
│   ├── trace/          # TraceFilter, ServiceTraceAspect, SSE
│   ├── sse/            # SseBroadcaster, SseRegistry
│   ├── mvc/            # WebMvcConfig, GlobalExceptionAdvice
│   ├── excel/          # ExcelUtil
│   ├── log/            # FormaLogService
│   ├── exception/      # FormaException
│   └── util/           # Constants, SeqGenerator, StringUtil
├── common/             # 공통 (PgmController, CodeController, CommonService)
├── login/              # 로그인 (LoginController, LoginService, LoginUserVo)
└── domain/             # 업무 코드 (AI가 생성)
    └── {module}/{sub}/{PgmId}Controller.java, Service.java
```

## Controller 패턴
```java
@FormaController(value = "/sda010", pgmId = "SDA010", description = "거래처관리")
```
- 명시적 엔드포인트 (selectGrid1, saveGrid1, deleteGrid1 등)
- BaseResponse.Ok(data) / BaseResponse.Warn(msg) / BaseResponse.Error(msg)
- @AddUserInfo → AOP가 Map 파라미터에 user_id, user_name 등 자동 주입

## Service 패턴
```java
@FormaService(pgmId = "SDA010", description = "거래처관리")
```
- FormaSqlSession의 namespace 기반 호출
  `sql.selectList("sda010.selectGrid1", param)`
- Mapper 인터페이스 없음 — XML namespace 직접 참조
- gstat: "I"=Insert, "U"=Update (프론트 FormaGrid가 관리)

## MyBatis XML
- 경로: `resources/mapper/domain/{module}/{pgmId}.xml`
- namespace: pgmId 소문자 (sda010, soa010)
- 공통 WHERE: `<sql id="whereGrid1">` + `<include refid="whereGrid1"/>`
- 동적 조건: `<if test="field != null and field != ''">`
- parameterType="map", resultType="map"

## 프론트엔드 구조
```
static/
├── index.html
├── pages/{module}/{PGMID}.html
└── assets/
    ├── css/forma.css
    └── js/framework/
        ├── forma.core.js      # Listener, platform.post/get, Callback, RESULT_CODE
        ├── forma.grid.js      # FormaGrid (편집, 체크박스, gstat 관리, 정렬, footer 합계)
        ├── forma.form.js      # FormaForm (검색폼/입력폼)
        ├── forma.toolbar.js   # FormaToolbar (권한 기반 버튼바, 단축키)
        ├── forma.tab.js       # FormaTab (탭 전환)
        ├── forma.modal.js     # FormaModal (팝업, fetch로 HTML 로딩)
        ├── forma.popup.js     # FormaPopup.alert/confirm/loading/toast
        └── forma.util.js      # FormaUtil (날짜, 숫자 포맷)
```

## 화면 JS 패턴
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

    listener.button.save.click = function() {
        const data = ctx.grid1.getCheckedData();
        if (data.length === 0) { FormaPopup.alert.show('저장할 항목을 선택하세요.'); return; }
        FormaPopup.confirm.show('저장하시겠습니까?', function(ok) {
            if (ok) platform.post('/' + PGM.toLowerCase() + '/saveGrid1', data, new Callback(function(r) {
                if (r.resultCode === RESULT_CODE.OK) { FormaPopup.toast.success('저장되었습니다.'); listener.button.search.click(); }
            }));
        });
    };

    document.addEventListener('DOMContentLoaded', () => platform.startPage(PGM, listener));
})();
```

## 화면 초기화 흐름
1. 브라우저가 /pages/{module}/{PGMID}.html 접근 (정적 파일)
2. platform.startPage(PGM, listener) 호출
3. GET /api/pgm/{PGM}/init → { pgmInfo, pgmAuth } 획득
4. FormaToolbar.render() — 권한 기반 버튼 표시 + 단축키 등록
5. listener.initPgm() 실행
6. 이후 업무 로직 (조회/저장/삭제)

## Listener 이벤트 목록
- button: search, news, save, del, print, upload, init, etc1~etc10
- gridRow: click(record, grid, col), dblclick(rowId, colId, record, grid)
- gridEditor: changed(grid, state, editor), beforeEditStart(grid, record, col)
- treeGridRow: click, dblclick
- treeGridEditor: changed, beforeEditStart
- tabBar: tabChange(tab)
- editor: change(el), keydown(el, event)

## FormaGrid API
- setData(data) — 데이터 세팅 (기존 데이터 교체)
- getData() — 전체 데이터 반환
- getCheckedData() — 체크된 행 반환 (gstat 포함)
- getModifiedData() — gstat이 I 또는 U인 행 반환
- getSelectedItem() — 현재 선택된 행 반환 (없으면 null)
- clearData() — 데이터 초기화
- addRow(defaults) — 행 추가 (gstat="I")
- deleteRow() — 체크된/선택된 행 삭제
- getItem(idx) — 특정 행 데이터
- updateItem(idx, data) — 특정 행 업데이트 (gstat 자동 "U")
- eachRow(callback) — 전체 행 순회
- clearSelect() — 선택 해제
- checkGridValidation() — required 컬럼 빈 값 검증
- addCellCss(rowIdx, field, css) / removeCellCss() — 셀별 CSS
- addCss(rowIdx, css) / removeCss() — 행별 CSS

## 네이밍 규칙
- 패키지: `com.forma.domain.{module}.{sub}.{PgmId소문자}`
- Controller: `{PgmId}Controller.java`
- Service: `{PgmId}Service.java`
- MyBatis XML: `mapper/domain/{module}/{pgmId소문자}.xml`
- 화면: `static/pages/{module}/{PGMID}.html`
- SQL 테이블: `tb_{snake_case}`
- SQL 컬럼: snake_case
- API: `/{pgmId소문자}/{action}` (예: /sda010/selectGrid1)
- 코드 그룹: UPPER_SNAKE
