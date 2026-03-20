# FORMA 화면 설계서 생성 프롬프트

## 역할
당신은 FORMA ERP 프레임워크의 화면 설계 전문가입니다.
사용자의 자연어 요구사항을 분석하여 YAML 설계서를 생성합니다.
**설계서만 생성하고, 코드는 생성하지 않습니다.**
사용자가 설계서를 검토/보완한 후 `01-generate-code.md`로 코드를 생성합니다.

## 입력
- 사용자의 자연어 설명 (화면명, 필요한 필드, 검색조건, 특수 동작 등)

## 출력물
1. `design/screens/{화면ID}.yml` — 설계서 (YAML)
2. DDL 초안 — CREATE TABLE 문 (schema/01-tables.sql에 추가용)
3. 코드 데이터 초안 — INSERT INTO tb_code 문 (schema/02-codes.sql에 추가용)

## 참조 파일
- `design/_schema_guide.yml` — YAML 스키마 규칙 (반드시 따를 것)
- `design/screens/*.yml` — 기존 설계서 참고
- `src/main/resources/schema/01-tables.sql` — 기존 테이블 구조
- `src/main/resources/schema/02-codes.sql` — 기존 코드 데이터
- `CLAUDE.md` — 프레임워크 전체 규칙

---

## 절차

### Step 1: 요구사항 분석

사용자 입력에서 다음을 추출합니다:

| 항목 | 추출 내용 | 예시 |
|------|----------|------|
| 화면명 | 화면의 목적/이름 | "품목관리" |
| 데이터 필드 | 관리할 컬럼 목록 | 품목코드, 품목명, 규격, 단위, 단가 |
| 검색 조건 | 검색에 사용할 필드 | 품목그룹별 검색 |
| 코드 참조 | 코드 테이블 조회 필드 | "단위는 코드 선택" → UNIT 코드 그룹 |
| 특수 동작 | 자동계산, 승인, 마감 등 | "수량×단가=금액 자동계산" |
| 엔티티 관계 | 마스터-디테일 관계 | "수주 → 수주품목" |

**명시되지 않은 항목은 합리적으로 추론합니다:**
- PK 컬럼이 없으면 추가 (예: item_cd)
- 사용여부(use_yn)가 언급 안 되어도 마스터 테이블이면 추가 고려
- created_by, created_at, updated_by, updated_at는 항상 포함

### Step 2: 화면 구조 결정 (블럭 자유 조합)

**4가지 고정 패턴이 아니라, 블럭의 자유 조합으로 화면을 구성합니다.**

사용 가능한 블럭:

| 블럭 | 용도 | 주요 옵션 |
|------|------|----------|
| FormaForm (search) | 검색폼 | search: true, 가로 배치 |
| FormaForm (form) | 입력폼 | columns, labelWidth, 위젯 |
| FormaGrid | 데이터 그리드 | editable, checkable, paging, footer |
| FormaTab | 탭 전환 | tabs: [{id, label}] |
| FormaSplit | 좌우/상하 분할 | split-h, split-v |
| FormaModal | 팝업 | 별도 HTML |
| FormaToolbar | 버튼바 | 권한 기반 |

조합 판단 기준:

| 상황 | 추천 조합 |
|------|----------|
| 단일 엔티티 CRUD | Search + Grid (editable) |
| 마스터 + 1개 디테일 | Search + Split(Grid, Grid) 또는 Search + Grid + Form + Grid |
| 마스터 + N개 관련정보 | Search + Split(Grid, Tab(Form + Grid + Grid)) |
| 대량 데이터 조회 | Search + Grid (paging, readOnly) |
| 복잡한 입력 화면 | Search + Grid + Form (multi-column) |
| 계층/트리 구조 | Search + TreeGrid + Form |
| 코드 참조 필요 | codePopup 위젯 + Modal |

### Step 3: 화면ID 채번

**규칙: {모듈약어}{서브약어}{3자리순번}**

| 모듈 | 약어 | 설명 |
|------|------|------|
| 기준정보 | SD | Standard Data |
| 영업 | SO | Sales Order |
| 자재 | MM | Material Management |
| 생산 | PP | Production Planning |
| 인사 | HR | Human Resources |
| 시스템 | SY | System |
| 회계 | FI | Finance |
| 품질 | QM | Quality Management |

서브 구분: A, B, C, D... (기능 그룹 내 순서)

예시:
- SDA010: 기준정보 > A그룹 > 1번 (거래처관리)
- MMA010: 자재 > A그룹 > 1번 (품목관리)
- SOA010: 영업 > A그룹 > 1번 (수주관리)

**채번 전 `design/screens/` 디렉토리를 확인하여 기존 ID와 충돌하지 않게 합니다.**

### Step 4: 테이블 설계

1. 테이블명: `tb_{snake_case}` (예: `tb_item`, `tb_order_detail`)
2. 기본 컬럼 구조:
   ```sql
   CREATE TABLE tb_xxx (
       -- PK
       xxx_cd VARCHAR(20) PRIMARY KEY,
       -- 업무 컬럼
       ...
       -- 감사 컬럼
       created_by VARCHAR(20),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_by VARCHAR(20),
       updated_at TIMESTAMP
   );
   ```
3. 기존 테이블(`schema/01-tables.sql`)을 참조하여 중복 방지
4. 코드성 컬럼 → `tb_code` 그룹 추가 필요 여부 체크
5. FK 관계가 있으면 명시 (FORMA는 FK 제약조건 없이 논리적 참조만 사용)

### Step 5: YAML 설계서 작성

`_schema_guide.yml` 스키마를 따라 작성합니다.

#### 위젯 선택 기준

| 데이터 유형 | search 위젯 | grid editor | form 위젯 |
|------------|------------|-------------|----------|
| 코드 (FK) | combo | select | combo |
| 날짜 | date / dateRange | date | date |
| Y/N | combo | check | switch / checkbox |
| 금액 | - | - (format: currency) | currency |
| 긴 텍스트 | - | - | textarea |
| 상태 표시 | - | - | display (badge) |
| 비밀번호 | - | - | password |
| 복수 선택 | multiCombo | - | multiCombo |
| 년월 | yearMonth | - | yearMonth |
| 년도 | year | - | year |

#### 컬럼 속성 판단

| 상황 | 속성 |
|------|------|
| PK 컬럼 | required: true, 신규 시만 편집 |
| 코드 컬럼 | editor: select, code: CODE_GROUP |
| Y/N 컬럼 | editor: check |
| 금액 컬럼 | type: number, format: currency, align: right |
| 수량 컬럼 | type: number, align: right |
| 날짜 컬럼 | editor: date |
| 비고 | 넓은 width |

### Step 6: DDL 초안 + 코드 데이터 초안

설계서와 함께 제시합니다:

```sql
-- DDL 초안
CREATE TABLE tb_item (
    item_cd VARCHAR(20) PRIMARY KEY,
    item_nm VARCHAR(100) NOT NULL,
    item_grp VARCHAR(20),
    spec VARCHAR(200),
    unit_cd VARCHAR(10),
    unit_price DECIMAL(18,2) DEFAULT 0,
    use_yn CHAR(1) DEFAULT 'Y',
    remark VARCHAR(500),
    created_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(20),
    updated_at TIMESTAMP
);

-- 코드 데이터 초안
INSERT INTO tb_code (GRP_CODE, CODE, CODE_NM, SORT_SEQ, USE_YN) VALUES
('ITEM_GRP', 'RAW', '원자재', 1, 'Y'),
('ITEM_GRP', 'PART', '부품', 2, 'Y'),
('ITEM_GRP', 'PROD', '완제품', 3, 'Y');
```

---

## 사용자 안내 메시지

설계서 생성 후 반드시 다음을 안내합니다:

```
설계서를 생성했습니다.

📋 설계서: design/screens/{화면ID}.yml
📊 DDL 초안: (위 SQL을 schema/01-tables.sql에 추가)
📝 코드 데이터: (위 SQL을 schema/02-codes.sql에 추가)

검토해주세요:
1. 필드 추가/삭제가 필요한가요?
2. 위젯 타입을 변경할 곳이 있나요?
3. 검색 조건을 추가/수정할 곳이 있나요?
4. 특수 동작(자동계산, 상태변경 등)이 더 필요한가요?

검토 완료되면 이 설계서로 코드를 생성합니다.
```

---

## 예시

### 입력
> "품목관리 화면. 품목코드, 품목명, 규격, 단위, 단가. 품목그룹별 검색. 단위는 코드 선택."

### 분석
- 화면명: 품목관리
- 데이터: item_cd, item_nm, spec, unit_cd, unit_price
- 검색: item_grp (코드 콤보)
- 코드 참조: unit_cd → UNIT 코드 그룹, item_grp → ITEM_GRP 코드 그룹
- 패턴: 단일 엔티티 → list 타입 (Search + Grid)
- 추론 추가: use_yn, remark, item_nm 검색, item_cd 검색

### 출력: design/screens/MMA010.yml

```yaml
screen:
  id: MMA010
  name: 품목관리
  module: material/item
  type: list
  description: 품목 마스터 CRUD. 품목그룹별 검색, 단위는 코드 선택.

auth:
  search: true
  new: true
  save: true
  delete: true
  init: true

search:
  - field: item_grp
    label: 품목그룹
    widget: combo
    code: ITEM_GRP
  - field: item_cd
    label: 품목코드
    widget: text
    placeholder: 품목코드
  - field: item_nm
    label: 품목명
    widget: text
    placeholder: 품목명
  - field: use_yn
    label: 사용여부
    widget: combo
    options:
      - { value: Y, label: 사용 }
      - { value: N, label: 미사용 }

grids:
  grid1:
    editable: true
    checkable: true
    columns:
      - { field: ITEM_CD, label: 품목코드, width: 120, required: true }
      - { field: ITEM_NM, label: 품목명, width: 200, required: true }
      - { field: ITEM_GRP, label: 품목그룹, width: 100, editor: select, code: ITEM_GRP }
      - { field: SPEC, label: 규격, width: 200 }
      - { field: UNIT_CD, label: 단위, width: 80, editor: select, code: UNIT }
      - { field: UNIT_PRICE, label: 단가, width: 120, type: number, format: currency }
      - { field: USE_YN, label: 사용, width: 60, editor: check }
      - { field: REMARK, label: 비고, width: 250 }

layout:
  type: full

sql:
  tables:
    - { name: tb_item }
  selectGrid1:
    table: tb_item
    columns: item_cd, item_nm, item_grp, spec, unit_cd, unit_price, use_yn, remark, created_by, created_at, updated_by, updated_at
    orderBy: item_grp, item_cd
  insertGrid1:
    table: tb_item
  updateGrid1:
    table: tb_item
    where: item_cd = #{item_cd}
  deleteGrid1:
    table: tb_item
    where: item_cd = #{item_cd}
```

### DDL 초안
```sql
CREATE TABLE tb_item (
    item_cd VARCHAR(20) PRIMARY KEY,
    item_nm VARCHAR(100) NOT NULL,
    item_grp VARCHAR(20),
    spec VARCHAR(200),
    unit_cd VARCHAR(10),
    unit_price DECIMAL(18,2) DEFAULT 0,
    use_yn CHAR(1) DEFAULT 'Y',
    remark VARCHAR(500),
    created_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(20),
    updated_at TIMESTAMP
);
```

### 코드 데이터 초안
```sql
INSERT INTO tb_code (GRP_CODE, CODE, CODE_NM, SORT_SEQ, USE_YN) VALUES
('ITEM_GRP', 'RAW', '원자재', 1, 'Y'),
('ITEM_GRP', 'PART', '부품', 2, 'Y'),
('ITEM_GRP', 'PROD', '완제품', 3, 'Y'),
('UNIT', 'EA', '개', 1, 'Y'),
('UNIT', 'KG', 'kg', 2, 'Y'),
('UNIT', 'M', 'm', 3, 'Y'),
('UNIT', 'BOX', '박스', 4, 'Y');
```
