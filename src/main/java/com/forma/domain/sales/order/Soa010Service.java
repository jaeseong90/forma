package com.forma.domain.sales.order;

import com.forma.frame.annotation.FormaService;
import com.forma.frame.base.BaseService;
import com.forma.frame.exception.FormaException;
import com.forma.frame.mybatis.FormaSqlSession;
import com.forma.frame.util.Constants;
import com.forma.frame.util.SeqGenerator;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@FormaService(pgmId = "SOA010", description = "수주관리")
public class Soa010Service extends BaseService {

    private final FormaSqlSession sql;
    private final SeqGenerator seq;
    private final String ns = "soa010";

    public Soa010Service(FormaSqlSession sql, SeqGenerator seq) {
        this.sql = sql;
        this.seq = seq;
    }

    public List<Map<String, Object>> selectGrid1(Map<String, Object> param) {
        return sql.selectList(ns + ".selectGrid1", param);
    }

    public List<Map<String, Object>> selectGrid2(Map<String, Object> param) {
        return sql.selectList(ns + ".selectGrid2", param);
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> saveAll(Map<String, Object> param) {
        Map<String, Object> master = (Map<String, Object>) param.get("master");
        List<Map<String, Object>> items = (List<Map<String, Object>>) param.get("items");

        if (master == null) throw new FormaException("마스터 데이터가 없습니다");

        String orderNo = (String) master.get("order_no");
        if (orderNo == null || orderNo.isBlank()) {
            orderNo = seq.next("ORD");
            master.put("order_no", orderNo);
        }
        if (master.get("order_date") == null) {
            master.put("order_date", LocalDate.now().toString());
        }
        if (master.get("status") == null) {
            master.put("status", "DRAFT");
        }

        // master upsert
        Integer cnt = sql.selectOne(ns + ".existsMaster", master);
        if (cnt != null && cnt > 0) {
            sql.update(ns + ".updateGrid1", master);
        } else {
            sql.insert(ns + ".insertGrid1", master);
        }

        // items: delete + re-insert
        if (items != null) {
            sql.delete(ns + ".deleteGrid2ByOrderNo", Map.of("order_no", orderNo));
            int seqNo = 1;
            for (Map<String, Object> item : items) {
                item.put("order_no", orderNo);
                item.put("seq", seqNo++);
                long qty = toLong(item.get("qty"));
                long price = toLong(item.get("unit_price"));
                item.put("amount", qty * price);
                item.putIfAbsent("user_id", master.get("user_id"));
                sql.insert(ns + ".insertGrid2", item);
            }
            sql.update(ns + ".updateTotalAmt", Map.of("order_no", orderNo));
        }

        return Map.of("success", true, "id", orderNo);
    }

    @Transactional
    public void deleteGrid1(List<Map<String, Object>> param) {
        for (Map<String, Object> item : param) {
            String orderNo = (String) item.get("order_no");
            sql.delete(ns + ".deleteGrid2ByOrderNo", Map.of("order_no", orderNo));
            sql.delete(ns + ".deleteGrid1", item);
        }
    }

    public void approve(Map<String, Object> param) {
        String orderNo = (String) param.get("order_no");
        Map<String, Object> order = sql.selectOne(ns + ".selectOne", Map.of("order_no", orderNo));
        if (order == null) throw new FormaException("수주를 찾을 수 없습니다");
        if (!"DRAFT".equals(order.get("status"))) {
            throw new FormaException("작성중 상태에서만 승인 가능합니다");
        }
        sql.update(ns + ".updateStatus", Map.of("order_no", orderNo, "status", "CONFIRMED"));
    }

    private long toLong(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return 0; }
    }
}
