package com.forma.frame.screen;

import com.forma.frame.screen.model.ScreenDefinition;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ScreenRegistry 단위 테스트.
 * - YAML 로딩 (classpath의 실제 YAML 파일 사용)
 * - 조회/존재 여부/reload
 */
class ScreenRegistryTest {

    @Test
    @DisplayName("loadScreens - classpath의 YAML 파일 로딩")
    void loadScreens_loadsFromClasspath() {
        ScreenRegistry registry = new ScreenRegistry();
        registry.loadScreens();

        // design/screens/*.yml 에 등록된 화면이 있어야 함
        Set<String> ids = registry.getScreenIds();
        assertFalse(ids.isEmpty(), "최소 1개 이상의 YAML 화면이 로딩되어야 함");
    }

    @Test
    @DisplayName("getDefinition - 존재하는 화면")
    void getDefinition_existing() {
        ScreenRegistry registry = new ScreenRegistry();
        registry.loadScreens();

        // SDA010 (거래처관리)는 YAML로 정의되어 있어야 함
        ScreenDefinition def = registry.getDefinition("SDA010");
        assertNotNull(def);
        assertEquals("SDA010", def.getScreen().getId());
    }

    @Test
    @DisplayName("getDefinition - 미존재 화면 → null")
    void getDefinition_notExisting() {
        ScreenRegistry registry = new ScreenRegistry();
        registry.loadScreens();

        assertNull(registry.getDefinition("NONEXISTENT"));
    }

    @Test
    @DisplayName("hasDefinition - true/false")
    void hasDefinition() {
        ScreenRegistry registry = new ScreenRegistry();
        registry.loadScreens();

        assertTrue(registry.hasDefinition("SDA010"));
        assertFalse(registry.hasDefinition("NONEXISTENT"));
    }

    @Test
    @DisplayName("reload - 화면 수 반환")
    void reload_returnsCount() {
        ScreenRegistry registry = new ScreenRegistry();
        registry.loadScreens();

        int count = registry.reload();
        assertTrue(count > 0);
        assertEquals(count, registry.getScreenIds().size());
    }

    @Test
    @DisplayName("reload 후 기존 화면 여전히 접근 가능")
    void reload_dataIntact() {
        ScreenRegistry registry = new ScreenRegistry();
        registry.loadScreens();

        Set<String> beforeIds = Set.copyOf(registry.getScreenIds());
        registry.reload();
        Set<String> afterIds = registry.getScreenIds();

        assertEquals(beforeIds, afterIds);
    }
}
