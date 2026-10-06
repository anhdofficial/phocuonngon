# 🌯 Phở Cuốn Ngon — Website bán phở cuốn

Website bán hàng cho quán phở cuốn Hà Nội: mobile-first, chuẩn SEO, deploy
dạng **static site** trên Render, database **Supabase** (PostgreSQL).

## ✨ Tính năng

| Nhóm | Chi tiết |
|---|---|
| 🏠 Khách hàng | Trang chủ, thực đơn có lọc danh mục, giỏ hàng (lưu local), đặt hàng COD |
| 📦 Đơn hàng | Mã đơn tự sinh (PC…), tra cứu trạng thái theo SĐT, timeline giao hàng |
| 🛠️ Quản trị | Trang `quan-tri.html` đăng nhập bằng PIN, xem & cập nhật trạng thái đơn |
| 📱 Mobile | Mobile-first, thanh giỏ hàng dính đáy, menu hamburger, drawer giỏ hàng |
| 🔍 SEO | Meta/OG/Twitter tags, JSON-LD (Restaurant + Menu), sitemap, robots, semantic HTML |

> **Chế độ demo:** nếu chưa điền key Supabase vào `js/config.js`, web vẫn chạy
> đầy đủ bằng dữ liệu mẫu (đơn hàng lưu ở trình duyệt) — tiện để xem thử/gửi khách duyệt.

## 🚀 Cài đặt Supabase (5 phút)

1. Tạo project miễn phí tại [supabase.com](https://supabase.com) → **New project**.
2. Vào **SQL Editor** → **New query**, dán toàn bộ nội dung file
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. Chạy tiếp file [`supabase/seed.sql`](supabase/seed.sql) để có 6 món mẫu
   và mã PIN quản trị mặc định `123456`.
4. Vào **Project Settings → API**, copy **Project URL** và **anon public key**.
5. Mở `js/config.js`, dán vào `SUPABASE_URL` và `SUPABASE_ANON_KEY`.
   Đổi thêm `HOTLINE`, `ADDRESS` cho đúng quán của bạn.
6. **Đổi mã PIN quản trị:** trong SQL Editor chạy:
   ```sql
   update settings set value = 'PIN-MOI-CUA-BAN' where key = 'admin_pin';
   ```

### Bảo mật đã làm sẵn

- RLS bật trên mọi bảng. Khách **chỉ xem** sản phẩm đang bán và **chỉ tạo** đơn —
  không đọc/sửa được đơn của người khác.
- Tra cứu đơn qua hàm `get_my_order` (phải đúng mã đơn + SĐT).
- Quản trị qua 3 hàm `admin_*` kiểm tra PIN phía server, không lộ key nào ở frontend.

## 🌐 Deploy lên Render (static site)

**Cách 1 — Blueprint (khuyên dùng):**
1. Push repo này lên GitHub.
2. Render Dashboard → **New → Blueprint** → chọn repo → **Apply**.
3. Render tự tạo Static Site theo `render.yaml`, mỗi lần push `main` là tự deploy.

**Cách 2 — thủ công:**
1. Render Dashboard → **New → Static Site** → chọn repo.
2. **Build Command:** để trống (hoặc `echo ok`) · **Publish Directory:** `.`
3. **Deploy** — xong, web có HTTPS miễn phí.

> Sau khi deploy, nhớ sửa domain trong `sitemap.xml`, thẻ `canonical`/`og:*`
> trong các file HTML thành domain thật của bạn để SEO chuẩn.

## 🗂️ Cấu trúc thư mục

```
├── index.html          Trang chủ
├── thuc-don.html       Thực đơn + lọc danh mục
├── thanh-toan.html     Giỏ hàng + form đặt hàng COD
├── tra-cuu.html        Tra cứu đơn theo mã + SĐT
├── quan-tri.html       Quản trị đơn hàng (PIN)
├── css/style.css       Mobile-first CSS
├── js/config.js        ⚙️ Cấu hình shop + key Supabase (sửa file này)
├── js/app.js           Giỏ hàng, Supabase client, demo mode
├── images/             Ảnh món ăn (webp, đã tối ưu)
├── supabase/           schema.sql + seed.sql
├── render.yaml         Blueprint deploy Render
├── sitemap.xml / robots.txt
```

## 📌 Ghi chú

- Thêm/sửa món: vào Supabase → **Table Editor** → bảng `products`
  (không cần động vào code).
- Đổi giá ship / ngưỡng freeship: sửa `SHIPPING_FEE`, `FREE_SHIP_MIN`
  trong `js/config.js`.
- Ảnh mới: nén về `.webp` rồi bỏ vào `images/`, cập nhật `image_url`
  trong bảng `products`.
