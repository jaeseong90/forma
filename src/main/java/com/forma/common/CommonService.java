package com.forma.common;

import com.forma.frame.mybatis.FormaSqlSession;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class CommonService {

    private final FormaSqlSession sql;

    public CommonService(FormaSqlSession sql) {
        this.sql = sql;
    }

    public <E> List<E> selectList(String statement, Object param) {
        return sql.selectList(statement, param);
    }

    public <T> T selectOne(String statement, Object param) {
        return sql.selectOne(statement, param);
    }

    public int insert(String statement, Object param) {
        return sql.insert(statement, param);
    }

    public int update(String statement, Object param) {
        return sql.update(statement, param);
    }

    public int delete(String statement, Object param) {
        return sql.delete(statement, param);
    }

    /** 코드 목록 조회 */
    public List<Map<String, Object>> selectCodeList(String grpCode) {
        return sql.selectList("common.selectCodeList", Map.of("grp_code", grpCode));
    }
}
