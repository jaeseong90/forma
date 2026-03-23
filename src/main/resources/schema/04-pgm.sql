-- PGM 정보

INSERT INTO tb_pgm_info (pgm_id, pgm_nm, srch_yn, new_yn, save_yn, del_yn, init_yn)
VALUES ('SDA010', '거래처관리', 'Y', 'Y', 'Y', 'Y', 'Y');

INSERT INTO tb_pgm_info (pgm_id, pgm_nm, srch_yn, new_yn, save_yn, del_yn, init_yn, etc_desc1)
VALUES ('SDA020', '견적템플릿관리', 'Y', 'Y', 'Y', 'Y', 'Y', 'CSV');

INSERT INTO tb_pgm_info (pgm_id, pgm_nm, srch_yn, new_yn, save_yn, del_yn, init_yn)
VALUES ('SOA010', '수주관리', 'Y', 'Y', 'Y', 'Y', 'Y');

INSERT INTO tb_pgm_info (pgm_id, pgm_nm, srch_yn, new_yn, save_yn, del_yn, init_yn, etc_desc1)
VALUES ('SDB010', '수주등록', 'Y', 'Y', 'Y', 'Y', 'Y', '승인');

INSERT INTO tb_pgm_info (pgm_id, pgm_nm, srch_yn, new_yn, save_yn, del_yn, init_yn)
VALUES ('MMA010', '품목관리', 'Y', 'Y', 'Y', 'Y', 'Y');

-- 시스템관리(SY) 모듈
INSERT INTO tb_pgm_info (pgm_id, pgm_nm, srch_yn, new_yn, save_yn, del_yn, init_yn)
VALUES ('SY010', '메뉴관리', 'Y', 'Y', 'Y', 'Y', 'Y');

INSERT INTO tb_pgm_info (pgm_id, pgm_nm, srch_yn, new_yn, save_yn, del_yn, init_yn)
VALUES ('SY020', '프로그램관리', 'Y', 'Y', 'Y', 'Y', 'Y');

INSERT INTO tb_pgm_info (pgm_id, pgm_nm, srch_yn, new_yn, save_yn, del_yn, init_yn)
VALUES ('SY030', '역할/권한관리', 'Y', 'Y', 'Y', 'N', 'Y');

INSERT INTO tb_pgm_info (pgm_id, pgm_nm, srch_yn, new_yn, save_yn, del_yn, init_yn, etc_desc1)
VALUES ('SY040', '사용자관리', 'Y', 'Y', 'Y', 'N', 'Y', '비밀번호초기화');

INSERT INTO tb_pgm_info (pgm_id, pgm_nm, srch_yn, new_yn, save_yn, del_yn, init_yn)
VALUES ('SY050', '감사로그', 'Y', 'N', 'N', 'N', 'Y');
