-- ============================================================
-- PHỞ CUỐN NGON — Dữ liệu mẫu (chạy sau schema.sql)
-- ============================================================

-- Mã PIN quản trị mặc định: 123456 (ĐỔI NGAY sau khi deploy!)
insert into settings (key, value) values ('admin_pin', '123456')
on conflict (key) do nothing;

insert into products (name, slug, description, price, old_price, image_url, category, is_featured, sort_order) values
('Phở cuốn bò truyền thống', 'pho-cuon-bo',
 'Bánh phở tươi cuốn thịt bò xào thơm, rau sống giòn mát, chấm nước mắm pha gia truyền.',
 45000, 55000, 'images/pho-cuon-bo.webp', 'Phở cuốn', true, 1),

('Phở cuốn thập cẩm', 'pho-cuon-thap-cam',
 'Cuốn đầy đặn tôm, thịt heo, trứng và rau thơm — một cuốn là đủ vị.',
 55000, null, 'images/pho-cuon-thap-cam.webp', 'Phở cuốn', true, 2),

('Phở cuốn tôm thịt', 'pho-cuon-tom-thit',
 'Tôm sú tươi ngọt thịt kết hợp thịt heo quay, rau sống tươi mỗi sáng.',
 55000, null, 'images/pho-cuon-tom-thit.webp', 'Phở cuốn', true, 3),

('Phở chiên phồng', 'pho-chien-phong',
 'Miếng phở chiên phồng vàng giòn rụm, ăn kèm bò xào lúc lắc nóng hổi.',
 50000, null, 'images/pho-chien-phong.webp', 'Phở chiên', false, 4),

('Phở cuốn chay thanh đạm', 'pho-cuon-chay',
 'Nấm, đậu hũ, rau củ tươi cuốn bánh phở mềm — nhẹ bụng mà vẫn đậm đà.',
 40000, null, 'images/pho-cuon-chay.webp', 'Món chay', false, 5),

('Combo gia đình 20 cuốn', 'combo-gia-dinh',
 '20 cuốn thập cẩm + 2 chai nước chấm + rau sống đầy ú ụ cho 4–5 người.',
 199000, 240000, 'images/hero.webp', 'Combo', true, 6)

on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  price = excluded.price, old_price = excluded.old_price,
  image_url = excluded.image_url, category = excluded.category,
  is_featured = excluded.is_featured, sort_order = excluded.sort_order;
