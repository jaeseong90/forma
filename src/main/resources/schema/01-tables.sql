-- FORMA v2 DDL

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

CREATE TABLE IF NOT EXISTS tb_order_history (
    hist_seq BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(20) NOT NULL,
    action VARCHAR(50),
    action_detail VARCHAR(500),
    action_by VARCHAR(50),
    action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
