package com.forma.domain.sales.order;

import com.forma.common.model.PageResult;
import com.forma.common.util.AuthContext;
import com.forma.common.util.BusinessException;
import com.forma.common.util.SeqGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class SalesOrderService {

    private final SalesOrderMapper mapper;
    private final SeqGenerator seq;

    public SalesOrderService(SalesOrderMapper mapper, SeqGenerator seq) {
        this.mapper = mapper;
        this.seq = seq;
    }

    /** 목록 조회 */
    public PageResult<Map<String, Object>> list(Map<String, String> search) {
        int page = Integer.parseInt(search.getOrDefault("_page", "1"));
        int size = Integer.parseInt(search.getOrDefault("_size", "50"));
        int offset = (page - 1) * size;

        int total = mapper.count(search);
        List<Map<String, Object>> data = mapper.list(search, size, offset);

        return PageResult.of(data, total, page, size);
    }

    /** 단건 조회 */
    public Map<String, Object> get(String orderNo) {
        Map<String, Object> row = mapper.get(orderNo);
        if (row == null) throw new BusinessException("데이터를 찾을 수 없습니다: " + orderNo);
        return row;
    }

    /** 디테일 품목 조회 */
    public List<Map<String, Object>> getItems(String orderNo) {
        return mapper.getItems(orderNo);
    }

    /** 마스터+디테일 동시 저장 */
    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> saveAll(Map<String, Object> body) {
        Map<String, Object> master = (Map<String, Object>) body.get("master");
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");

        if (master == null) throw new BusinessException("마스터 데이터가 없습니다");

        // 채번
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

        // 감사 필드
        String user = AuthContext.getCurrentUser();
        master.put("updated_by", user);

        // 마스터 저장
        if (mapper.exists(orderNo) > 0) {
            mapper.update(master);
        } else {
            master.put("created_by", user);
            mapper.insert(master);
        }

        // 디테일 저장
        if (items != null) {
            mapper.deleteItems(orderNo);
            int seqNo = 1;
            for (Map<String, Object> item : items) {
                item.put("order_no", orderNo);
                item.put("seq", seqNo++);
                long qty = toLong(item.get("qty"));
                long price = toLong(item.get("unit_price"));
                item.put("amount", qty * price);
                item.put("created_by", user);
                item.put("updated_by", user);
                mapper.insertItem(item);
            }
            mapper.updateTotalAmt(orderNo);
        }

        return Map.of("success", true, "id", orderNo);
    }

    /** 삭제 */
    @Transactional
    public void delete(String orderNo) {
        if (mapper.exists(orderNo) == 0) {
            throw new BusinessException("삭제할 데이터가 없습니다: " + orderNo);
        }
        mapper.deleteItems(orderNo);
        mapper.delete(orderNo);
    }

    /** 승인 */
    @Transactional
    public void approve(String orderNo) {
        Map<String, Object> order = get(orderNo);
        String status = (String) order.get("STATUS");
        if (status == null) status = (String) order.get("status");
        if (!"DRAFT".equals(status)) {
            throw new BusinessException("작성중 상태에서만 승인 가능합니다 (현재: " + status + ")");
        }
        mapper.updateStatus(orderNo, "CONFIRMED");
    }

    private long toLong(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return 0; }
    }
}
