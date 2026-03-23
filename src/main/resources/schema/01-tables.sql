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

-- ═══════════════════════════════════════════════
--  권한/메뉴/조직 체계
-- ═══════════════════════════════════════════════

-- 부서
CREATE TABLE IF NOT EXISTS tb_dept (
    dept_code VARCHAR(20) NOT NULL PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    parent_code VARCHAR(20),           -- 상위 부서 (트리)
    dept_level INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    use_yn VARCHAR(1) DEFAULT 'Y',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP
);

-- 역할
CREATE TABLE IF NOT EXISTS tb_role (
    role_cd VARCHAR(20) NOT NULL PRIMARY KEY,
    role_nm VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    use_yn VARCHAR(1) DEFAULT 'Y',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자-역할 매핑
CREATE TABLE IF NOT EXISTS tb_user_role (
    user_id VARCHAR(20) NOT NULL,
    role_cd VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_id, role_cd)
);

-- 메뉴
CREATE TABLE IF NOT EXISTS tb_menu (
    menu_id VARCHAR(20) NOT NULL PRIMARY KEY,
    menu_nm VARCHAR(100) NOT NULL,
    parent_id VARCHAR(20),             -- 상위 메뉴 (트리)
    menu_type VARCHAR(10) DEFAULT 'P', -- G=그룹, P=화면
    pgm_id VARCHAR(20),                -- 연결 프로그램
    url VARCHAR(200),
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    use_yn VARCHAR(1) DEFAULT 'Y'
);

-- 역할-메뉴 권한 (메뉴별 버튼 권한)
CREATE TABLE IF NOT EXISTS tb_role_menu (
    role_cd VARCHAR(20) NOT NULL,
    menu_id VARCHAR(20) NOT NULL,
    srch_yn VARCHAR(1) DEFAULT 'Y',
    new_yn VARCHAR(1) DEFAULT 'N',
    save_yn VARCHAR(1) DEFAULT 'N',
    del_yn VARCHAR(1) DEFAULT 'N',
    prnt_yn VARCHAR(1) DEFAULT 'N',
    upld_yn VARCHAR(1) DEFAULT 'N',
    init_yn VARCHAR(1) DEFAULT 'N',
    PRIMARY KEY (role_cd, menu_id)
);

-- 데이터 권한 (부서/사용자별 데이터 접근 범위)
CREATE TABLE IF NOT EXISTS tb_data_auth (
    auth_seq BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_cd VARCHAR(20) NOT NULL,
    auth_type VARCHAR(20) NOT NULL,    -- DEPT(본인부서), DEPT_SUB(하위부서포함), USER(본인), ALL(전체), CUSTOM(커스텀)
    auth_target VARCHAR(100),          -- CUSTOM일 때 대상 (부서코드, 사용자ID 등)
    table_name VARCHAR(50),            -- 적용 테이블 (null이면 전체)
    description VARCHAR(200)
);

-- 감사 로그
CREATE TABLE IF NOT EXISTS tb_audit_log (
    audit_seq    BIGINT AUTO_INCREMENT PRIMARY KEY,
    trace_id     VARCHAR(50),
    pgm_id       VARCHAR(20),
    table_name   VARCHAR(50),
    action       VARCHAR(10),
    row_key      VARCHAR(200),
    before_data  CLOB,
    after_data   CLOB,
    user_id      VARCHAR(50),
    user_ip      VARCHAR(50),
    audit_dt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 파일 첨부
CREATE TABLE IF NOT EXISTS tb_file (
    file_id VARCHAR(50) NOT NULL PRIMARY KEY,
    ref_type VARCHAR(20) NOT NULL,       -- 참조 유형 (ORDER, CUSTOMER, ITEM 등)
    ref_id VARCHAR(50) NOT NULL,          -- 참조 키 (주문번호, 거래처코드 등)
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT DEFAULT 0,
    content_type VARCHAR(100),
    sort_order INT DEFAULT 0,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_file_ref ON tb_file (ref_type, ref_id);

-- ═══════════════════════════════════════════════
--  업무 테이블
-- ═══════════════════════════════════════════════

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

CREATE TABLE IF NOT EXISTS tb_item (
    item_cd VARCHAR(20) NOT NULL PRIMARY KEY,
    item_nm VARCHAR(200) NOT NULL,
    item_grp VARCHAR(20),
    spec VARCHAR(200),
    unit_cd VARCHAR(20),
    unit_price DECIMAL(15,2) DEFAULT 0,
    use_yn VARCHAR(1) DEFAULT 'Y',
    remark VARCHAR(500),
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_order_history (
    hist_seq BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(20) NOT NULL,
    action VARCHAR(50),
    action_detail VARCHAR(500),
    action_by VARCHAR(50),
    action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 즐겨찾기 메뉴
CREATE TABLE IF NOT EXISTS tb_user_favorite (
    user_id VARCHAR(20) NOT NULL,
    menu_id VARCHAR(20) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, menu_id)
);

-- 개인 설정
CREATE TABLE IF NOT EXISTS tb_user_settings (
    user_id VARCHAR(20) NOT NULL,
    setting_key VARCHAR(50) NOT NULL,
    setting_value VARCHAR(4000),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, setting_key)
);
