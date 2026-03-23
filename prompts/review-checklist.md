# FORMA 코드 리뷰 체크리스트

AI가 생성한 코드 또는 개발자가 작성한 코드를 검증할 때 사용합니다.

## 사용법

```
@prompts/review-checklist.md

아래 파일들을 리뷰해줘:
- design/screens/POA010.yml
- src/main/java/.../Poa010Controller.java
- ...
```

---

## 백엔드 체크리스트

### Controller
- [ ] `@FormaController`에 pgmId, description 설정
- [ ] 조회: `@PostMapping`, `BaseResponse.Ok(data)` 반환
- [ ] 저장: `@AddUserInfo` + `@PostMapping`, `List<Map>` 수신
- [ ] 삭제: `@AddUserInfo` + `@PostMapping`
- [ ] 서버 페이징: `page`, `pageSize` → `_offset` 계산 → `Map(data, totalCount)` 반환

### Service
- [ ] `@FormaService`에 pgmId, description → 감사로그/트레이스 자동 적용
- [ ] `FormaSqlSession` 사용 (Mapper 인터페이스 아님)
- [ ] namespace 기반 호출: `sql.selectList(ns + ".selectGrid1", param)`
- [ ] 저장: `@Transactional`, `Constants.GSTAT` 분기 (I/U)
- [ ] 채번 필요 시: `SeqGenerator.next("PREFIX")`

### MyBatis XML
- [ ] namespace = pgmId 소문자
- [ ] `parameterType="map"`, `resultType="map"`
- [ ] 동적 조건: `<if test="field != null and field != ''">`
- [ ] dateRange: `{field}_from`, `{field}_to` 분리
- [ ] INSERT: `created_by=#{user_id}`, `created_at=NOW()`
- [ ] UPDATE: `updated_by=#{user_id}`, `updated_at=NOW()`
- [ ] SQL 인젝션: `#{param}` 사용 (`${param}` 금지, sortField/sortDir 제외)

### YAML 화면
- [ ] `screen.type`이 올바른가 (list/split-detail/master-detail)
- [ ] `sql.selectGrid2`에 `where` 절이 있는가 (마스터 키 필터링)
- [ ] `sql.updateGrid2/deleteGrid2`에 `where` 절 PK 조건
- [ ] 컬럼 `field`명이 DB 컬럼과 대문자로 일치 (H2 map → 대문자)

---

## 프론트엔드 체크리스트

### 화면 구조
- [ ] IIFE 패턴 `(function() { ... })();`
- [ ] `var PGM = '{PGMID}'` 정확한 ID
- [ ] `platform.initListener(PGM)` 호출
- [ ] `platform.startPage(PGM, listener)` DOMContentLoaded에서 호출
- [ ] `ctx` 객체에 컴포넌트 참조 저장

### FormaGrid
- [ ] `editable: true` 시 `checkable: true`도 설정 (저장 대상 선택)
- [ ] 숫자 컬럼에 `type: 'number'` 또는 `format: 'currency'`
- [ ] `required: true` 컬럼 → `checkGridValidation()` 호출
- [ ] 서버 페이징: `paging: true` + `onPageChange` 콜백

### FormaForm
- [ ] 검색폼: `search: true`
- [ ] 입력폼: `columns`, `labelWidth` 설정
- [ ] dateRange `default`: 'THIS_MONTH', 'TODAY' 등
- [ ] `getData()` 호출 시 dateRange → `{field}_from`, `{field}_to` 자동 분리
- [ ] `validate()` 호출 후 저장

### 저장 플로우
- [ ] `getCheckedData()` 또는 `getModifiedData()`로 데이터 수집
- [ ] 빈 배열 체크 → 안내 메시지
- [ ] `checkGridValidation()` → false면 중단
- [ ] `FormaPopup.confirm.show()` 확인
- [ ] 성공 시 `FormaPopup.toast.success()` + 재조회

### 삭제 플로우
- [ ] `getCheckedData()` 또는 `getSelectedItem()`
- [ ] `FormaPopup.confirm.show(n + '건 삭제하시겠습니까?')`
- [ ] 성공 시 재조회

---

## 보안 체크리스트

- [ ] SQL에 `${param}` 직접 삽입 없음 (sortField/sortDir 제외)
- [ ] 파일 업로드: 확장자 검증, 경로 조작 방지
- [ ] XSS: 사용자 입력을 HTML에 직접 삽입 시 `FormaUtil.escapeHtml()` 사용
- [ ] 권한: 민감한 API에 admin 체크 또는 역할 체크
- [ ] 개인정보: 로그에 비밀번호, 주민번호 등 출력 금지

---

## 성능 체크리스트

- [ ] 1000건+ 예상 테이블: 서버 페이징 적용
- [ ] 10000건+ 예상: `virtualScroll: true`
- [ ] N+1 쿼리: 목록 조회에서 반복 서브쿼리 없는지 확인
- [ ] XLSX 대량 다운로드: `exportXlsxServer()` 사용 (클라이언트 `exportXlsx()`는 소량만)
