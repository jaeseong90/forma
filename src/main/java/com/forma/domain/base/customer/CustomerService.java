package com.forma.domain.base.customer;

// Generated from: design/screens/CUS-001.yml

import com.forma.common.base.BaseService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class CustomerService extends BaseService {

    private final JdbcTemplate jdbc;

    public CustomerService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override protected JdbcTemplate jdbc() { return jdbc; }
    @Override protected String table() { return "tb_customer"; }
    @Override protected String pk() { return "cust_cd"; }
    @Override protected String selectColumns() { return "t.*"; }
    @Override protected String defaultSort() { return "cust_cd ASC"; }

    /**
     * 설계서 search 섹션에서 생성된 검색 조건:
     * - cust_cd: text → LIKE 검색
     * - cust_nm: text → LIKE 검색
     * - cust_type: combo → = 조건
     */
    @Override
    protected void appendWhere(StringBuilder sql, List<Object> params, Map<String, String> search) {
        String custCd = search.get("cust_cd");
        if (custCd != null && !custCd.isBlank()) {
            sql.append(" AND t.cust_cd LIKE ?");
            params.add("%" + custCd + "%");
        }

        String custNm = search.get("cust_nm");
        if (custNm != null && !custNm.isBlank()) {
            sql.append(" AND t.cust_nm LIKE ?");
            params.add("%" + custNm + "%");
        }

        String custType = search.get("cust_type");
        if (custType != null && !custType.isBlank()) {
            sql.append(" AND t.cust_type = ?");
            params.add(custType);
        }
    }
}
