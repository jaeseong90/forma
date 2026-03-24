package com.forma.frame.auth;

import com.forma.frame.mybatis.FormaSqlSession;
import com.forma.login.LoginUserVo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * DataAuthService 단위 테스트.
 * - 관리자/일반 사용자 권한 파라미터 구성
 * - 부서 트리 해석
 * - 캐시 동작
 */
@ExtendWith(MockitoExtension.class)
class DataAuthServiceTest {

    @Mock
    private FormaSqlSession sql;

    private DataAuthService service;

    @BeforeEach
    void setUp() {
        service = new DataAuthService(sql);
    }

    private LoginUserVo createUser(String userId, String deptCode, boolean admin) {
        LoginUserVo user = new LoginUserVo();
        user.setUserId(userId);
        user.setUserDeptCode(deptCode);
        user.setAdmin(admin);
        return user;
    }

    // ═══ buildAuthParams - 관리자 ═══

    @Test
    @DisplayName("관리자 → _dataAuthType=ALL, DB 조회 안 함")
    void buildAuthParams_admin() {
        LoginUserVo admin = createUser("admin", "D001", true);
        Map<String, Object> params = service.buildAuthParams(admin);

        assertEquals("ALL", params.get("_dataAuthType"));
        assertEquals("admin", params.get("_userId"));
        assertEquals("D001", params.get("_userDept"));
        assertEquals(true, params.get("_isAdmin"));
        // FormaSqlSession 호출 없어야 함
        verifyNoInteractions(sql);
    }

    // ═══ buildAuthParams - 일반 사용자 ═══

    @Test
    @DisplayName("일반 사용자 - AUTH_TYPE=USER (기본값)")
    void buildAuthParams_defaultUser() {
        LoginUserVo user = createUser("user01", "D002", false);
        when(sql.selectList(eq("login.selectDataAuth"), anyMap())).thenReturn(Collections.emptyList());

        Map<String, Object> params = service.buildAuthParams(user);

        assertEquals("USER", params.get("_dataAuthType"));
        assertNull(params.get("_deptList"));
    }

    @Test
    @DisplayName("일반 사용자 - AUTH_TYPE=DEPT")
    void buildAuthParams_dept() {
        LoginUserVo user = createUser("user01", "D002", false);
        when(sql.selectList(eq("login.selectDataAuth"), anyMap()))
                .thenReturn(List.of(Map.of("AUTH_TYPE", "DEPT")));

        Map<String, Object> params = service.buildAuthParams(user);

        assertEquals("DEPT", params.get("_dataAuthType"));
        assertNull(params.get("_deptList")); // DEPT는 _deptList 불필요
    }

    @Test
    @DisplayName("일반 사용자 - AUTH_TYPE=ALL")
    void buildAuthParams_allAuth() {
        LoginUserVo user = createUser("user01", "D002", false);
        when(sql.selectList(eq("login.selectDataAuth"), anyMap()))
                .thenReturn(List.of(Map.of("AUTH_TYPE", "ALL")));

        Map<String, Object> params = service.buildAuthParams(user);

        assertEquals("ALL", params.get("_dataAuthType"));
    }

    @Test
    @DisplayName("일반 사용자 - AUTH_TYPE=DEPT_SUB → 하위 부서 포함")
    void buildAuthParams_deptSub() {
        LoginUserVo user = createUser("user01", "D001", false);
        when(sql.selectList(eq("login.selectDataAuth"), anyMap()))
                .thenReturn(List.of(Map.of("AUTH_TYPE", "DEPT_SUB")));
        // 부서 트리: D001 → D002, D003; D002 → D004
        when(sql.selectList("common.selectAllDepts")).thenReturn(List.of(
                Map.of("DEPT_CODE", "D001", "PARENT_CODE", "ROOT"),
                Map.of("DEPT_CODE", "D002", "PARENT_CODE", "D001"),
                Map.of("DEPT_CODE", "D003", "PARENT_CODE", "D001"),
                Map.of("DEPT_CODE", "D004", "PARENT_CODE", "D002")
        ));

        Map<String, Object> params = service.buildAuthParams(user);

        assertEquals("DEPT_SUB", params.get("_dataAuthType"));
        @SuppressWarnings("unchecked")
        List<String> deptList = (List<String>) params.get("_deptList");
        assertNotNull(deptList);
        assertTrue(deptList.contains("D001"));
        assertTrue(deptList.contains("D002"));
        assertTrue(deptList.contains("D003"));
        assertTrue(deptList.contains("D004"));
        assertEquals(4, deptList.size());
    }

    // ═══ resolveChildDepts ═══

    @Test
    @DisplayName("하위 부서 없음 → 자기 자신만")
    void resolveChildDepts_noChildren() {
        when(sql.selectList("common.selectAllDepts")).thenReturn(List.of(
                Map.of("DEPT_CODE", "D001", "PARENT_CODE", "ROOT")
        ));

        List<String> result = service.resolveChildDepts("D001");

        assertEquals(List.of("D001"), result);
    }

    @Test
    @DisplayName("하위 부서 존재 → 재귀 수집")
    void resolveChildDepts_withChildren() {
        when(sql.selectList("common.selectAllDepts")).thenReturn(List.of(
                Map.of("DEPT_CODE", "D001", "PARENT_CODE", "ROOT"),
                Map.of("DEPT_CODE", "D002", "PARENT_CODE", "D001"),
                Map.of("DEPT_CODE", "D003", "PARENT_CODE", "D002")
        ));

        List<String> result = service.resolveChildDepts("D001");

        assertEquals(3, result.size());
        assertEquals("D001", result.get(0)); // 자기 자신이 먼저
        assertTrue(result.contains("D002"));
        assertTrue(result.contains("D003"));
    }

    @Test
    @DisplayName("캐시 동작 - 두 번 호출 시 DB 1회만")
    void resolveChildDepts_cache() {
        when(sql.selectList("common.selectAllDepts")).thenReturn(List.of(
                Map.of("DEPT_CODE", "D001", "PARENT_CODE", "ROOT")
        ));

        service.resolveChildDepts("D001");
        service.resolveChildDepts("D001"); // 캐시 히트

        verify(sql, times(1)).selectList("common.selectAllDepts");
    }

    @Test
    @DisplayName("존재하지 않는 부서코드 → 자기 자신만 반환")
    void resolveChildDepts_unknownDept() {
        when(sql.selectList("common.selectAllDepts")).thenReturn(List.of(
                Map.of("DEPT_CODE", "D001", "PARENT_CODE", "ROOT")
        ));

        List<String> result = service.resolveChildDepts("UNKNOWN");

        assertEquals(List.of("UNKNOWN"), result);
    }

    // ═══ null selectDataAuth ═══

    @Test
    @DisplayName("selectDataAuth null 반환 → USER 기본값")
    void buildAuthParams_nullAuthList() {
        LoginUserVo user = createUser("user01", "D002", false);
        when(sql.selectList(eq("login.selectDataAuth"), anyMap())).thenReturn(null);

        Map<String, Object> params = service.buildAuthParams(user);

        assertEquals("USER", params.get("_dataAuthType"));
    }
}
