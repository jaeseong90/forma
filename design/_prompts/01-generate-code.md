# FORMA 화면 코드 생성 지시

## 입력
- 설계서: design/screens/{화면ID}.yml
- 스키마 가이드: design/_schema_guide.yml
- CLAUDE.md의 패턴 규칙

## 생성 대상 파일
1. `src/main/java/com/forma/domain/{module}/{PgmId}Controller.java`
2. `src/main/java/com/forma/domain/{module}/{PgmId}Service.java`
3. `src/main/resources/mapper/domain/{module}/{pgmId소문자}.xml`
4. `src/main/resources/static/pages/{module}/{PGMID}.html`

## 규칙

### Controller
- `@FormaController(value = "/{pgmId소문자}", pgmId = "{PGMID}", description = "{화면명}")`
- `@RequiredArgsConstructor`
- `extends BaseController`
- 각 그리드별 select/save/delete 엔드포인트 명시
- `@AddUserInfo`는 쓰기 작업(save, delete, approve 등)에만
- 조회: `@RequestBody Map<String, Object> param` → `BaseResponse.Ok(service.xxx(param))`
- 저장(gstat 기반): `@RequestBody List<Map<String, Object>> param`
- 저장(마스터+디테일): `@RequestBody Map<String, Object> param` (master, items 키)

### Service
- `@FormaService(pgmId = "{PGMID}", description = "{화면명}")`
- `extends BaseService`
- `FormaSqlSession sql` 주입, `private final String ns = "{pgmId소문자}"`
- gstat 기반 I/U 분기 저장: `Constants.GSTAT_INSERT.equals(item.get(Constants.GSTAT))`
- 마스터+디테일 저장: existsMaster 체크 → insert/update, 디테일 전삭 → 재입력
- `@Transactional`은 쓰기 메서드에만
- 채번 필요 시: `SeqGenerator seq` 주입, `seq.next("PREFIX")`

### Mapper XML
- `namespace = "{pgmId소문자}"`
- `<sql id="whereGrid1">` + `<include refid="whereGrid1"/>` 패턴
- `parameterType="map"`, `resultType="map"`
- 동적 조건: `<if test="field != null and field != ''">`
- dateRange: `{field}_from`, `{field}_to` 조건
  ```xml
  <if test="order_date_from != null and order_date_from != ''">
      AND o.order_date &gt;= #{order_date_from}
  </if>
  ```
- INSERT에 `created_by = #{user_id}, created_at = NOW(), updated_by = #{user_id}, updated_at = NOW()`
- UPDATE에 `updated_by = #{user_id}, updated_at = NOW()`
- LIKE 검색: `LIKE '%' || #{field} || '%'` (H2/표준 SQL)

### 화면 HTML
- 순수 HTML (Thymeleaf 없음)
- IIFE 패턴: `(function() { const PGM = '...'; ... })();`
- `platform.startPage(PGM, listener)` 호출
- `FormaToolbar.render('#forma-toolbar', { listener, pgmInfo, pgmAuth })` — startPage 내부에서 자동 호출
- JS는 화면 HTML 내 인라인 `<script>` (별도 .js 파일 없음)
- 스크립트 로딩 순서:
  ```html
  <script src="/assets/js/framework/forma.core.js"></script>
  <script src="/assets/js/framework/forma.popup.js"></script>
  <script src="/assets/js/framework/forma.util.js"></script>
  <script src="/assets/js/framework/forma.grid.js"></script>
  <script src="/assets/js/framework/forma.form.js"></script>
  <script src="/assets/js/framework/forma.toolbar.js"></script>
  <script src="/assets/js/framework/forma.tab.js"></script>
  <script src="/assets/js/framework/forma.modal.js"></script>
  ```
- 화면 유형별 레이아웃:
  - **list**: 검색폼 + 그리드
  - **master-detail**: 검색폼 + 마스터그리드 + 입력폼(display:none) + 디테일그리드
  - **split-detail**: `forma-split-h` + 좌측그리드 + 우측그리드 + `FormaUtil.initSplit()`
  - **split-tab**: `forma-split-h` + 좌측그리드 + 우측`FormaTab` + `FormaUtil.initSplit()`

## 체크리스트
- [ ] Controller에 필요한 모든 엔드포인트가 있는가?
- [ ] Service에 @Transactional이 쓰기 메서드에만 있는가?
- [ ] Mapper XML의 namespace가 pgmId 소문자인가?
- [ ] 동적 WHERE 조건이 `<sql>` + `<include>`로 분리되었는가?
- [ ] HTML에서 `platform.startPage()`가 DOMContentLoaded에 있는가?
- [ ] 검색 후 관련 그리드/폼이 초기화되는가?
- [ ] 저장/삭제 후 조회가 자동 실행되는가?
- [ ] schema/04-pgm.sql에 PGM_INFO INSERT가 추가되었는가?
- [ ] index.html에 링크가 추가되었는가?
