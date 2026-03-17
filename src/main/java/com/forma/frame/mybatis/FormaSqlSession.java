package com.forma.frame.mybatis;

import org.apache.ibatis.executor.BatchResult;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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
        return simple.selectOne(statement);
    }

    public <T> T selectOne(String statement, Object param) {
        return simple.selectOne(statement, param);
    }

    public <T> Optional<T> selectOneOptional(String statement, Object param) {
        return Optional.ofNullable(simple.selectOne(statement, param));
    }

    public <E> List<E> selectList(String statement) {
        return simple.selectList(statement);
    }

    public <E> List<E> selectList(String statement, Object param) {
        return simple.selectList(statement, param);
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
