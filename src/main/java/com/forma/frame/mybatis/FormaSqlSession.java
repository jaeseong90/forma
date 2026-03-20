package com.forma.frame.mybatis;

import com.forma.frame.auth.DataAuthContext;
import org.apache.ibatis.executor.BatchResult;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.sql.Statement;
import java.util.*;

@Component
public class FormaSqlSession {

    private static final int DEFAULT_BATCH_SIZE = 500;

    private final SqlSessionTemplate simple;
    private final SqlSessionTemplate batch;

    public FormaSqlSession(
            @Qualifier("primarySqlSession") SqlSessionTemplate simple,
            @Qualifier("primaryBatchSqlSession") SqlSessionTemplate batch) {
        this.simple = simple;
        this.batch = batch;
    }

    // ==================== SIMPLE ====================

    public <T> T selectOne(String statement) {
        return simple.selectOne(statement, injectAuthParams(null));
    }

    public <T> T selectOne(String statement, Object param) {
        return simple.selectOne(statement, injectAuthParams(param));
    }

    public <T> Optional<T> selectOneOptional(String statement, Object param) {
        return Optional.ofNullable(simple.selectOne(statement, injectAuthParams(param)));
    }

    public <E> List<E> selectList(String statement) {
        return simple.selectList(statement, injectAuthParams(null));
    }

    public <E> List<E> selectList(String statement, Object param) {
        return simple.selectList(statement, injectAuthParams(param));
    }

    /**
     * SELECT 파라미터에 데이터 권한 컨텍스트를 자동 주입한다.
     * _userId, _userDept, _deptList, _dataAuthType, _isAdmin
     */
    @SuppressWarnings("unchecked")
    private Object injectAuthParams(Object param) {
        Map<String, Object> authParams = DataAuthContext.get();
        if (authParams == null || authParams.isEmpty()) {
            return param;
        }
        if (param == null) {
            return new HashMap<>(authParams);
        }
        if (param instanceof Map) {
            Map<String, Object> map = new HashMap<>((Map<String, Object>) param);
            map.putAll(authParams);
            return map;
        }
        return param;
    }

    public int insert(String statement, Object param) {
        return simple.insert(statement, param);
    }

    public int update(String statement, Object param) {
        return simple.update(statement, param);
    }

    public int delete(String statement, Object param) {
        return simple.delete(statement, param);
    }

    // ==================== BATCH ====================

    public <E> List<BatchResult> insertBatchList(String statement, List<E> list) {
        return insertBatchList(statement, list, DEFAULT_BATCH_SIZE);
    }

    public <E> List<BatchResult> insertBatchList(String statement, List<E> list, int batchSize) {
        List<BatchResult> results = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            batch.insert(statement, list.get(i));
            if ((i + 1) % batchSize == 0) {
                results.addAll(batch.flushStatements());
            }
        }
        results.addAll(batch.flushStatements());
        return results;
    }

    public <E> List<BatchResult> updateBatchList(String statement, List<E> list) {
        List<BatchResult> results = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            batch.update(statement, list.get(i));
            if ((i + 1) % DEFAULT_BATCH_SIZE == 0) {
                results.addAll(batch.flushStatements());
            }
        }
        results.addAll(batch.flushStatements());
        return results;
    }

    public <E> List<BatchResult> deleteBatchList(String statement, List<E> list) {
        List<BatchResult> results = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            batch.delete(statement, list.get(i));
            if ((i + 1) % DEFAULT_BATCH_SIZE == 0) {
                results.addAll(batch.flushStatements());
            }
        }
        results.addAll(batch.flushStatements());
        return results;
    }

    public List<BatchResult> flushBatch() {
        return batch.flushStatements();
    }

    public int affectedRows(List<BatchResult> results) {
        int total = 0;
        for (BatchResult br : results) {
            for (int count : br.getUpdateCounts()) {
                if (count >= 0) total += count;
                else if (count == Statement.SUCCESS_NO_INFO) total++;
            }
        }
        return total;
    }

    public boolean hasExecuteFailed(List<BatchResult> results) {
        for (BatchResult br : results) {
            for (int count : br.getUpdateCounts()) {
                if (count == Statement.EXECUTE_FAILED) return true;
            }
        }
        return false;
    }
}
