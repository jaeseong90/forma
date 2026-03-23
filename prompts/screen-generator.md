# FORMA 화면 생성 프롬프트

이 프롬프트는 AI 코딩 도구(Claude Code, Cursor, ChatGPT, Copilot 등)에서 FORMA 화면을 자동 생성할 때 사용합니다.

## 사용법

AI 코딩 도구에 이 파일을 컨텍스트로 제공하고, 아래 형식으로 요구사항을 전달하세요:

- **Claude Code**: `@prompts/screen-generator.md` 로 참조
- **Cursor**: 프로젝트에 포함되어 자동 인식
- **ChatGPT 등**: 이 파일 내용을 대화에 붙여넣기

```
@prompts/screen-generator.md

아래 요구사항으로 FORMA 화면을 생성해줘:
- 화면명: 발주관리
- 화면ID: POA010
- 모듈: purchase/order
- 테이블: tb_purchase_order (마스터), tb_purchase_order_item (디테일)
- 레이아웃: master-detail
- 주요 필드: 발주번호, 발주일자, 거래처, 상태, 품목, 수량, 단가, 금액
```

---

## 생성 규칙

### 1단계: 화면 타입 결정

| 조건 | 타입 | YAML 가능 |
|------|------|-----------|
| 단일 테이블, 단순 CRUD | `list` | O — YAML만으로 완성 |
| 마스터 1 + 디테일 1 (좌우) | `split-detail` | O — YAML만으로 완성 |
| 마스터 1 + 폼 + 디테일 1 (상하) | `master-detail` | O — YAML만으로 완성 |
| 마스터 + 탭 + 다중 디테일 | `split-tab` | X — 커스텀 코드 필요 |
| 계산 로직, 트랜잭션, 승인 등 | 관계없음 | X — 커스텀 코드 필요 |

### 2단계: YAML 화면 생성 (단순 CRUD)

YAML 파일 위치: `design/screens/{SCREEN_ID}.yml`

```yaml
screen:
  id: {SCREEN_ID}        # 대문자, 영문+숫자
  name: {화면명}
  module: {module/sub}    # 패키지 경로
  type: {list|split-detail|master-detail}

auth:
  search: true
  new: true
  save: true
  delete: true
  init: true

search:
  # 검색 조건. widget 타입: text, combo, date, dateRange, yearMonth, year
  - field: {field_name}
    label: {라벨}
    widget: text
    placeholder: 검색어 입력

grids:
  grid1:
    editable: true/false    # 직접 편집 여부
    checkable: true/false   # 체크박스
    paging: true/false      # 서버 페이징 (대량 데이터)
    pageSize: 50
    columns:
      # editor 타입: text, select, combo, date, currency, check, switch, textarea
      - field: {COLUMN_NAME}      # 대문자 (H2 resultType=map 기본)
        label: {라벨}
        width: 100                # px
        editor: text              # 편집 가능 시
        required: true            # 필수 입력
        readOnly: true            # 읽기 전용
        frozen: true              # 고정 컬럼
        footer: sum               # sum, count, avg
        format: currency          # currency, date
        code: CODE_GROUP          # select/combo 서버 코드 그룹
        options:                  # 또는 직접 옵션 지정
          - { value: Y, label: 예 }

  grid2:                          # split-detail, master-detail 시
    editable: true
    columns: [...]

form:                             # master-detail 시
  masterForm:
    columns: 2
    labelWidth: 120
    elements:
      - field: {field_name}
        label: {라벨}
        widget: text              # FormaForm 위젯 타입
        readOnly: true
        required: true

layout:
  type: full                      # split-h (좌우분할 시)
  splitWidth: 400                 # 좌측 너비

sql:
  tables:
    - { name: {tb_table_name}, alias: {별칭} }
  selectGrid1:
    table: {tb_table t}
    columns: "{t.col1, t.col2, ...}"
    joins:                        # JOIN 필요 시
      - { table: tb_other, alias: o, on: "t.key = o.key", type: LEFT }
    orderBy: "{t.col1 DESC}"
  selectGrid2:
    table: {tb_detail}
    where: "master_key = #{master_key}"
    orderBy: seq
  insertGrid2:
    table: {tb_detail}
  updateGrid2:
    table: {tb_detail}
    where: "master_key = #{master_key} AND seq = #{seq}"
  deleteGrid2:
    table: {tb_detail}
    where: "master_key = #{master_key} AND seq = #{seq}"
```

### 3단계: 커스텀 코드 생성 (복잡 로직)

YAML만으로 부족할 때 — 4개 파일을 생성합니다.

#### Controller
```java
@FormaController(value = "/{pgmId소문자}", pgmId = "{PGMID}", description = "{화면명}")
@RequiredArgsConstructor
public class {PgmId}Controller extends BaseController {
    private final {PgmId}Service service;

    @PostMapping("/selectGrid1")
    public BaseResponse<List<Map<String, Object>>> selectGrid1(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(service.selectGrid1(param));
    }

    @AddUserInfo
    @PostMapping("/saveGrid1")
    public BaseResponse<?> saveGrid1(@RequestBody List<Map<String, Object>> param) {
        service.saveGrid1(param);
        return BaseResponse.Ok(param);
    }
}
```

#### Service
```java
@FormaService(pgmId = "{PGMID}", description = "{화면명}")
public class {PgmId}Service extends BaseService {
    private final FormaSqlSession sql;
    private final String ns = "{pgmId소문자}";

    public {PgmId}Service(FormaSqlSession sql) { this.sql = sql; }

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

#### MyBatis XML
```xml
<mapper namespace="{pgmId소문자}">
    <sql id="whereGrid1">
        <if test="keyword != null and keyword != ''">
            AND col LIKE '%' || #{keyword} || '%'
        </if>
    </sql>
    <select id="selectGrid1" parameterType="map" resultType="map">
        SELECT * FROM {tb_table}
        <where><include refid="whereGrid1"/></where>
        ORDER BY col
    </select>
    <insert id="insertGrid1" parameterType="map">
        INSERT INTO {tb_table} (col1, col2, created_by, created_at)
        VALUES (#{col1}, #{col2}, #{user_id}, NOW())
    </insert>
    <update id="updateGrid1" parameterType="map">
        UPDATE {tb_table} SET col1=#{col1}, updated_by=#{user_id}, updated_at=NOW()
        WHERE pk = #{pk}
    </update>
</mapper>
```

#### HTML
```html
<div class="forma-page">
    <div class="forma-page-header">
        <h1 class="forma-page-title">{화면명} ({PGMID})</h1>
        <div id="forma-toolbar"></div>
    </div>
    <div class="forma-content">
        <div id="search-area"></div>
        <div id="grid-area"></div>
    </div>
</div>
<!-- 스크립트: forma.core~modal 로드 후 IIFE 패턴 -->
```

### 4단계: DDL + 메뉴 등록

```sql
-- 테이블 생성
CREATE TABLE IF NOT EXISTS {tb_table} (...);

-- PGM 등록
INSERT INTO tb_pgm_info (pgm_id, pgm_nm, srch_yn, new_yn, save_yn, del_yn, init_yn)
VALUES ('{PGMID}', '{화면명}', 'Y', 'Y', 'Y', 'Y', 'Y');

-- 메뉴 등록
INSERT INTO tb_menu VALUES ('{MENU_ID}', '{화면명}', '{PARENT_ID}', 'P', '{PGMID}', '/pages/{module}/{PGMID}.html', '{아이콘}', {순서}, 'Y');

-- 역할-메뉴 권한
INSERT INTO tb_role_menu VALUES ('ADMIN', '{MENU_ID}', 'Y','Y','Y','Y','Y','Y','Y');
```

---

## 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 화면 ID | 영문 대문자 3자리 + 숫자 3자리 | SDA010, POA010 |
| 패키지 | `com.forma.domain.{module}.{sub}` | `com.forma.domain.purchase.order` |
| Controller | `{PgmId}Controller.java` | `Poa010Controller.java` |
| Service | `{PgmId}Service.java` | `Poa010Service.java` |
| MyBatis XML | `mapper/domain/{module}/{pgmId소문자}.xml` | `mapper/domain/purchase/poa010.xml` |
| namespace | pgmId 소문자 | `poa010` |
| 화면 HTML | `static/pages/{module}/{PGMID}.html` | `pages/purchase/POA010.html` |
| API 경로 | `/{pgmId소문자}/{action}` | `/poa010/selectGrid1` |
| SQL 테이블 | `tb_{snake_case}` | `tb_purchase_order` |
| SQL 컬럼 | snake_case | `order_no`, `created_at` |

---

## 체크리스트

생성 후 확인:
- [ ] YAML 또는 커스텀 코드 중 하나만 선택했는가
- [ ] 테이블 PK가 설정되었는가
- [ ] INSERT에 `created_by`, `created_at` 포함
- [ ] UPDATE에 `updated_by`, `updated_at` 포함
- [ ] WHERE 절에 MyBatis 동적 조건 (`<if test>`) 사용
- [ ] 서버 페이징이 필요한 화면은 `paging: true` + `onPageChange` 구현
- [ ] `tb_pgm_info`에 PGM 등록
- [ ] `tb_menu`에 메뉴 등록
- [ ] `tb_role_menu`에 ADMIN 역할 권한 등록
