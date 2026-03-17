package com.forma.common.model;

import java.util.List;

public class PageResult<T> {
    private List<T> data;
    private int total;
    private int page;
    private int size;

    public static <T> PageResult<T> of(List<T> data, int total, int page, int size) {
        PageResult<T> r = new PageResult<>();
        r.data = data;
        r.total = total;
        r.page = page;
        r.size = size;
        return r;
    }

    public List<T> getData() { return data; }
    public int getTotal() { return total; }
    public int getPage() { return page; }
    public int getSize() { return size; }
}
