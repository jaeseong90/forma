package com.forma;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import jakarta.servlet.http.Cookie;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * FORMA 프레임워크 핵심 통합 테스트.
 * 서버 기동 → 로그인 → YAML 엔진 → 권한 → 관리자 API 검증.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class FormaIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;

    private Cookie login() throws Exception {
        MvcResult result = mvc.perform(post("/login/loginProcess")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":\"admin\",\"password\":\"\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return result.getResponse().getCookie("X_FORMA_TOKEN");
    }

    // ═══ 1. 서버 기동 ═══

    @Test @Order(1)
    void serverStarts() throws Exception {
        mvc.perform(get("/login.html"))
                .andExpect(status().isOk());
    }

    @Test @Order(2)
    void indexPageLoads() throws Exception {
        mvc.perform(get("/"))
                .andExpect(status().isOk());
    }

    // ═══ 2. 로그인 ═══

    @Test @Order(10)
    void loginSuccess() throws Exception {
        mvc.perform(post("/login/loginProcess")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":\"admin\",\"password\":\"\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value("OK"))
                .andExpect(jsonPath("$.resultData.userId").value("admin"));
    }

    @Test @Order(11)
    void loginEmptyPasswordAllowedInDevMode() throws Exception {
        // 개발 모드: 저장된 비밀번호가 비어있으면 어떤 비밀번호든 통과
        mvc.perform(post("/login/loginProcess")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":\"admin\",\"password\":\"anything\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value("OK"));
    }

    @Test @Order(12)
    void loginFailUnknownUser() throws Exception {
        mvc.perform(post("/login/loginProcess")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":\"nobody\",\"password\":\"\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value("WARN"));
    }

    // ═══ 3. YAML 엔진 ═══

    @Test @Order(20)
    void yamlScreenDefinition() throws Exception {
        Cookie c = login();
        mvc.perform(get("/api/screen/SDA010/definition").cookie(c))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultData.screen.id").value("SDA010"))
                .andExpect(jsonPath("$.resultData.screen.type").value("list"));
    }

    @Test @Order(21)
    void yamlScreenReload() throws Exception {
        Cookie c = login();
        mvc.perform(get("/api/screen/_reload").cookie(c))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultData.count").value(5))
                .andExpect(jsonPath("$.resultData.screenIds").isArray());
    }

    @Test @Order(22)
    void yamlSelectGrid1() throws Exception {
        Cookie c = login();
        mvc.perform(post("/api/screen/SDA010/selectGrid1").cookie(c)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value("OK"))
                .andExpect(jsonPath("$.resultData").isArray());
    }

    @Test @Order(23)
    void yamlSplitDetailSelectGrid2() throws Exception {
        Cookie c = login();
        // SDA020 split-detail: selectGrid2 with master key filter
        mvc.perform(post("/api/screen/SDA020/selectGrid2").cookie(c)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"egrp_code\":\"SHIP\",\"ser\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value("OK"))
                .andExpect(jsonPath("$.resultData").isArray())
                .andExpect(jsonPath("$.resultData.length()").value(7));
    }

    @Test @Order(24)
    void yamlMasterDetailSelectGrid2() throws Exception {
        Cookie c = login();
        mvc.perform(post("/api/screen/SOA010/selectGrid2").cookie(c)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"order_no\":\"ORD-20260317-001\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultData[0].ITEM_NM").exists());
    }

    // ═══ 4. 권한 ═══

    @Test @Order(30)
    void pgmInitReturnsAuthForAdmin() throws Exception {
        Cookie c = login();
        mvc.perform(get("/api/pgm/SDA010/init").cookie(c))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultData.pgmAuth.SRCH_YN").value("Y"))
                .andExpect(jsonPath("$.resultData.pgmAuth.SAVE_YN").value("Y"));
    }

    @Test @Order(31)
    void menuListReturnsForLoggedInUser() throws Exception {
        Cookie c = login();
        mvc.perform(get("/api/pgm/menus").cookie(c))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultData").isArray())
                .andExpect(jsonPath("$.resultData.length()").value(org.hamcrest.Matchers.greaterThan(5)));
    }

    // ═══ 5. 관리자 API ═══

    @Test @Order(40)
    void adminUserList() throws Exception {
        Cookie c = login();
        mvc.perform(post("/api/admin/users").cookie(c)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultData").isArray())
                .andExpect(jsonPath("$.resultData.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(4)));
    }

    @Test @Order(41)
    void adminRoleList() throws Exception {
        Cookie c = login();
        mvc.perform(post("/api/admin/roles").cookie(c)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultData[0].ROLE_CD").exists());
    }

    @Test @Order(42)
    void adminMenuList() throws Exception {
        Cookie c = login();
        mvc.perform(post("/api/admin/menus").cookie(c)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultData").isArray());
    }

    @Test @Order(43)
    void adminProgramList() throws Exception {
        Cookie c = login();
        mvc.perform(post("/api/admin/programs").cookie(c)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultData").isArray());
    }

    // ═══ 6. 공통 팝업 ═══

    @Test @Order(50)
    void popupCustomerSearch() throws Exception {
        Cookie c = login();
        mvc.perform(post("/api/popup/customer").cookie(c)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"keyword\":\"삼성\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultData[0].CUST_NM").value("삼성전자"));
    }

    @Test @Order(51)
    void popupItemSearch() throws Exception {
        Cookie c = login();
        mvc.perform(post("/api/popup/item").cookie(c)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"item_grp\":\"PROD\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultData.length()").value(2));
    }

    // ═══ 7. XLSX 다운로드 ═══

    @Test @Order(60)
    void excelDownload() throws Exception {
        Cookie c = login();
        mvc.perform(post("/api/excel/download").cookie(c)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fileName\":\"test\",\"columns\":[{\"field\":\"a\",\"label\":\"A\"}],\"data\":[{\"a\":\"1\"}]}"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("test.xlsx")));
    }

    // ═══ 8. 코드 조회 ═══

    @Test @Order(70)
    void codeList() throws Exception {
        Cookie c = login();
        mvc.perform(get("/api/codes/CUST_TYPE").cookie(c))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultData").isArray())
                .andExpect(jsonPath("$.resultData.length()").value(3));
    }
}
