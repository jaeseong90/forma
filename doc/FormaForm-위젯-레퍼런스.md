# FormaForm 위젯 레퍼런스

## 아키텍처 개요

FormaForm은 **위젯 패턴** 기반으로 설계되어 있다.

```
_FormaWidget (베이스 클래스)
├── _WText          : 텍스트/숫자 입력
├── _WTextarea      : 텍스트영역
├── _WPassword      : 비밀번호 입력
├── _WHidden        : 숨김 필드
├── _WCheckbox      : 체크박스
├── _WRadio         : 라디오 버튼
├── _WCombo         : 검색 가능 드롭다운
├── _WDate          : 날짜 (커스텀 캘린더)
├── _WDateRange     : 기간 (캘린더 + 프리셋)
├── _WCodePopup     : 코드 팝업
├── _WCurrency      : 금액 입력
├── _WMultiCombo    : 복수 선택 드롭다운
├── _WYearMonth     : 년월 선택
├── _WYear          : 년도 선택
├── _WSwitch        : ON/OFF 토글
├── _WDivider       : 구분선/섹션
└── _WDisplay       : 읽기전용 텍스트/뱃지

_FormaWidgets = {}   ← 타입→클래스 레지스트리
FormaForm            ← 오케스트레이터 (위젯 생성/순회만 담당)
```

새 위젯 추가 = **클래스 1개 작성** + **레지스트리 1줄 등록**. FormaForm 수정 불필요.

---

## 위젯 목록

### 1. text (기본)

| 항목 | 내용 |
|------|------|
| widget | `text` (기본값, 생략 가능) |
| 클래스 | `_WText` |
| 용도 | 텍스트/숫자 입력 |

```javascript
{ field: 'cust_nm', label: '거래처명', widget: 'text', placeholder: '입력', maxLength: 50 }
{ field: 'qty', label: '수량', type: 'number', min: 0, max: 9999, step: 1 }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| placeholder | String | 플레이스홀더 |
| readOnly | Boolean | 읽기 전용 |
| maxLength | Number | 최대 글자수 |
| type | String | `'number'`이면 숫자 입력 |
| min / max / step | Number | type='number' 전용 |
| prefix / suffix | String | 입력 앞뒤 표시 (`'₩'`, `'원'`, `'kg'`) |

**getData() 반환값**: `String` 또는 `null` (type='number'이면 `Number` 또는 `null`)

---

### 2. textarea

| 항목 | 내용 |
|------|------|
| widget | `textarea` |
| 클래스 | `_WTextarea` |
| 용도 | 여러 줄 텍스트 입력 |

```javascript
{ field: 'remark', label: '비고', widget: 'textarea', rows: 5 }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| rows | Number | 표시 행수 (기본 3) |
| readOnly | Boolean | 읽기 전용 |
| placeholder | String | 플레이스홀더 |

**getData() 반환값**: `String` 또는 `null`

---

### 3. password

| 항목 | 내용 |
|------|------|
| widget | `password` |
| 클래스 | `_WPassword` |
| 용도 | 비밀번호 입력 (눈 아이콘 토글) |

```javascript
{ field: 'pwd', label: '비밀번호', widget: 'password', placeholder: '8자 이상' }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| placeholder | String | 플레이스홀더 |
| readOnly | Boolean | 읽기 전용 |

**getData() 반환값**: `String` 또는 `null`

---

### 4. hidden

| 항목 | 내용 |
|------|------|
| widget | `hidden` |
| 클래스 | `_WHidden` |
| 용도 | 숨김 필드 (UI 없음) |

```javascript
{ field: 'seq', widget: 'hidden' }
```

**getData() 반환값**: `String` 또는 `null`

---

### 5. checkbox

| 항목 | 내용 |
|------|------|
| widget | `checkbox` |
| 클래스 | `_WCheckbox` |
| 용도 | 체크박스 |

```javascript
{ field: 'use_yn', label: '사용여부', widget: 'checkbox', checkLabel: '사용' }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| checkLabel | String | 체크박스 옆 텍스트 |
| readOnly | Boolean | 비활성화 |

**getData() 반환값**: `'Y'` 또는 `'N'`

---

### 6. radio

| 항목 | 내용 |
|------|------|
| widget | `radio` |
| 클래스 | `_WRadio` |
| 용도 | 라디오 버튼 그룹 |

```javascript
{ field: 'gender', label: '성별', widget: 'radio',
  options: [{ value: 'M', label: '남' }, { value: 'F', label: '여' }] }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| options | Array | `[{value, label}]` (필수) |
| readOnly | Boolean | 비활성화 |

**getData() 반환값**: 선택된 `value` (String) 또는 `null`. clear() 시 첫 번째 옵션 선택.

---

### 7. combo

| 항목 | 내용 |
|------|------|
| widget | `combo` |
| 클래스 | `_WCombo` |
| 용도 | 검색 가능 커스텀 드롭다운 |

```javascript
// 정적 옵션
{ field: 'cust_type', label: '거래처유형', widget: 'combo',
  options: [{ value: 'C', label: '고객' }, { value: 'V', label: '공급사' }] }

// 코드 그룹 자동 로드
{ field: 'cust_type', label: '거래처유형', widget: 'combo', code: 'CUST_TYPE' }

// 의존 콤보
{ field: 'sub_type', label: '세부유형', widget: 'combo', code: 'SUB_TYPE',
  dependsOn: { field: 'cust_type', paramKey: 'parent_cd' } }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| options | Array | `[{value, label}]` 정적 옵션 |
| code | String | 코드 그룹명 (서버 조회) |
| dependsOn | Object | `{field, paramKey}` 부모 콤보 의존 |
| readOnly | Boolean | 비활성화 (fc-disabled 클래스) |

**getData() 반환값**: 선택된 `value` (String) 또는 `null`. 검색폼이면 기본 '전체', 입력폼이면 '선택'.

---

### 8. date

| 항목 | 내용 |
|------|------|
| widget | `date` |
| 클래스 | `_WDate` |
| 용도 | 날짜 선택 (커스텀 캘린더) |

```javascript
{ field: 'order_dt', label: '주문일', widget: 'date', default: 'TODAY' }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| default | String | `'TODAY'`이면 오늘 날짜 |
| readOnly | Boolean | 캘린더 열지 않음 |

**getData() 반환값**: `'YYYY-MM-DD'` (String) 또는 `null`

---

### 9. dateRange

| 항목 | 내용 |
|------|------|
| widget | `dateRange` |
| 클래스 | `_WDateRange` |
| 용도 | 기간 선택 (캘린더 + 프리셋 버튼) |

```javascript
{ field: 'order_dt', label: '주문일', widget: 'dateRange', default: 'THIS_MONTH' }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| default | String | `'THIS_MONTH'`, `'TODAY'`, `'THIS_YEAR'`, `'THIS_WEEK'`, `'LAST_MONTH'` |
| presets | Array/Boolean | 프리셋 키 배열 또는 `false`(비활성) |
| readOnly | Boolean | 캘린더 열지 않음 |

**프리셋 키**: `today`, `yesterday`, `thisWeek`, `lastWeek`, `thisMonth`, `lastMonth`, `thisQuarter`, `lastQuarter`, `thisYear`, `lastYear`, `last7`, `last30`

**getData() 반환값**: `{field}_from`, `{field}_to`로 분리되어 반환 (각각 `'YYYY-MM-DD'` 또는 `null`)

**getField() 반환값**: `{ from: '...', to: '...' }` 객체

---

### 10. codePopup

| 항목 | 내용 |
|------|------|
| widget | `codePopup` |
| 클래스 | `_WCodePopup` |
| 용도 | 코드 입력 + 팝업 검색 |

```javascript
{ field: 'cust_cd', label: '거래처', widget: 'codePopup',
  popup: { url: '/pages/popup/CUS_P01.html', codeField: 'cust_cd', nameField: 'cust_nm', width: 800, height: 600 } }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| popup.url | String | 팝업 HTML 경로 |
| popup.codeField | String | 결과에서 코드 필드명 |
| popup.nameField | String | 결과에서 명칭 필드명 |
| popup.width / height | Number | 팝업 크기 |
| readOnly | Boolean | 읽기 전용 |

**getData() 반환값**: 코드 값 (String) 또는 `null`

**setData() 특수**: `obj[popup.nameField]`이 있으면 명칭 스팬에 자동 표시

---

### 11. currency

| 항목 | 내용 |
|------|------|
| widget | `currency` |
| 클래스 | `_WCurrency` |
| 용도 | 금액 입력 (콤마 자동포맷) |

```javascript
{ field: 'unit_price', label: '단가', widget: 'currency', prefix: '₩', suffix: '원' }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| placeholder | String | 플레이스홀더 |
| readOnly | Boolean | 읽기 전용 |
| prefix / suffix | String | 입력 앞뒤 표시 |

**getData() 반환값**: `Number` 또는 `null` (콤마 제거 후 숫자 변환)

**동작**: focus 시 콤마 제거 → 편집 → blur 시 콤마 포맷 복원. 숫자/백스페이스/마이너스만 입력 가능.

---

### 12. multiCombo

| 항목 | 내용 |
|------|------|
| widget | `multiCombo` |
| 클래스 | `_WMultiCombo` |
| 용도 | 복수 선택 드롭다운 (필 태그) |

```javascript
{ field: 'colors', label: '색상', widget: 'multiCombo',
  options: [{ value: 'R', label: '빨강' }, { value: 'G', label: '초록' }, { value: 'B', label: '파랑' }] }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| options | Array | `[{value, label}]` (필수) |

**getData() 반환값**: 쉼표 구분 문자열 (`'R,G,B'`) 또는 `null`

**동작**: '전체' 체크박스로 일괄 선택/해제, 개별 필 태그의 x 버튼으로 제거.

---

### 13. yearMonth

| 항목 | 내용 |
|------|------|
| widget | `yearMonth` |
| 클래스 | `_WYearMonth` |
| 용도 | 년월 선택 |

```javascript
{ field: 'ym', label: '년월', widget: 'yearMonth', default: 'THIS_MONTH' }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| default | String | `'THIS_MONTH'`, `'PREV_MONTH'` |
| readOnly | Boolean | 읽기 전용 |

**getData() 반환값**: `'YYYY-MM'` (String) 또는 `null`

---

### 14. year

| 항목 | 내용 |
|------|------|
| widget | `year` |
| 클래스 | `_WYear` |
| 용도 | 년도 선택 (select) |

```javascript
{ field: 'yr', label: '년도', widget: 'year', default: 'THIS_YEAR', range: 10 }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| default | String | `'THIS_YEAR'` |
| range | Number | 현재년도 기준 ±범위 (기본 5) |
| readOnly | Boolean | 비활성화 |

**getData() 반환값**: `'2026'` 같은 년도 문자열 또는 `null`

---

### 15. switch

| 항목 | 내용 |
|------|------|
| widget | `switch` |
| 클래스 | `_WSwitch` |
| 용도 | ON/OFF 토글 |

```javascript
{ field: 'active', label: '활성', widget: 'switch', onLabel: 'ON', offLabel: 'OFF' }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| onLabel | String | ON 쪽 텍스트 |
| offLabel | String | OFF 쪽 텍스트 |
| readOnly | Boolean | 클릭 차단 |

**getData() 반환값**: `'Y'` 또는 `'N'`

---

### 16. divider

| 항목 | 내용 |
|------|------|
| widget | `divider` |
| 클래스 | `_WDivider` |
| 용도 | 구분선/섹션 제목 |

```javascript
{ widget: 'divider', label: '상세정보' }
{ widget: 'divider', field: 'div1' }
```

**getData()에서 무시됨**. field를 주면 `showField`/`hideField`로 동적 표시 가능.

---

### 17. display

| 항목 | 내용 |
|------|------|
| widget | `display` |
| 클래스 | `_WDisplay` |
| 용도 | 읽기전용 텍스트 또는 뱃지 |

```javascript
// 단순 텍스트
{ field: 'created_by', label: '등록자', widget: 'display' }

// 뱃지
{ field: 'status', label: '상태', widget: 'display', badge: true,
  badgeColors: { '진행': '#4CAF50', '완료': '#2196F3', '취소': '#f44336' },
  options: [{ value: '01', label: '진행' }, { value: '02', label: '완료' }] }
```

| 속성 | 타입 | 설명 |
|------|------|------|
| badge | Boolean | 뱃지 스타일 |
| badgeColors | Object | `{값: 색상}` |
| options | Array | `[{value, label}]` 값→라벨 매핑 |

**getData() 반환값**: `dataset.value` 또는 `textContent` 또는 `null`

---

## 공통 필드 속성

모든 위젯(divider 제외)에 적용 가능한 공통 속성:

| 속성 | 타입 | 설명 |
|------|------|------|
| field | String | 데이터 필드명 (필수) |
| label | String | 라벨 텍스트 |
| widget | String | 위젯 타입 (기본 `'text'`) |
| required | Boolean | 필수 여부 (라벨에 * 표시, validate 대상) |
| readOnly | Boolean | 읽기 전용 |
| colspan | Number | form 모드에서 차지할 컬럼 수 |
| prefix | String | 입력 앞 표시 (text, currency, yearMonth, year, date) |
| suffix | String | 입력 뒤 표시 |
| helpText | String | 필드 아래 도움말 텍스트 |
| onChange | Function | `(value, oldValue)` 개별 필드 변경 콜백 |

---

## FormaForm 생성 옵션

```javascript
const form = new FormaForm('#area', {
    search: false,          // true면 검색폼 (가로 배치)
    columns: 2,             // form 모드 컬럼 수
    labelWidth: 80,         // 라벨 너비 (px)
    elements: [...],        // 위젯 정의 배열
    onChange: function(field, value, oldValue) {},
    onBlur: function(field, value) {},
    onEnter: function(field, value) {},
});
```

---

## FormaForm API

| 메서드 | 설명 |
|--------|------|
| `getData()` | 폼 전체 데이터 반환 (Object) |
| `setData(obj)` | 폼 데이터 세팅 + 원본 저장 |
| `getField(field)` | 개별 필드 값 조회 |
| `setField(field, value)` | 개별 필드 값 세팅 |
| `clear()` | 전체 초기화 |
| `validate()` | required 검증 (false면 에러 표시 + 포커스) |
| `formReadonly(boolean)` | 전체 읽기 전용 토글 |
| `showField(field)` | 필드 표시 |
| `hideField(field)` | 필드 숨김 |
| `setOptions(field, options)` | combo/multiCombo/year 옵션 교체 |
| `setRequired(field, boolean)` | 필수 여부 동적 변경 |
| `setReadonly(field, boolean)` | 개별 필드 readOnly |
| `setDisabled(field, boolean)` | 개별 필드 disabled |
| `setLabel(field, text)` | 라벨 텍스트 변경 |
| `focus(field)` | 특정 필드 포커스 |
| `isDirty()` | 원본 대비 변경 여부 |
| `getChangedFields()` | 변경된 필드명 배열 |
| `resetToOriginal()` | 원본 데이터로 복원 |
| `destroy()` | 위젯 정리 (document 리스너 해제) |

---

## getData() 반환값 특수 규칙

| 위젯 | 반환 형태 |
|------|----------|
| dateRange | `{field}_from`, `{field}_to`로 키가 분리됨 |
| currency | `Number` (콤마 제거 후) |
| multiCombo | 쉼표 구분 문자열 (`'A,B,C'`) |
| checkbox / switch | `'Y'` 또는 `'N'` |
| text (type=number) | `Number` |
| 그 외 | `String` 또는 `null` |
