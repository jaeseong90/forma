-- FORMA v2 Schema

CREATE TABLE IF NOT EXISTS tb_code_group (
    grp_code VARCHAR(20) NOT NULL PRIMARY KEY,
    grp_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS tb_code (
    grp_code VARCHAR(20) NOT NULL,
    code VARCHAR(20) NOT NULL,
    code_name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    use_yn VARCHAR(1) DEFAULT 'Y',
    PRIMARY KEY (grp_code, code)
);

CREATE TABLE IF NOT EXISTS tb_user (
    user_id VARCHAR(20) NOT NULL PRIMARY KEY,
    user_pw VARCHAR(200),
    user_nm VARCHAR(50),
    dept_code VARCHAR(20),
    dept_name VARCHAR(50),
    admin_yn VARCHAR(1) DEFAULT 'N',
    use_yn VARCHAR(1) DEFAULT 'Y'
);

CREATE TABLE IF NOT EXISTS tb_log (
    log_seq BIGINT AUTO_INCREMENT PRIMARY KEY,
    log_type VARCHAR(20),
    pgm_id VARCHAR(20),
    user_id VARCHAR(20),
    user_ip VARCHAR(50),
    log_dt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tb_customer (
    cust_cd VARCHAR(20) NOT NULL PRIMARY KEY,
    cust_nm VARCHAR(100) NOT NULL,
    cust_type VARCHAR(50),
    tel VARCHAR(20),
    addr VARCHAR(500),
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_sales_order (
    order_no VARCHAR(20) NOT NULL PRIMARY KEY,
    order_date DATE,
    cust_cd VARCHAR(20),
    cust_nm VARCHAR(100),
    status VARCHAR(20) DEFAULT 'DRAFT',
    total_amt DECIMAL(15,2) DEFAULT 0,
    remark VARCHAR(1000),
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_sales_order_item (
    order_no VARCHAR(20) NOT NULL,
    seq INT NOT NULL,
    item_cd VARCHAR(20),
    item_nm VARCHAR(200),
    qty INT DEFAULT 0,
    unit_price DECIMAL(15,2) DEFAULT 0,
    amount DECIMAL(15,2) DEFAULT 0,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (order_no, seq)
);

-- 샘플 데이터
INSERT INTO tb_code_group VALUES ('CUST_TYPE', '거래처유형');
INSERT INTO tb_code_group VALUES ('ORD_STATUS', '수주상태');

INSERT INTO tb_code VALUES ('CUST_TYPE', 'DOMESTIC', '국내', 1, 'Y');
INSERT INTO tb_code VALUES ('CUST_TYPE', 'OVERSEAS', '해외', 2, 'Y');
INSERT INTO tb_code VALUES ('CUST_TYPE', 'INTERNAL', '내부', 3, 'Y');

INSERT INTO tb_code VALUES ('ORD_STATUS', 'DRAFT', '작성중', 1, 'Y');
INSERT INTO tb_code VALUES ('ORD_STATUS', 'CONFIRMED', '확정', 2, 'Y');
INSERT INTO tb_code VALUES ('ORD_STATUS', 'APPROVED', '승인', 3, 'Y');

INSERT INTO tb_user VALUES ('admin', '', '관리자', 'IT', 'IT부서', 'Y', 'Y');

INSERT INTO tb_customer VALUES ('C001', '삼성전자', 'DOMESTIC', '02-1234-5678', '서울시 서초구', 'system', NOW(), 'system', NOW());
INSERT INTO tb_customer VALUES ('C002', 'LG전자', 'DOMESTIC', '02-2345-6789', '서울시 영등포구', 'system', NOW(), 'system', NOW());
INSERT INTO tb_customer VALUES ('C003', 'Apple Inc.', 'OVERSEAS', '1-800-275-2273', 'Cupertino, CA', 'system', NOW(), 'system', NOW());

INSERT INTO tb_sales_order VALUES ('ORD-20260317-001', '2026-03-17', 'C001', '삼성전자', 'DRAFT', 1500000, NULL, 'system', NOW(), 'system', NOW());
INSERT INTO tb_sales_order_item VALUES ('ORD-20260317-001', 1, 'ITM001', '노트북', 10, 150000, 1500000, 'system', NOW(), 'system', NOW());

-- PGM 정보
CREATE TABLE IF NOT EXISTS tb_pgm_info (
    pgm_id VARCHAR(20) NOT NULL PRIMARY KEY,
    pgm_nm VARCHAR(100) NOT NULL,
    srch_yn VARCHAR(1) DEFAULT 'Y',
    new_yn VARCHAR(1) DEFAULT 'N',
    save_yn VARCHAR(1) DEFAULT 'Y',
    del_yn VARCHAR(1) DEFAULT 'Y',
    prnt_yn VARCHAR(1) DEFAULT 'N',
    upld_yn VARCHAR(1) DEFAULT 'N',
    init_yn VARCHAR(1) DEFAULT 'Y',
    etc_desc1 VARCHAR(50), etc_desc2 VARCHAR(50), etc_desc3 VARCHAR(50),
    etc_desc4 VARCHAR(50), etc_desc5 VARCHAR(50)
);

INSERT INTO tb_pgm_info (pgm_id, pgm_nm, srch_yn, new_yn, save_yn, del_yn, init_yn)
VALUES ('SDA010', '거래처관리', 'Y', 'Y', 'Y', 'Y', 'Y');
INSERT INTO tb_pgm_info (pgm_id, pgm_nm, srch_yn, new_yn, save_yn, del_yn, init_yn)
VALUES ('SOA010', '수주관리', 'Y', 'Y', 'Y', 'Y', 'Y');

-- 견적 템플릿 마스터
CREATE TABLE IF NOT EXISTS tb_estimate_template (
    egrp_code VARCHAR(20) NOT NULL,
    ser INT NOT NULL,
    desc_nm VARCHAR(200),
    est_type VARCHAR(10) DEFAULT 'S',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (egrp_code, ser)
);

-- 견적 템플릿 항목
CREATE TABLE IF NOT EXISTS tb_estimate_template_item (
    egrp_code VARCHAR(20) NOT NULL,
    ser INT NOT NULL,
    acnt_cd VARCHAR(50) NOT NULL,
    acnt_nm VARCHAR(200),
    parent_cd VARCHAR(50),
    lvl INT DEFAULT 0,
    unit_cd VARCHAR(20),
    use_yn VARCHAR(1) DEFAULT 'Y',
    remark VARCHAR(500),
    sort_order INT DEFAULT 0,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (egrp_code, ser, acnt_cd)
);

-- 코드 그룹 추가
INSERT INTO tb_code_group VALUES ('EST_TYPE', '견적유형');
INSERT INTO tb_code_group VALUES ('UNIT', '단위');

INSERT INTO tb_code VALUES ('EST_TYPE', 'S', '조선', 1, 'Y');
INSERT INTO tb_code VALUES ('EST_TYPE', 'P', '플랜트', 2, 'Y');
INSERT INTO tb_code VALUES ('EST_TYPE', 'E', '기전', 3, 'Y');

INSERT INTO tb_code VALUES ('UNIT', 'KG', 'kg', 1, 'Y');
INSERT INTO tb_code VALUES ('UNIT', 'M', 'm', 2, 'Y');
INSERT INTO tb_code VALUES ('UNIT', 'EA', 'EA', 3, 'Y');
INSERT INTO tb_code VALUES ('UNIT', 'SET', 'SET', 4, 'Y');
INSERT INTO tb_code VALUES ('UNIT', 'LOT', 'LOT', 5, 'Y');

-- 샘플: 마스터
INSERT INTO tb_estimate_template VALUES ('SHIP', 1, '선체 표준견적', 'S', 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template VALUES ('SHIP', 2, '의장 표준견적', 'S', 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template VALUES ('PLANT', 1, '플랜트 표준견적', 'P', 'system', NOW(), 'system', NOW());

-- 샘플: 디테일 (SHIP/1)
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 1, 'A', '선체공사', NULL, 0, NULL, 'Y', NULL, 1, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 1, 'A01', '강재', 'A', 1, 'KG', 'Y', '메인 강재', 2, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 1, 'A02', '용접', 'A', 1, 'M', 'Y', NULL, 3, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 1, 'A03', '도장', 'A', 1, 'M', 'Y', NULL, 4, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 1, 'B', '기관공사', NULL, 0, NULL, 'Y', NULL, 5, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 1, 'B01', '메인엔진', 'B', 1, 'SET', 'Y', NULL, 6, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 1, 'B02', '발전기', 'B', 1, 'SET', 'Y', NULL, 7, 'system', NOW(), 'system', NOW());

-- 샘플: 디테일 (SHIP/2)
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 2, 'C', '의장공사', NULL, 0, NULL, 'Y', NULL, 1, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 2, 'C01', '배관', 'C', 1, 'M', 'Y', NULL, 2, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 2, 'C02', '전장', 'C', 1, 'LOT', 'Y', NULL, 3, 'system', NOW(), 'system', NOW());

-- 샘플: 디테일 (PLANT/1)
INSERT INTO tb_estimate_template_item VALUES ('PLANT', 1, 'P', '플랜트공사', NULL, 0, NULL, 'Y', NULL, 1, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('PLANT', 1, 'P01', '구조물', 'P', 1, 'KG', 'Y', NULL, 2, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('PLANT', 1, 'P02', '배관', 'P', 1, 'M', 'Y', NULL, 3, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('PLANT', 1, 'P03', '전기', 'P', 1, 'LOT', 'N', '미사용', 4, 'system', NOW(), 'system', NOW());

-- PGM: SDA020
INSERT INTO tb_pgm_info (pgm_id, pgm_nm, srch_yn, new_yn, save_yn, del_yn, init_yn)
VALUES ('SDA020', '견적템플릿관리', 'Y', 'Y', 'Y', 'Y', 'Y');
