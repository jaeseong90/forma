package com.forma.domain.sales.order;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SalesOrderMapper {

    int count(@Param("search") Map<String, String> search);

    List<Map<String, Object>> list(@Param("search") Map<String, String> search,
                                    @Param("limit") int limit,
                                    @Param("offset") int offset);

    Map<String, Object> get(@Param("orderNo") String orderNo);

    int exists(@Param("orderNo") String orderNo);

    void insert(Map<String, Object> data);

    void update(Map<String, Object> data);

    void delete(@Param("orderNo") String orderNo);

    // 디테일
    List<Map<String, Object>> getItems(@Param("orderNo") String orderNo);

    void insertItem(Map<String, Object> item);

    void deleteItems(@Param("orderNo") String orderNo);

    // 비즈니스
    void updateTotalAmt(@Param("orderNo") String orderNo);

    void updateStatus(@Param("orderNo") String orderNo, @Param("status") String status);
}
