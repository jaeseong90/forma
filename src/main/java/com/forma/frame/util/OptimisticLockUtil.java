package com.forma.frame.util;

import com.forma.frame.exception.FormaException;

import java.util.Map;

/**
 * 낙관적 잠금 유틸리티.
 * updated_at 컬럼 기반으로 동시 수정을 감지한다.
 *
 * 사용법:
 * 1. SELECT 시 updated_at 컬럼을 반드시 포함
 * 2. 프론트에서 수정된 행을 저장할 때 원본 updated_at 값을 함께 전송
 * 3. UPDATE SQL의 WHERE에 updated_at 조건 추가:
 *    UPDATE tb_xxx SET ... WHERE pk = #{pk} AND updated_at = #{_org_updated_at}
 * 4. UPDATE 결과가 0건이면 다른 사용자가 먼저 수정한 것 → 예외 발생
 */
public class OptimisticLockUtil {

    private OptimisticLockUtil() {}

    /**
     * UPDATE/DELETE 결과가 0건인 경우 낙관적 잠금 충돌로 판단
     */
    public static void checkUpdateResult(int affectedRows, String entityName) {
        if (affectedRows == 0) {
            throw new FormaException(
                    entityName + " 데이터가 다른 사용자에 의해 변경되었습니다. 조회 후 다시 시도하세요.");
        }
    }

    /**
     * Map에서 원본 updated_at 추출하여 _org_updated_at으로 세팅
     */
    public static void prepareOptimisticLock(Map<String, Object> data) {
        Object updatedAt = data.get("UPDATED_AT");
        if (updatedAt == null) updatedAt = data.get("updated_at");
        if (updatedAt != null) {
            data.put("_org_updated_at", updatedAt);
        }
    }
}
