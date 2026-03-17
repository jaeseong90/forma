package com.forma.domain.sales.order;

// Generated from: design/screens/ORD-001.yml

import com.forma.common.base.BaseService;
import com.forma.common.util.BusinessException;
import com.forma.common.util.SeqGenerator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class SalesOrderService extends BaseService {

    private final JdbcTemplate jdbc;
    private final SeqGenerator seq;

    public SalesOrderService(JdbcTemplate jdbc, SeqGenerator seq) {
        this.jdbc = jdbc;
        this.seq = seq;
    }

    @Override protected JdbcTemplate jdbc() { return jdbc; }
    @Override protected String table() { return "tb_sales_order"; }
    @Override protected String pk() { return "order_no"; }
    @Override protected String defaultSort() { return "order_date DESC"; }

    // 설계서 master.columns의 cust_nm은 lookup이므로 JOIN
    @Override
    protected String selectColumns() {
        return "t.*";
    }

    /**
     * 설계서 search 섹션:
     * - order_date: dateRange → from/to
     * - cust_cd: codePopup → =
     * - status: combo multi → IN
     */
    @Override
    protected void appendWhere(StringBuilder sql, List<Object> params, Map<String, String> search) {
        String dateFrom = search.get("order_date_from");
        if (dateFrom != null && !dateFrom.isBlank()) {
            sql.append(" AND t.order_date >= ?");
            params.add(dateFrom);
        }
        String dateTo = search.get("order_date_to");
        if (dateTo != null && !dateTo.isBlank()) {
            sql.append(" AND t.order_date <= ?");
            params.add(dateTo);
        }
        String custCd = search.get("cust_cd");
        if (custCd != null && !custCd.isBlank()) {
            sql.append(" AND t.cust_cd = ?");
            params.add(custCd);
        }
        String status = search.get("status");
        if (status != null && !status.isBlank()) {
            String[] vals = status.split(",");
            sql.append(" AND t.status IN (");
            for (int i = 0; i < vals.length; i++) {
                sql.append(i > 0 ? ",?" : "?");
                params.add(vals[i].trim());
            }
            sql.append(")");
        }
    }

    /** 디테일 품목 조회 */
    public List<Map<String, Object>> getItems(String orderNo) {
        return jdbc.queryForList(
            "SELECT * FROM tb_sales_order_item WHERE order_no = ? ORDER BY seq", orderNo);
    }

    /**
     * 마스터+디테일 동시 저장
     * 설계서: type: master-detail, rules: calc, aggregate
     */
    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> saveAll(Map<String, Object> body) {
        Map<String, Object> master = (Map<String, Object>) body.get("master");
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");

        if (master == null) throw new BusinessException("마스터 데이터가 없습니다");

        // 채번 (설계서: gen: PREFIX_SEQ:ORD)
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

        // 마스터 저장
        save(master);

        // 디테일 저장 (설계서: rules.calc → amount = qty * unit_price)
        if (items != null) {
            long totalAmt = 0;
            for (Map<String, Object> item : items) {
                int qty = toInt(item.get("qty"));
                long price = toLong(item.get("unit_price"));
                long amount = qty * price;
                item.put("amount", amount);
                totalAmt += amount;
            }
            // 설계서: rules.aggregate → SUM(detail.amount) → master.total_amt
            jdbc.update("UPDATE tb_sales_order SET total_amt = ? WHERE order_no = ?", totalAmt, orderNo);

            replaceChildren("tb_sales_order_item", "order_no", orderNo, items);
        }

        return Map.of("success", true, "id", orderNo);
    }

    /**
     * 승인 — 설계서: rules.state
     * DRAFT → CONFIRMED 만 허용
     */
    public void approve(String id) {
        Map<String, Object> order = get(id);
        String status = (String) order.get("STATUS");
        if (status == null) status = (String) order.get("status");
        if (!"DRAFT".equals(status)) {
            throw new BusinessException("작성중 상태에서만 승인 가능합니다 (현재: " + status + ")");
        }
        jdbc.update("UPDATE tb_sales_order SET status = 'CONFIRMED' WHERE order_no = ?", id);
    }

    private int toInt(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return 0; }
    }

    private long toLong(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return 0; }
    }
}
