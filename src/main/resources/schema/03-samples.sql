-- 샘플 업무 데이터

INSERT INTO tb_user VALUES ('admin', '', '관리자', 'IT', 'IT부서', 'Y', 'Y');

-- 거래처
INSERT INTO tb_customer VALUES ('C001', '삼성전자', 'DOMESTIC', '02-1234-5678', '서울시 서초구', 'system', NOW(), 'system', NOW());
INSERT INTO tb_customer VALUES ('C002', 'LG전자', 'DOMESTIC', '02-2345-6789', '서울시 영등포구', 'system', NOW(), 'system', NOW());
INSERT INTO tb_customer VALUES ('C003', 'Apple Inc.', 'OVERSEAS', '1-800-275-2273', 'Cupertino, CA', 'system', NOW(), 'system', NOW());

-- 수주
INSERT INTO tb_sales_order VALUES ('ORD-20260317-001', '2026-03-17', 'C001', '삼성전자', 'DRAFT', 1500000, NULL, 'system', NOW(), 'system', NOW());
INSERT INTO tb_sales_order_item VALUES ('ORD-20260317-001', 1, 'ITM001', '노트북', 10, 150000, 1500000, 'system', NOW(), 'system', NOW());

-- 수주이력
INSERT INTO tb_order_history VALUES (1, 'ORD-20260317-001', '생성', '수주 신규 생성', 'system', NOW());
INSERT INTO tb_order_history VALUES (2, 'ORD-20260317-001', '품목추가', '노트북 10대 추가', 'system', NOW());

-- 견적 템플릿 마스터
INSERT INTO tb_estimate_template VALUES ('SHIP', 1, '선체 표준견적', 'S', 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template VALUES ('SHIP', 2, '의장 표준견적', 'S', 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template VALUES ('PLANT', 1, '플랜트 표준견적', 'P', 'system', NOW(), 'system', NOW());

-- 견적 템플릿 항목 (SHIP/1)
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 1, 'A', '선체공사', NULL, 0, NULL, 'Y', NULL, 1, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 1, 'A01', '강재', 'A', 1, 'KG', 'Y', '메인 강재', 2, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 1, 'A02', '용접', 'A', 1, 'M', 'Y', NULL, 3, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 1, 'A03', '도장', 'A', 1, 'M', 'Y', NULL, 4, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 1, 'B', '기관공사', NULL, 0, NULL, 'Y', NULL, 5, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 1, 'B01', '메인엔진', 'B', 1, 'SET', 'Y', NULL, 6, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 1, 'B02', '발전기', 'B', 1, 'SET', 'Y', NULL, 7, 'system', NOW(), 'system', NOW());

-- 견적 템플릿 항목 (SHIP/2)
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 2, 'C', '의장공사', NULL, 0, NULL, 'Y', NULL, 1, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 2, 'C01', '배관', 'C', 1, 'M', 'Y', NULL, 2, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('SHIP', 2, 'C02', '전장', 'C', 1, 'LOT', 'Y', NULL, 3, 'system', NOW(), 'system', NOW());

-- 견적 템플릿 항목 (PLANT/1)
INSERT INTO tb_estimate_template_item VALUES ('PLANT', 1, 'P', '플랜트공사', NULL, 0, NULL, 'Y', NULL, 1, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('PLANT', 1, 'P01', '구조물', 'P', 1, 'KG', 'Y', NULL, 2, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('PLANT', 1, 'P02', '배관', 'P', 1, 'M', 'Y', NULL, 3, 'system', NOW(), 'system', NOW());
INSERT INTO tb_estimate_template_item VALUES ('PLANT', 1, 'P03', '전기', 'P', 1, 'LOT', 'N', '미사용', 4, 'system', NOW(), 'system', NOW());
