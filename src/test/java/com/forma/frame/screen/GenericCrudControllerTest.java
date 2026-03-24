package com.forma.frame.screen;

import com.forma.frame.exception.FormaException;
import com.forma.frame.screen.model.ScreenDefinition;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * GenericCrudController 단위 테스트.
 * - 화면 정의 조회/미존재
 * - 페이징 판단 로직
 * - 권한 체크
 */
@ExtendWith(MockitoExtension.class)
class GenericCrudControllerTest {

    @Mock private ScreenRegistry registry;
    @Mock private DynamicSqlExecutor sqlExecutor;

    private GenericCrudController controller;

    @BeforeEach
    void setUp() {
        controller = new GenericCrudController(registry, sqlExecutor);
    }

    private ScreenDefinition createDef(String id, boolean paging) {
        ScreenDefinition def = new ScreenDefinition();
        ScreenDefinition.ScreenInfo si = new ScreenDefinition.ScreenInfo();
        si.setId(id);
        si.setName("테스트");
        def.setScreen(si);

        if (paging) {
            ScreenDefinition.GridDef grid = new ScreenDefinition.GridDef();
            grid.setPaging(true);
            grid.setPageSize(50);
            def.setGrids(Map.of("grid1", grid));
        }
        return def;
    }

    // ═══ getDefinition ═══

    @Test
    @DisplayName("getDefinition - 존재하는 화면 → OK")
    void getDefinition_found() {
        ScreenDefinition def = createDef("TEST001", false);
        when(registry.getDefinition("TEST001")).thenReturn(def);

        var response = controller.getDefinition("TEST001");
        assertEquals("OK", response.getResultCode());
        assertEquals("TEST001", response.getResultData().getScreen().getId());
    }

    @Test
    @DisplayName("getDefinition - 미존재 → WARN")
    void getDefinition_notFound() {
        when(registry.getDefinition("NOTEXIST")).thenReturn(null);

        var response = controller.getDefinition("NOTEXIST");
        assertEquals("WARN", response.getResultCode());
        assertTrue(response.getResultMessage().contains("NOTEXIST"));
    }

    // ═══ selectGrid1 ═══

    @Test
    @DisplayName("selectGrid1 - 미존재 화면 → FormaException")
    void selectGrid1_screenNotFound() {
        when(registry.getDefinition("NOTEXIST")).thenReturn(null);

        assertThrows(FormaException.class, () ->
                controller.selectGrid1("NOTEXIST", Map.of()));
    }

    @Test
    @DisplayName("selectGrid1 - 페이징 미요청 → executeSelect 호출")
    void selectGrid1_noPaging() {
        ScreenDefinition def = createDef("TEST001", true);
        when(registry.getDefinition("TEST001")).thenReturn(def);
        when(sqlExecutor.executeSelect(any(), eq("selectGrid1"), any()))
                .thenReturn(List.of(Map.of("a", "1")));

        // page 파라미터 없음
        controller.selectGrid1("TEST001", Map.of("keyword", "test"));

        verify(sqlExecutor).executeSelect(any(), eq("selectGrid1"), any());
        verify(sqlExecutor, never()).executeSelectPaged(any(), any(), any());
    }

    @Test
    @DisplayName("selectGrid1 - 페이징 요청 (paging=true + page 파라미터) → executeSelectPaged 호출")
    void selectGrid1_withPaging() {
        ScreenDefinition def = createDef("TEST001", true);
        when(registry.getDefinition("TEST001")).thenReturn(def);
        when(sqlExecutor.executeSelectPaged(any(), eq("selectGrid1"), any()))
                .thenReturn(Map.of("data", List.of(), "totalCount", 100));

        controller.selectGrid1("TEST001", Map.of("page", 1, "pageSize", 50));

        verify(sqlExecutor).executeSelectPaged(any(), eq("selectGrid1"), any());
        verify(sqlExecutor, never()).executeSelect(any(), any(), any());
    }

    @Test
    @DisplayName("selectGrid1 - grids 정의 없으면 페이징 안 함")
    void selectGrid1_noGridDef() {
        ScreenDefinition def = createDef("TEST001", false); // grids = null
        when(registry.getDefinition("TEST001")).thenReturn(def);
        when(sqlExecutor.executeSelect(any(), eq("selectGrid1"), any()))
                .thenReturn(List.of());

        controller.selectGrid1("TEST001", Map.of("page", 1));

        verify(sqlExecutor).executeSelect(any(), eq("selectGrid1"), any());
    }

    // ═══ saveGrid1 - 권한 체크 ═══

    @Test
    @DisplayName("saveGrid1 - auth.save=false → FormaException")
    void saveGrid1_authDenied() {
        ScreenDefinition def = createDef("TEST001", false);
        def.setAuth(Map.of("save", false));
        when(registry.getDefinition("TEST001")).thenReturn(def);

        assertThrows(FormaException.class, () ->
                controller.saveGrid1("TEST001", List.of()));
    }

    @Test
    @DisplayName("saveGrid1 - auth.save=true → 정상")
    void saveGrid1_authAllowed() {
        ScreenDefinition def = createDef("TEST001", false);
        def.setAuth(Map.of("save", true));
        when(registry.getDefinition("TEST001")).thenReturn(def);

        var response = controller.saveGrid1("TEST001", List.of(Map.of("a", "1")));
        assertEquals("OK", response.getResultCode());
        verify(sqlExecutor).executeSave(any(), eq("grid1"), any());
    }

    @Test
    @DisplayName("saveGrid1 - auth=null → 정상 (권한 체크 스킵)")
    void saveGrid1_noAuth() {
        ScreenDefinition def = createDef("TEST001", false);
        def.setAuth(null);
        when(registry.getDefinition("TEST001")).thenReturn(def);

        var response = controller.saveGrid1("TEST001", List.of());
        assertEquals("OK", response.getResultCode());
    }

    // ═══ deleteGrid1 ═══

    @Test
    @DisplayName("deleteGrid1 - auth.delete=false → FormaException")
    void deleteGrid1_authDenied() {
        ScreenDefinition def = createDef("TEST001", false);
        def.setAuth(Map.of("delete", false));
        when(registry.getDefinition("TEST001")).thenReturn(def);

        assertThrows(FormaException.class, () ->
                controller.deleteGrid1("TEST001", List.of()));
    }

    @Test
    @DisplayName("deleteGrid1 - 정상 삭제")
    void deleteGrid1_success() {
        ScreenDefinition def = createDef("TEST001", false);
        def.setAuth(Map.of("delete", true));
        when(registry.getDefinition("TEST001")).thenReturn(def);

        var response = controller.deleteGrid1("TEST001", List.of(Map.of("id", 1)));
        assertEquals("OK", response.getResultCode());
        verify(sqlExecutor).executeDelete(any(), eq("grid1"), any());
    }

    // ═══ reload ═══

    @Test
    @DisplayName("reload - screenIds 반환")
    void reload_success() {
        when(registry.reload()).thenReturn(3);
        when(registry.getScreenIds()).thenReturn(Set.of("A", "B", "C"));

        var response = controller.reload();
        assertEquals("OK", response.getResultCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getResultData();
        assertEquals(3, data.get("count"));
    }
}
