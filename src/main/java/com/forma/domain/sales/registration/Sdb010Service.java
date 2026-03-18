package com.forma.domain.sales.registration;

import com.forma.frame.annotation.FormaService;
import com.forma.frame.base.BaseService;
import com.forma.frame.exception.FormaException;
import com.forma.frame.mybatis.FormaSqlSession;
import com.forma.frame.util.SeqGenerator;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@FormaService(pgmId = "SDB010", description = "수주등록")
public class Sdb010Service extends BaseService {

    private final FormaSqlSession sql;
    private final SeqGenerator seq;
    private final String ns = "sdb010";

    public Sdb010Service(FormaSqlSession sql, SeqGenerator seq) {
        this.sql = sql;
        this.seq = seq;
    }

    public List<Map<String, Object>> selectGrid1(Map<String, Object> param) {
        return sql.selectList(ns + ".selectGrid1", param);
    }

    public Map<String, Object> selectMaster(Map<String, Object> param) {
        return sql.selectOne(ns + ".selectMaster", param);
    }

    public List<Map<String, Object>> selectGrid2(Map<String, Object> param) {
        return sql.selectList(ns + ".selectGrid2", param);
    }

    public List<Map<String, Object>> selectGrid3(Map<String, Object> param) {
        return sql.selectList(ns + ".selectGrid3", param);
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> saveMaster(Map<String, Object> param) {
        Map<String, Object> master = (Map<String, Object>) param.get("master");
        List<Map<String, Object>> items = (List<Map<String, Object>>) param.get("items");

        if (master == null) throw new FormaException("마스터 데이터가 없습니다");

        String orderNo = (String) master.get("order_no");
        boolean isNew = (orderNo == null || orderNo.isBlank());

        if (isNew) {
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
            sql.update(ns + ".updateMaster", master);
        } else {
            sql.insert(ns + ".insertMaster", master);
        }

        // items: delete + re-insert
        if (items != null) {
            sql.delete(ns + ".deleteItemsByOrderNo", Map.of("order_no", orderNo));
            int seqNo = 1;
            for (Map<String, Object> item : items) {
                item.put("order_no", orderNo);
                item.put("seq", seqNo++);
                long qty = toLong(item.get("QTY"));
                long price = toLong(item.get("UNIT_PRICE"));
                item.put("amount", qty * price);
                item.put("item_cd", item.getOrDefault("ITEM_CD", item.get("item_cd")));
                item.put("item_nm", item.getOrDefault("ITEM_NM", item.get("item_nm")));
                item.put("qty", qty);
                item.put("unit_price", price);
                item.putIfAbsent("user_id", master.get("user_id"));
                sql.insert(ns + ".insertItem", item);
            }
            sql.update(ns + ".updateTotalAmt", Map.of("order_no", orderNo));
        }

        // 이력
        String action = isNew ? "생성" : "저장";
        String detail = isNew ? "수주 신규 생성" : "수주 정보 저장";
        sql.insert(ns + ".insertHistory", Map.of(
                "order_no", orderNo,
                "action", action,
                "action_detail", detail,
                "user_id", master.getOrDefault("user_id", "system")
        ));

        return Map.of("success", true, "id", orderNo);
    }

    @Transactional
    public void deleteMaster(Map<String, Object> param) {
        String orderNo = (String) param.get("order_no");
        sql.delete(ns + ".deleteItemsByOrderNo", Map.of("order_no", orderNo));
        sql.delete(ns + ".deleteHistoryByOrderNo", Map.of("order_no", orderNo));
        sql.delete(ns + ".deleteMaster", Map.of("order_no", orderNo));
    }

    @Transactional
    public void approve(Map<String, Object> param) {
        String orderNo = (String) param.get("order_no");
        Map<String, Object> order = sql.selectOne(ns + ".selectMaster", Map.of("order_no", orderNo));
        if (order == null) throw new FormaException("수주를 찾을 수 없습니다");
        if (!"DRAFT".equals(order.get("STATUS"))) {
            throw new FormaException("작성중 상태에서만 승인 가능합니다");
        }
        sql.update(ns + ".updateStatus", Map.of("order_no", orderNo, "status", "CONFIRMED"));

        sql.insert(ns + ".insertHistory", Map.of(
                "order_no", orderNo,
                "action", "승인",
                "action_detail", "수주 승인 처리",
                "user_id", param.getOrDefault("user_id", "system")
        ));
    }

    private long toLong(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return 0; }
    }
}
