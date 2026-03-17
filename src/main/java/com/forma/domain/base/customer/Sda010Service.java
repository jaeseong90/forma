package com.forma.domain.base.customer;

import com.forma.frame.annotation.FormaService;
import com.forma.frame.base.BaseService;
import com.forma.frame.mybatis.FormaSqlSession;
import com.forma.frame.util.Constants;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@FormaService(pgmId = "SDA010", description = "거래처관리")
public class Sda010Service extends BaseService {

    private final FormaSqlSession sql;
    private final String ns = "sda010";

    public Sda010Service(FormaSqlSession sql) {
        this.sql = sql;
    }

    public List<Map<String, Object>> selectGrid1(Map<String, Object> param) {
        return sql.selectList(ns + ".selectGrid1", param);
    }

    @Transactional
    public void saveGrid1(List<Map<String, Object>> param) {
        for (Map<String, Object> item : param) {
            if (Constants.GSTAT_INSERT.equals(item.get(Constants.GSTAT))) {
                sql.insert(ns + ".insertGrid1", item);
            } else {
                sql.update(ns + ".updateGrid1", item);
            }
        }
    }

    @Transactional
    public void deleteGrid1(List<Map<String, Object>> param) {
        for (Map<String, Object> item : param) {
            sql.delete(ns + ".deleteGrid1", item);
        }
    }
}
