package com.forma.domain.base.customer;

import com.forma.common.model.PageResult;
import com.forma.common.util.AuthContext;
import com.forma.common.util.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class CustomerService {

    private final CustomerMapper mapper;

    public CustomerService(CustomerMapper mapper) {
        this.mapper = mapper;
    }

    public PageResult<Map<String, Object>> list(Map<String, String> search) {
        int page = Integer.parseInt(search.getOrDefault("_page", "1"));
        int size = Integer.parseInt(search.getOrDefault("_size", "50"));
        int offset = (page - 1) * size;

        int total = mapper.count(search);
        List<Map<String, Object>> data = mapper.list(search, size, offset);

        return PageResult.of(data, total, page, size);
    }

    public Map<String, Object> get(String custCd) {
        Map<String, Object> row = mapper.get(custCd);
        if (row == null) throw new BusinessException("데이터를 찾을 수 없습니다: " + custCd);
        return row;
    }

    @Transactional
    public Map<String, Object> save(Map<String, Object> data) {
        String custCd = (String) data.get("cust_cd");
        if (custCd == null || custCd.isBlank()) {
            throw new BusinessException("거래처코드는 필수입니다");
        }

        String user = AuthContext.getCurrentUser();
        data.put("updated_by", user);

        if (mapper.exists(custCd) > 0) {
            mapper.update(data);
        } else {
            data.put("created_by", user);
            mapper.insert(data);
        }

        return Map.of("success", true, "id", custCd);
    }

    @Transactional
    public void delete(String custCd) {
        if (mapper.exists(custCd) == 0) {
            throw new BusinessException("삭제할 데이터가 없습니다: " + custCd);
        }
        mapper.delete(custCd);
    }
}
