package com.forma.domain.base.estimate;

import com.forma.frame.annotation.FormaService;
import com.forma.frame.base.BaseService;
import com.forma.frame.mybatis.FormaSqlSession;
import com.forma.frame.util.Constants;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@FormaService(pgmId = "SDA020", description = "견적템플릿관리")
public class Sda020Service extends BaseService {

    private final FormaSqlSession sql;
    private final String ns = "sda020";

    public Sda020Service(FormaSqlSession sql) {
        this.sql = sql;
    }

    public List<Map<String, Object>> selectGrid1(Map<String, Object> param) {
        return sql.selectList(ns + ".selectGrid1", param);
    }

    public List<Map<String, Object>> selectGrid2(Map<String, Object> param) {
        return sql.selectList(ns + ".selectGrid2", param);
    }

    @Transactional
    public void saveGrid2(List<Map<String, Object>> param) {
        for (Map<String, Object> item : param) {
            if (Constants.GSTAT_INSERT.equals(item.get(Constants.GSTAT))) {
                sql.insert(ns + ".insertGrid2", item);
            } else {
                sql.update(ns + ".updateGrid2", item);
            }
        }
    }

    @Transactional
    public void deleteGrid2(List<Map<String, Object>> param) {
        for (Map<String, Object> item : param) {
            sql.delete(ns + ".deleteGrid2", item);
        }
    }
}
