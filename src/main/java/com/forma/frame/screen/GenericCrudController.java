package com.forma.frame.screen;

import com.forma.frame.annotation.FormaController;
import com.forma.frame.base.BaseResponse;
import com.forma.frame.base.BaseController;
import com.forma.frame.screen.model.ScreenDefinition;
import com.forma.frame.exception.FormaException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@FormaController(value = "/api/screen", pgmId = "SCREEN", description = "Generic CRUD Engine")
@RequiredArgsConstructor
public class GenericCrudController extends BaseController {

    private final ScreenRegistry registry;
    private final DynamicSqlExecutor sqlExecutor;

    @GetMapping("/{screenId}/definition")
    public BaseResponse<ScreenDefinition> getDefinition(@PathVariable String screenId) {
        ScreenDefinition def = registry.getDefinition(screenId);
        if (def == null) {
            return BaseResponse.Warn("화면 정의를 찾을 수 없습니다: " + screenId);
        }
        return BaseResponse.Ok(def);
    }

    @PostMapping("/{screenId}/selectGrid1")
    public BaseResponse<List<Map<String, Object>>> selectGrid1(
            @PathVariable String screenId,
            @RequestBody Map<String, Object> param) {
        ScreenDefinition def = getDefinitionOrThrow(screenId);
        return BaseResponse.Ok(sqlExecutor.executeSelect(def, "selectGrid1", param));
    }

    @PostMapping("/{screenId}/saveGrid1")
    public BaseResponse<?> saveGrid1(
            @PathVariable String screenId,
            @RequestBody List<Map<String, Object>> param) {
        ScreenDefinition def = getDefinitionOrThrow(screenId);
        checkAuth(def, "save");
        sqlExecutor.executeSave(def, "grid1", param);
        return BaseResponse.Ok(param);
    }

    @PostMapping("/{screenId}/selectGrid2")
    public BaseResponse<List<Map<String, Object>>> selectGrid2(
            @PathVariable String screenId,
            @RequestBody Map<String, Object> param) {
        ScreenDefinition def = getDefinitionOrThrow(screenId);
        return BaseResponse.Ok(sqlExecutor.executeSelect(def, "selectGrid2", param));
    }

    @PostMapping("/{screenId}/saveGrid2")
    public BaseResponse<?> saveGrid2(
            @PathVariable String screenId,
            @RequestBody List<Map<String, Object>> param) {
        ScreenDefinition def = getDefinitionOrThrow(screenId);
        checkAuth(def, "save");
        sqlExecutor.executeSave(def, "grid2", param);
        return BaseResponse.Ok(param);
    }

    @PostMapping("/{screenId}/deleteGrid2")
    public BaseResponse<?> deleteGrid2(
            @PathVariable String screenId,
            @RequestBody List<Map<String, Object>> param) {
        ScreenDefinition def = getDefinitionOrThrow(screenId);
        checkAuth(def, "delete");
        sqlExecutor.executeDelete(def, "grid2", param);
        return BaseResponse.Ok(param);
    }

    @PostMapping("/{screenId}/deleteGrid1")
    public BaseResponse<?> deleteGrid1(
            @PathVariable String screenId,
            @RequestBody List<Map<String, Object>> param) {
        ScreenDefinition def = getDefinitionOrThrow(screenId);
        checkAuth(def, "delete");
        sqlExecutor.executeDelete(def, "grid1", param);
        return BaseResponse.Ok(param);
    }

    @GetMapping("/_reload")
    public BaseResponse<Integer> reload() {
        int count = registry.reload();
        return BaseResponse.Ok(count);
    }

    private ScreenDefinition getDefinitionOrThrow(String screenId) {
        ScreenDefinition def = registry.getDefinition(screenId);
        if (def == null) {
            throw new FormaException("Screen not found: " + screenId);
        }
        return def;
    }

    /**
     * YAML auth 섹션 기반 서버 사이드 권한 체크
     */
    private void checkAuth(ScreenDefinition def, String action) {
        if (def.getAuth() != null) {
            Object val = def.getAuth().get(action);
            if (Boolean.FALSE.equals(val)) {
                throw new FormaException("이 화면에서 " + action + " 권한이 없습니다.");
            }
        }
    }
}
