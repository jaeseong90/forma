-- 코드 마스터 데이터

INSERT INTO tb_code_group VALUES ('CUST_TYPE', '거래처유형');
INSERT INTO tb_code_group VALUES ('ORD_STATUS', '수주상태');
INSERT INTO tb_code_group VALUES ('EST_TYPE', '견적유형');
INSERT INTO tb_code_group VALUES ('UNIT', '단위');

INSERT INTO tb_code VALUES ('CUST_TYPE', 'DOMESTIC', '국내', 1, 'Y');
INSERT INTO tb_code VALUES ('CUST_TYPE', 'OVERSEAS', '해외', 2, 'Y');
INSERT INTO tb_code VALUES ('CUST_TYPE', 'INTERNAL', '내부', 3, 'Y');

INSERT INTO tb_code VALUES ('ORD_STATUS', 'DRAFT', '작성중', 1, 'Y');
INSERT INTO tb_code VALUES ('ORD_STATUS', 'CONFIRMED', '확정', 2, 'Y');
INSERT INTO tb_code VALUES ('ORD_STATUS', 'APPROVED', '승인', 3, 'Y');

INSERT INTO tb_code VALUES ('EST_TYPE', 'S', '조선', 1, 'Y');
INSERT INTO tb_code VALUES ('EST_TYPE', 'P', '플랜트', 2, 'Y');
INSERT INTO tb_code VALUES ('EST_TYPE', 'E', '기전', 3, 'Y');

INSERT INTO tb_code VALUES ('UNIT', 'KG', 'kg', 1, 'Y');
INSERT INTO tb_code VALUES ('UNIT', 'M', 'm', 2, 'Y');
INSERT INTO tb_code VALUES ('UNIT', 'EA', 'EA', 3, 'Y');
INSERT INTO tb_code VALUES ('UNIT', 'SET', 'SET', 4, 'Y');
INSERT INTO tb_code VALUES ('UNIT', 'LOT', 'LOT', 5, 'Y');

INSERT INTO tb_code_group VALUES ('ITEM_GRP', '품목그룹');

INSERT INTO tb_code VALUES ('ITEM_GRP', 'RAW', '원자재', 1, 'Y');
INSERT INTO tb_code VALUES ('ITEM_GRP', 'PART', '부품', 2, 'Y');
INSERT INTO tb_code VALUES ('ITEM_GRP', 'PROD', '완제품', 3, 'Y');
INSERT INTO tb_code VALUES ('ITEM_GRP', 'SUB', '부자재', 4, 'Y');
