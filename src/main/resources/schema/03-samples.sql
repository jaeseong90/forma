-- 샘플 업무 데이터

-- ═══ 조직/권한 ═══

-- 부서
INSERT INTO tb_dept VALUES ('D00', '대표이사', NULL, 0, 1, 'Y', 'system', NOW(), NULL, NULL);
INSERT INTO tb_dept VALUES ('D10', '경영지원본부', 'D00', 1, 1, 'Y', 'system', NOW(), NULL, NULL);
INSERT INTO tb_dept VALUES ('D11', '인사팀', 'D10', 2, 1, 'Y', 'system', NOW(), NULL, NULL);
INSERT INTO tb_dept VALUES ('D12', '재무팀', 'D10', 2, 2, 'Y', 'system', NOW(), NULL, NULL);
INSERT INTO tb_dept VALUES ('D20', '기술본부', 'D00', 1, 2, 'Y', 'system', NOW(), NULL, NULL);
INSERT INTO tb_dept VALUES ('D21', '개발1팀', 'D20', 2, 1, 'Y', 'system', NOW(), NULL, NULL);
INSERT INTO tb_dept VALUES ('D22', '개발2팀', 'D20', 2, 2, 'Y', 'system', NOW(), NULL, NULL);
INSERT INTO tb_dept VALUES ('D30', '영업본부', 'D00', 1, 3, 'Y', 'system', NOW(), NULL, NULL);
INSERT INTO tb_dept VALUES ('D31', '국내영업팀', 'D30', 2, 1, 'Y', 'system', NOW(), NULL, NULL);
INSERT INTO tb_dept VALUES ('D32', '해외영업팀', 'D30', 2, 2, 'Y', 'system', NOW(), NULL, NULL);

-- 역할
INSERT INTO tb_role VALUES ('ADMIN', '시스템관리자', '전체 권한', 'Y', 'system', NOW());
INSERT INTO tb_role VALUES ('MANAGER', '부서장', '본인 부서+하위 부서 조회', 'Y', 'system', NOW());
INSERT INTO tb_role VALUES ('USER', '일반사용자', '본인 부서 데이터만 조회', 'Y', 'system', NOW());
INSERT INTO tb_role VALUES ('VIEWER', '조회전용', '조회만 가능', 'Y', 'system', NOW());

-- 사용자
INSERT INTO tb_user VALUES ('admin', '', '관리자', 'D00', '대표이사', 'Y', 'Y');
INSERT INTO tb_user VALUES ('kim', '', '김철수', 'D21', '개발1팀', 'N', 'Y');
INSERT INTO tb_user VALUES ('lee', '', '이영희', 'D31', '국내영업팀', 'N', 'Y');
INSERT INTO tb_user VALUES ('park', '', '박민수', 'D30', '영업본부', 'N', 'Y');

-- 사용자-역할
INSERT INTO tb_user_role VALUES ('admin', 'ADMIN');
INSERT INTO tb_user_role VALUES ('kim', 'USER');
INSERT INTO tb_user_role VALUES ('lee', 'USER');
INSERT INTO tb_user_role VALUES ('park', 'MANAGER');

-- 메뉴
INSERT INTO tb_menu VALUES ('M00', '홈', NULL, 'P', NULL, '/', '🏠', 0, 'Y');
INSERT INTO tb_menu VALUES ('M10', '기준정보', NULL, 'G', NULL, NULL, '📋', 1, 'Y');
INSERT INTO tb_menu VALUES ('M11', '거래처관리', 'M10', 'P', 'SDA010', '/pages/base/SDA010.html', '🏢', 1, 'Y');
INSERT INTO tb_menu VALUES ('M12', '견적템플릿관리', 'M10', 'P', 'SDA020', '/pages/base/SDA020.html', '📄', 2, 'Y');
INSERT INTO tb_menu VALUES ('M15', '자재관리', NULL, 'G', NULL, NULL, '📦', 2, 'Y');
INSERT INTO tb_menu VALUES ('M16', '품목관리', 'M15', 'P', 'MMA010', '/pages/material/MMA010.html', '🔧', 1, 'Y');
INSERT INTO tb_menu VALUES ('M20', '영업관리', NULL, 'G', NULL, NULL, '💼', 3, 'Y');
INSERT INTO tb_menu VALUES ('M21', '수주관리', 'M20', 'P', 'SOA010', '/pages/sales/SOA010.html', '📦', 1, 'Y');
INSERT INTO tb_menu VALUES ('M22', '수주등록', 'M20', 'P', 'SDB010', '/pages/sales/SDB010.html', '✏️', 2, 'Y');

-- 역할-메뉴 권한
INSERT INTO tb_role_menu VALUES ('ADMIN', 'M11', 'Y','Y','Y','Y','Y','Y','Y');
INSERT INTO tb_role_menu VALUES ('ADMIN', 'M12', 'Y','Y','Y','Y','Y','Y','Y');
INSERT INTO tb_role_menu VALUES ('ADMIN', 'M21', 'Y','Y','Y','Y','Y','Y','Y');
INSERT INTO tb_role_menu VALUES ('ADMIN', 'M16', 'Y','Y','Y','Y','Y','Y','Y');
INSERT INTO tb_role_menu VALUES ('ADMIN', 'M22', 'Y','Y','Y','Y','Y','Y','Y');
INSERT INTO tb_role_menu VALUES ('USER', 'M11', 'Y','Y','Y','N','N','N','Y');
INSERT INTO tb_role_menu VALUES ('USER', 'M21', 'Y','N','N','N','N','N','Y');
INSERT INTO tb_role_menu VALUES ('MANAGER', 'M11', 'Y','Y','Y','Y','Y','Y','Y');
INSERT INTO tb_role_menu VALUES ('MANAGER', 'M21', 'Y','Y','Y','Y','Y','Y','Y');
INSERT INTO tb_role_menu VALUES ('MANAGER', 'M22', 'Y','Y','Y','Y','Y','Y','Y');
INSERT INTO tb_role_menu VALUES ('VIEWER', 'M11', 'Y','N','N','N','N','N','N');
INSERT INTO tb_role_menu VALUES ('VIEWER', 'M21', 'Y','N','N','N','N','N','N');

-- 데이터 권한
INSERT INTO tb_data_auth (role_cd, auth_type, auth_target, table_name, description) VALUES ('ADMIN', 'ALL', NULL, NULL, '전체 데이터 접근');
INSERT INTO tb_data_auth (role_cd, auth_type, auth_target, table_name, description) VALUES ('MANAGER', 'DEPT_SUB', NULL, NULL, '본인 부서+하위 부서');
INSERT INTO tb_data_auth (role_cd, auth_type, auth_target, table_name, description) VALUES ('USER', 'DEPT', NULL, NULL, '본인 부서만');
INSERT INTO tb_data_auth (role_cd, auth_type, auth_target, table_name, description) VALUES ('VIEWER', 'ALL', NULL, NULL, '전체 조회(읽기만)');

-- ═══ 업무 데이터 ═══

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

-- 품목
INSERT INTO tb_item VALUES ('ITM001', '노트북', 'PROD', '15.6인치 FHD', 'EA', 1500000, 'Y', '업무용 노트북', 'system', NOW(), 'system', NOW());
INSERT INTO tb_item VALUES ('ITM002', '모니터', 'PROD', '27인치 4K', 'EA', 500000, 'Y', NULL, 'system', NOW(), 'system', NOW());
INSERT INTO tb_item VALUES ('ITM003', '키보드', 'PART', '기계식', 'EA', 120000, 'Y', NULL, 'system', NOW(), 'system', NOW());
INSERT INTO tb_item VALUES ('ITM004', '강재 SS400', 'RAW', 'T12×1500×6000', 'KG', 1200, 'Y', '일반 구조용', 'system', NOW(), 'system', NOW());
INSERT INTO tb_item VALUES ('ITM005', '용접봉 E7016', 'SUB', '4.0mm', 'KG', 3500, 'Y', NULL, 'system', NOW(), 'system', NOW());
INSERT INTO tb_item VALUES ('ITM006', '볼트 M16', 'PART', 'M16×50 STS', 'EA', 500, 'N', '단종 예정', 'system', NOW(), 'system', NOW());
