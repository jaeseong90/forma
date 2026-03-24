package com.forma.frame.screen.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ScreenDefinition YAML 파싱 + toPgmInfo 테스트.
 */
class ScreenDefinitionTest {

    private final ObjectMapper yaml = new ObjectMapper(new YAMLFactory());

    @Test
    @DisplayName("YAML 파싱 - 기본 list 타입 화면")
    void parseYaml_listScreen() throws Exception {
        String yamlStr = """
                screen:
                  id: TEST001
                  name: 테스트화면
                  module: test
                  type: list
                auth:
                  search: true
                  save: true
                  delete: false
                search:
                  - field: keyword
                    label: 검색어
                    widget: text
                  - field: order_date
                    label: 주문일
                    widget: dateRange
                grids:
                  grid1:
                    editable: true
                    checkable: true
                    paging: true
                    pageSize: 30
                    columns:
                      - field: cust_cd
                        label: 거래처코드
                        width: 120
                      - field: cust_nm
                        label: 거래처명
                        width: 200
                sql:
                  tables:
                    - name: tb_customer
                  selectGrid1:
                    columns: "cust_cd, cust_nm"
                    orderBy: "cust_cd"
                  insertGrid1:
                    table: tb_customer
                  updateGrid1:
                    table: tb_customer
                    where: "cust_cd = #{cust_cd}"
                """;

        ScreenDefinition def = yaml.readValue(yamlStr, ScreenDefinition.class);

        // screen
        assertEquals("TEST001", def.getScreen().getId());
        assertEquals("테스트화면", def.getScreen().getName());
        assertEquals("list", def.getScreen().getType());

        // auth
        assertEquals(true, def.getAuth().get("search"));
        assertEquals(true, def.getAuth().get("save"));
        assertEquals(false, def.getAuth().get("delete"));

        // search
        assertEquals(2, def.getSearch().size());
        assertEquals("keyword", def.getSearch().get(0).getField());
        assertEquals("text", def.getSearch().get(0).getWidget());
        assertEquals("dateRange", def.getSearch().get(1).getWidget());

        // grid
        ScreenDefinition.GridDef grid = def.getGrids().get("grid1");
        assertTrue(grid.isEditable());
        assertTrue(grid.isCheckable());
        assertTrue(grid.isPaging());
        assertEquals(30, grid.getPageSize());
        assertEquals(2, grid.getColumns().size());
        assertEquals("cust_cd", grid.getColumns().get(0).getField());

        // sql operations
        assertNotNull(def.getSql().getOperation("selectGrid1"));
        assertEquals("cust_cd, cust_nm", def.getSql().getOperation("selectGrid1").getColumns());
        assertEquals("cust_cd", def.getSql().getOperation("selectGrid1").getOrderBy());
        assertEquals("tb_customer", def.getSql().getDefaultTable());

        // update where
        assertEquals("cust_cd = #{cust_cd}", def.getSql().getOperation("updateGrid1").getWhere());
    }

    @Test
    @DisplayName("toPgmInfo - auth boolean → Y/N 변환")
    void toPgmInfo_authFlags() throws Exception {
        String yamlStr = """
                screen:
                  id: PGM001
                  name: 프로그램
                auth:
                  search: true
                  save: true
                  new: true
                  delete: false
                  init: true
                  print: false
                  upload: false
                """;

        ScreenDefinition def = yaml.readValue(yamlStr, ScreenDefinition.class);
        Map<String, Object> pgmInfo = def.toPgmInfo();

        assertEquals("PGM001", pgmInfo.get("PGM_ID"));
        assertEquals("프로그램", pgmInfo.get("PGM_NM"));
        assertEquals("Y", pgmInfo.get("SRCH_YN"));
        assertEquals("Y", pgmInfo.get("SAVE_YN"));
        assertEquals("Y", pgmInfo.get("NEW_YN"));
        assertEquals("N", pgmInfo.get("DEL_YN"));
        assertEquals("Y", pgmInfo.get("INIT_YN"));
        assertEquals("N", pgmInfo.get("PRNT_YN"));
        assertEquals("N", pgmInfo.get("UPLD_YN"));
    }

    @Test
    @DisplayName("toPgmInfo - auth 없음 → 전부 N")
    void toPgmInfo_noAuth() {
        ScreenDefinition def = new ScreenDefinition();
        ScreenDefinition.ScreenInfo si = new ScreenDefinition.ScreenInfo();
        si.setId("X001");
        si.setName("빈화면");
        def.setScreen(si);

        Map<String, Object> pgmInfo = def.toPgmInfo();

        assertEquals("N", pgmInfo.get("SRCH_YN"));
        assertEquals("N", pgmInfo.get("SAVE_YN"));
        assertEquals("N", pgmInfo.get("DEL_YN"));
    }

    @Test
    @DisplayName("SqlDef - getDefaultTable() 테이블 없으면 null")
    void sqlDef_noTables() {
        ScreenDefinition.SqlDef sqlDef = new ScreenDefinition.SqlDef();
        assertNull(sqlDef.getDefaultTable());
    }

    @Test
    @DisplayName("SqlDef - getOperation() 없는 키 → null")
    void sqlDef_missingOperation() {
        ScreenDefinition.SqlDef sqlDef = new ScreenDefinition.SqlDef();
        assertNull(sqlDef.getOperation("nonExistent"));
    }

    @Test
    @DisplayName("YAML 파싱 - JOIN 포함")
    void parseYaml_withJoins() throws Exception {
        String yamlStr = """
                screen:
                  id: JOIN001
                  name: 조인테스트
                sql:
                  tables:
                    - name: tb_order
                  selectGrid1:
                    columns: "o.order_no, c.cust_nm"
                    joins:
                      - type: LEFT
                        table: tb_customer
                        alias: c
                        on: "o.cust_cd = c.cust_cd"
                    orderBy: "o.order_no DESC"
                """;

        ScreenDefinition def = yaml.readValue(yamlStr, ScreenDefinition.class);
        ScreenDefinition.SqlOp op = def.getSql().getOperation("selectGrid1");

        assertNotNull(op.getJoins());
        assertEquals(1, op.getJoins().size());
        assertEquals("LEFT", op.getJoins().get(0).get("type"));
        assertEquals("tb_customer", op.getJoins().get(0).get("table"));
        assertEquals("c", op.getJoins().get(0).get("alias"));
    }

    @Test
    @DisplayName("GridDef 기본값 확인")
    void gridDef_defaults() {
        ScreenDefinition.GridDef grid = new ScreenDefinition.GridDef();
        assertFalse(grid.isEditable());
        assertFalse(grid.isCheckable());
        assertFalse(grid.isPaging());
        assertEquals(50, grid.getPageSize());
    }

    @Test
    @DisplayName("SearchField 기본 widget=text")
    void searchField_defaultWidget() {
        ScreenDefinition.SearchField sf = new ScreenDefinition.SearchField();
        assertEquals("text", sf.getWidget());
    }
}
