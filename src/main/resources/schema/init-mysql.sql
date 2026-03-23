-- FORMA v2 MySQL 초기 스키마
-- 사용법: mysql -u forma -p forma < init-mysql.sql

CREATE DATABASE IF NOT EXISTS forma DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE forma;

-- ═══ 코드 ═══
CREATE TABLE IF NOT EXISTS tb_code_group (
    grp_code VARCHAR(20) NOT NULL PRIMARY KEY,
    grp_name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tb_code (
    grp_code VARCHAR(20) NOT NULL,
    code VARCHAR(20) NOT NULL,
    code_name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    use_yn VARCHAR(1) DEFAULT 'Y',
    PRIMARY KEY (grp_code, code)
) ENGINE=InnoDB;

-- ═══ 사용자/조직/권한 ═══
CREATE TABLE IF NOT EXISTS tb_user (
    user_id VARCHAR(20) NOT NULL PRIMARY KEY,
    user_pw VARCHAR(200),
    user_nm VARCHAR(50),
    dept_code VARCHAR(20),
    dept_name VARCHAR(50),
    admin_yn VARCHAR(1) DEFAULT 'N',
    use_yn VARCHAR(1) DEFAULT 'Y'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tb_dept (
    dept_code VARCHAR(20) NOT NULL PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    parent_code VARCHAR(20),
    dept_level INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    use_yn VARCHAR(1) DEFAULT 'Y',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tb_role (
    role_cd VARCHAR(20) NOT NULL PRIMARY KEY,
    role_nm VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    use_yn VARCHAR(1) DEFAULT 'Y',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tb_user_role (
    user_id VARCHAR(20) NOT NULL,
    role_cd VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_id, role_cd)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tb_menu (
    menu_id VARCHAR(20) NOT NULL PRIMARY KEY,
    menu_nm VARCHAR(100) NOT NULL,
    parent_id VARCHAR(20),
    menu_type VARCHAR(10) DEFAULT 'P',
    pgm_id VARCHAR(20),
    url VARCHAR(200),
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    use_yn VARCHAR(1) DEFAULT 'Y'
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tb_data_auth (
    auth_seq BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_cd VARCHAR(20) NOT NULL,
    auth_type VARCHAR(20) NOT NULL,
    auth_target VARCHAR(100),
    table_name VARCHAR(50),
    description VARCHAR(200)
) ENGINE=InnoDB;

-- ═══ 시스템 ═══
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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tb_log (
    log_seq BIGINT AUTO_INCREMENT PRIMARY KEY,
    log_type VARCHAR(20),
    pgm_id VARCHAR(20),
    user_id VARCHAR(20),
    user_ip VARCHAR(50),
    log_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tb_audit_log (
    audit_seq BIGINT AUTO_INCREMENT PRIMARY KEY,
    trace_id VARCHAR(50),
    pgm_id VARCHAR(20),
    table_name VARCHAR(50),
    action VARCHAR(10),
    row_key VARCHAR(200),
    before_data TEXT,
    after_data TEXT,
    user_id VARCHAR(50),
    user_ip VARCHAR(50),
    audit_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tb_file (
    file_id VARCHAR(50) NOT NULL PRIMARY KEY,
    ref_type VARCHAR(20) NOT NULL,
    ref_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT DEFAULT 0,
    content_type VARCHAR(100),
    sort_order INT DEFAULT 0,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_file_ref (ref_type, ref_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tb_user_favorite (
    user_id VARCHAR(20) NOT NULL,
    menu_id VARCHAR(20) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, menu_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tb_user_settings (
    user_id VARCHAR(20) NOT NULL,
    setting_key VARCHAR(50) NOT NULL,
    setting_value VARCHAR(4000),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, setting_key)
) ENGINE=InnoDB;

-- ═══ 초기 데이터 ═══
INSERT IGNORE INTO tb_user VALUES ('admin', '', '관리자', NULL, NULL, 'Y', 'Y');
INSERT IGNORE INTO tb_role VALUES ('ADMIN', '시스템관리자', '전체 권한', 'Y', 'admin', NOW());
INSERT IGNORE INTO tb_user_role VALUES ('admin', 'ADMIN');
