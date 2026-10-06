/* ============================================================
 * CẤU HÌNH WEBSITE PHỞ CUỐN NGON
 * ------------------------------------------------------------
 * 1. Tạo project miễn phí tại https://supabase.com
 * 2. Vào SQL Editor, chạy file supabase/schema.sql rồi supabase/seed.sql
 * 3. Lấy Project URL và anon public key tại Settings > API
 * 4. Dán vào 2 dòng bên dưới, push code lên GitHub là xong.
 *    (Chưa dán key thì web vẫn chạy ở CHẾ ĐỘ DEMO để xem thử.)
 * ============================================================ */
window.PCN_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  SHOP_NAME: "Phở Cuốn Ngon",
  HOTLINE: "0901 234 567",
  HOTLINE_LINK: "tel:0901234567",
  ADDRESS: "Số 1, Ngõ 31 Xuân Diệu, Tây Hồ, Hà Nội",
  OPEN_HOURS: "9:00 – 21:30 mỗi ngày",
  FACEBOOK: "https://facebook.com/phocuonngon",

  SHIPPING_FEE: 15000,      // phí ship mặc định (đ)
  FREE_SHIP_MIN: 200000,    // đơn từ mức này được freeship
};
