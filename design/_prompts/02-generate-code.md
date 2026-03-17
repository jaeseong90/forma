# FORMA 코드 생성 프롬프트
# Claude Code에게 전달하는 코드 생성 지시

## 역할
너는 Spring Boot 개발자다.
FORMA 설계서(YAML)를 읽고, 프레임워크 컨벤션에 맞는 코드를 생성한다.

## 프로젝트 기술 스택
- Java 17, Spring Boot 3.x
- Spring JdbcTemplate (JPA/MyBatis 없음)
- 프론트: Vanilla JS (빌드 없음, /static에 배치)
- 공통 모듈: BaseController, BaseService, FormaGrid, FormaSearch, FormaForm

## 파일 생성 규칙

### Backend (Java)
경로: `src/main/java/com/프로젝트/domain/{모듈}/{기능}/`

| 파일 | 역할 | 상속 |
|------|------|------|
| {Entity}Controller.java | REST API | extends BaseController |
| {Entity}Service.java | 비즈니스 로직 | extends BaseService |
| {Entity}.java | 데이터 클래스 | POJO (getter/setter) |
| {Entity}Search.java | 검색 DTO | 필드별 getter/setter |

### Frontend (JS/HTML)
경로: `src/main/resources/static/pages/{모듈}/`

| 파일 | 역할 |
|------|------|
| {화면ID}.html | 페이지 레이아웃 |
| {화면ID}.js | 화면 로직 (FormaGrid, FormaSearch 사용) |

### SQL
경로: `src/main/resources/schema/`
| 파일 | 역할 |
|------|------|
| {Entity}.sql | CREATE TABLE DDL |

## 코드 패턴

### Controller 패턴
```java
@RestController
@RequestMapping("/api/{도메인-케밥}")
public class XxxController extends BaseController {
    private final XxxService service;
    public XxxController(XxxService service) { this.service = service; }
    @Override protected BaseService service() { return service; }

    // 설계서의 CUSTOM 액션만 추가
    // master-detail이면 /save-all 엔드포인트 추가
}
```

### Service 패턴
```java
@Service
public class XxxService extends BaseService {
    private final JdbcTemplate jdbc;
    public XxxService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override protected JdbcTemplate jdbc() { return jdbc; }
    @Override protected String table() { return "tb_xxx"; }
    @Override protected String pk() { return "xxx_cd"; }
    @Override protected String selectColumns() { return "t.*"; }
    // lookup 필드가 있으면 LEFT JOIN 포함한 selectColumns 반환

    @Override
    protected void appendWhere(StringBuilder sql, List<Object> params, Map<String,String> search) {
        // 설계서 search 섹션의 각 필드를 조건으로 변환
        // dateRange → {field}_from, {field}_to 파라미터
        // combo → IN 조건 (multi일 때) 또는 = 조건
        // text → LIKE '%value%'
        // codePopup → = 조건
    }

    // master-detail이면 saveWithItems() 메서드 추가
    // CUSTOM 액션이면 해당 메서드 추가
    // rules.calc → 저장 시 계산
    // rules.state → 상태 전이 검증
}
```

### 화면 JS 패턴
```javascript
const page = {
    api: '/api/{도메인-케밥}',

    init() {
        this.search = new FormaSearch('#search', [...], () => this.doSearch());
        this.grid = new FormaGrid('#grid', { columns: [...], onSelect: ... });
        // master-detail이면 detailGrid도 생성
        FormaPage.actionBar('#actions', [
            { label: '조회', onClick: () => this.doSearch(), primary: true },
            { label: '저장', onClick: () => this.doSave() },
            // 설계서 actions에 따라
        ]);
        this.doSearch();
    },

    async doSearch() {
        const data = await FormaApi.get(this.api, this.search.getValues());
        this.grid.setData(data.data, data.total);
    },
    // ...
};
document.addEventListener('DOMContentLoaded', () => page.init());
```

### HTML 패턴
```html
<!DOCTYPE html>
<html>
<head>
    <title>{화면명}</title>
    <link rel="stylesheet" href="/forma/forma.css">
</head>
<body>
<div class="forma-page">
    <h1 class="forma-page-title">{화면명}</h1>
    <div id="search"></div>
    <div id="actions"></div>
    <div id="grid"></div>
    <!-- master-detail이면 -->
    <div id="detail-grid" style="margin-top:8px"></div>
</div>
<script src="/forma/forma.js"></script>
<script src="/pages/{모듈}/{화면ID}.js"></script>
</body>
</html>
```

## 설계서
{여기에 화면 설계서 YAML 내용}

## 엔티티 정의
{여기에 _entities.yml 내용}

## 생성할 파일 목록을 나열하고, 각 파일을 순서대로 완성하라.
