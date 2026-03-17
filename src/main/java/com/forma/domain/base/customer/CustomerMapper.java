package com.forma.domain.base.customer;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CustomerMapper {

    int count(@Param("search") Map<String, String> search);

    List<Map<String, Object>> list(@Param("search") Map<String, String> search,
                                    @Param("limit") int limit,
                                    @Param("offset") int offset);

    Map<String, Object> get(@Param("custCd") String custCd);

    int exists(@Param("custCd") String custCd);

    void insert(Map<String, Object> data);

    void update(Map<String, Object> data);

    void delete(@Param("custCd") String custCd);
}
