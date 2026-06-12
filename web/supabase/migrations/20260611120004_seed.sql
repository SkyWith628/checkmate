-- ╔══════════════════════════════════════════════════════════╗
-- ║ 시드: 카테고리 + 사이트 기본 설정                          ║
-- ╚══════════════════════════════════════════════════════════╝

insert into categories (slug, name, description, sort_order) values
  ('pendant',  'Pendant',  '펜던트 · 목걸이 컬렉션', 1),
  ('ring',     'Ring',     '반지 컬렉션',            2),
  ('earring',  'Earring',  '이어링 · 귀걸이 컬렉션', 3),
  ('bracelet', 'Bracelet', '브레이슬렛 · 팔찌 컬렉션', 4)
on conflict (slug) do nothing;

insert into site_settings (key, value) values
  ('free_ship_threshold', '50000'::jsonb),   -- 5만원 이상 무료배송
  ('ship_fee',            '3000'::jsonb),     -- 기본 배송비
  ('point_earn_rate',     '0.01'::jsonb)      -- 구매액 1% 적립
on conflict (key) do nothing;
