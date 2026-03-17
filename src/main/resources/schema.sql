-- Generated from: design/_entities.yml

CREATE TABLE IF NOT EXISTS tb_customer (
    cust_cd    VARCHAR(20)  NOT NULL PRIMARY KEY,
    cust_nm    VARCHAR(100) NOT NULL,
    cust_type  VARCHAR(50),
    tel        VARCHAR(20),
    addr       VARCHAR(500),
    created_by VARCHAR(50),
    created_at TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_sales_order (
    order_no   VARCHAR(20)    NOT NULL PRIMARY KEY,
    order_date DATE           NOT NULL,
    cust_cd    VARCHAR(20),
    cust_nm    VARCHAR(100),
    status     VARCHAR(50)    DEFAULT 'DRAFT',
    total_amt  DECIMAL(15,2)  DEFAULT 0,
    remark     CLOB,
    created_by VARCHAR(50),
    created_at TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_sales_order_item (
    order_no   VARCHAR(20)    NOT NULL,
    seq        INT            NOT NULL,
    item_cd    VARCHAR(20),
    item_nm    VARCHAR(200),
    qty        INT,
    unit_price DECIMAL(15,2),
    amount     DECIMAL(15,2),
    created_by VARCHAR(50),
    created_at TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP,
    PRIMARY KEY (order_no, seq)
);

-- 샘플 데이터
INSERT INTO tb_customer VALUES ('C001','삼성전자','DOMESTIC','02-1234-5678','서울시 서초구','system',NOW(),'system',NOW());
INSERT INTO tb_customer VALUES ('C002','LG전자','DOMESTIC','02-2345-6789','서울시 영등포구','system',NOW(),'system',NOW());
INSERT INTO tb_customer VALUES ('C003','Apple Inc.','OVERSEAS','1-800-275-2273','Cupertino, CA','system',NOW(),'system',NOW());
INSERT INTO tb_customer VALUES ('C004','본사','INTERNAL','02-9999-0000','서울시 강남구','system',NOW(),'system',NOW());

INSERT INTO tb_sales_order VALUES ('ORD-20260317-001','2026-03-17','C001','삼성전자','DRAFT',1500000,NULL,'system',NOW(),'system',NOW());
INSERT INTO tb_sales_order VALUES ('ORD-20260316-001','2026-03-16','C002','LG전자','CONFIRMED',2300000,NULL,'system',NOW(),'system',NOW());
INSERT INTO tb_sales_order VALUES ('ORD-20260315-001','2026-03-15','C003','Apple Inc.','APPROVED',5000000,'긴급 주문','system',NOW(),'system',NOW());

INSERT INTO tb_sales_order_item VALUES ('ORD-20260317-001',1,'ITEM-001','노트북',10,150000,1500000,'system',NOW(),'system',NOW());
INSERT INTO tb_sales_order_item VALUES ('ORD-20260316-001',1,'ITEM-002','모니터',20,80000,1600000,'system',NOW(),'system',NOW());
INSERT INTO tb_sales_order_item VALUES ('ORD-20260316-001',2,'ITEM-003','키보드',50,14000,700000,'system',NOW(),'system',NOW());
INSERT INTO tb_sales_order_item VALUES ('ORD-20260315-001',1,'ITEM-001','노트북',25,200000,5000000,'system',NOW(),'system',NOW());
