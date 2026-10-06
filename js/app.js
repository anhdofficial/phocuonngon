/* ============================================================
 * PHỞ CUỐN NGON — logic dùng chung (giỏ hàng, sản phẩm, đơn hàng)
 * Vanilla JS, không cần build. Chạy tốt khi mở file trực tiếp.
 * ============================================================ */
(function () {
  "use strict";
  const CFG = window.PCN_CONFIG || {};
  const DEMO_MODE = !(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);

  /* ---------- Dữ liệu demo (dùng khi chưa cấu hình Supabase) ---------- */
  const DEMO_PRODUCTS = [
    { id: "demo-1", name: "Phở cuốn bò truyền thống", slug: "pho-cuon-bo", description: "Bánh phở tươi cuốn thịt bò xào thơm, rau sống giòn mát, chấm nước mắm pha gia truyền.", price: 45000, old_price: 55000, image_url: "images/pho-cuon-bo.webp", category: "Phở cuốn", is_featured: true, sort_order: 1 },
    { id: "demo-2", name: "Phở cuốn thập cẩm", slug: "pho-cuon-thap-cam", description: "Cuốn đầy đặn tôm, thịt heo, trứng và rau thơm — một cuốn là đủ vị.", price: 55000, old_price: null, image_url: "images/pho-cuon-thap-cam.webp", category: "Phở cuốn", is_featured: true, sort_order: 2 },
    { id: "demo-3", name: "Phở cuốn tôm thịt", slug: "pho-cuon-tom-thit", description: "Tôm sú tươi ngọt thịt kết hợp thịt heo quay, rau sống tươi mỗi sáng.", price: 55000, old_price: null, image_url: "images/pho-cuon-tom-thit.webp", category: "Phở cuốn", is_featured: true, sort_order: 3 },
    { id: "demo-4", name: "Phở chiên phồng", slug: "pho-chien-phong", description: "Miếng phở chiên phồng vàng giòn rụm, ăn kèm bò xào lúc lắc nóng hổi.", price: 50000, old_price: null, image_url: "images/pho-chien-phong.webp", category: "Phở chiên", is_featured: false, sort_order: 4 },
    { id: "demo-5", name: "Phở cuốn chay thanh đạm", slug: "pho-cuon-chay", description: "Nấm, đậu hũ, rau củ tươi cuốn bánh phở mềm — nhẹ bụng mà vẫn đậm đà.", price: 40000, old_price: null, image_url: "images/pho-cuon-chay.webp", category: "Món chay", is_featured: false, sort_order: 5 },
    { id: "demo-6", name: "Combo gia đình 20 cuốn", slug: "combo-gia-dinh", description: "20 cuốn thập cẩm + 2 chai nước chấm + rau sống đầy ú ụ cho 4–5 người.", price: 199000, old_price: 240000, image_url: "images/hero.webp", category: "Combo", is_featured: true, sort_order: 6 },
  ];

  /* ---------- Supabase client (nếu đã cấu hình) ---------- */
  let sb = null;
  if (!DEMO_MODE && window.supabase && window.supabase.createClient) {
    try { sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY); }
    catch (e) { console.warn("Supabase init lỗi, dùng demo mode:", e); }
  }
  const LIVE = !!sb;

  /* ---------- Sản phẩm ---------- */
  const store = {
    products: [],
    async loadProducts() {
      if (this.products.length) return this.products;
      if (LIVE) {
        try {
          const { data, error } = await sb.from("products")
            .select("*").eq("is_available", true).order("sort_order", { ascending: true });
          if (!error && data && data.length) { this.products = data; return data; }
        } catch (e) { console.warn("Không tải được sản phẩm từ Supabase:", e); }
      }
      this.products = DEMO_PRODUCTS.slice();
      return this.products;
    },
    get(id) { return this.products.find((p) => String(p.id) === String(id)); },
  };

  /* ---------- Giỏ hàng (localStorage) ---------- */
  const CART_KEY = "pcn_cart_v1";
  const cart = {
    items: {},
    load() { try { this.items = JSON.parse(localStorage.getItem(CART_KEY) || "{}"); } catch (e) { this.items = {}; } },
    save() { localStorage.setItem(CART_KEY, JSON.stringify(this.items)); UI.updateBadge(); },
    add(id, qty) {
      qty = qty || 1;
      this.items[id] = (this.items[id] || 0) + qty;
      if (this.items[id] <= 0) delete this.items[id];
      this.save(); UI.renderCart();
    },
    setQty(id, qty) {
      if (qty <= 0) delete this.items[id]; else this.items[id] = qty;
      this.save(); UI.renderCart();
    },
    clear() { this.items = {}; this.save(); UI.renderCart(); },
    count() { return Object.values(this.items).reduce((a, b) => a + b, 0); },
    lines() {
      return Object.entries(this.items)
        .map(([id, qty]) => ({ product: store.get(id), qty }))
        .filter((l) => l.product);
    },
    subtotal() { return this.lines().reduce((s, l) => s + l.product.price * l.qty, 0); },
    shipping() {
      const st = this.subtotal();
      if (st === 0) return 0;
      return st >= (CFG.FREE_SHIP_MIN || 200000) ? 0 : (CFG.SHIPPING_FEE || 15000);
    },
    total() { return this.subtotal() + this.shipping(); },
  };
  cart.load();

  /* ---------- Đơn hàng ---------- */
  function genCode() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return "PC" + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + rand;
  }
  async function createOrder(info) {
    const lines = cart.lines();
    const payload = {
      order_code: genCode(),
      customer_name: info.name,
      phone: info.phone,
      address: info.address,
      note: info.note || "",
      items: lines.map((l) => ({ id: l.product.id, name: l.product.name, price: l.product.price, qty: l.qty })),
      subtotal: cart.subtotal(),
      shipping_fee: cart.shipping(),
      total: cart.total(),
      payment_method: "cod",
      status: "pending",
    };
    if (LIVE) {
      const { error } = await sb.from("orders").insert(payload);
      if (error) throw error;
      try {
        const mine = JSON.parse(localStorage.getItem("pcn_my_orders") || "[]");
        mine.unshift({ code: payload.order_code, phone: payload.phone });
        localStorage.setItem("pcn_my_orders", JSON.stringify(mine.slice(0, 10)));
      } catch (e) {}
      return payload;
    }
    // Demo mode: lưu local
    const demo = JSON.parse(localStorage.getItem("pcn_demo_orders") || "[]");
    demo.unshift({ ...payload, created_at: new Date().toISOString() });
    localStorage.setItem("pcn_demo_orders", JSON.stringify(demo));
    return payload;
  }
  async function getOrder(code, phone) {
    code = (code || "").trim().toUpperCase(); phone = (phone || "").trim();
    if (LIVE) {
      const { data, error } = await sb.rpc("get_my_order", { p_code: code, p_phone: phone });
      if (error) throw error;
      return data;
    }
    const demo = JSON.parse(localStorage.getItem("pcn_demo_orders") || "[]");
    return demo.find((o) => o.order_code === code && o.phone === phone) || null;
  }

  /* ---------- Tiện ích hiển thị ---------- */
  function money(n) { return (Number(n) || 0).toLocaleString("vi-VN") + "đ"; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  const STATUS_LABEL = {
    pending: "Chờ xác nhận", confirmed: "Đã xác nhận", preparing: "Đang chuẩn bị",
    delivering: "Đang giao", completed: "Hoàn thành", cancelled: "Đã hủy",
  };

  const UI = {
    toast(msg) {
      let t = document.getElementById("pcn-toast");
      if (!t) { t = document.createElement("div"); t.id = "pcn-toast"; document.body.appendChild(t); }
      t.textContent = msg; t.classList.add("show");
      clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2200);
    },
    updateBadge() {
      const n = cart.count();
      document.querySelectorAll(".cart-count").forEach((el) => {
        el.textContent = n; el.style.display = n > 0 ? "inline-flex" : "none";
      });
      const bar = document.getElementById("mobile-cart-bar");
      if (bar) bar.style.display = n > 0 ? "flex" : "none";
    },
    productCard(p) {
      const sale = p.old_price && p.old_price > p.price
        ? `<span class="badge-sale">-${Math.round((1 - p.price / p.old_price) * 100)}%</span>` : "";
      const oldP = p.old_price && p.old_price > p.price
        ? `<span class="price-old">${money(p.old_price)}</span>` : "";
      return `
      <article class="product-card">
        <div class="product-media">${sale}<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy"></div>
        <div class="product-body">
          <span class="product-cat">${esc(p.category || "")}</span>
          <h3 class="product-name">${esc(p.name)}</h3>
          <p class="product-desc">${esc(p.description || "")}</p>
          <div class="product-foot">
            <div class="price"><span class="price-now">${money(p.price)}</span>${oldP}</div>
            <button class="btn btn-primary btn-add" data-add="${esc(p.id)}" aria-label="Thêm ${esc(p.name)} vào giỏ">Thêm +</button>
          </div>
        </div>
      </article>`;
    },
    renderCart() {
      const box = document.getElementById("cart-lines");
      if (!box) return;
      const lines = cart.lines();
      if (!lines.length) {
        box.innerHTML = `<div class="cart-empty"><p>Giỏ hàng đang trống.</p><a class="btn btn-primary" href="thuc-don.html">Xem thực đơn</a></div>`;
      } else {
        box.innerHTML = lines.map((l) => `
          <div class="cart-line" data-id="${esc(l.product.id)}">
            <img src="${esc(l.product.image_url)}" alt="${esc(l.product.name)}">
            <div class="cart-line-info">
              <strong>${esc(l.product.name)}</strong>
              <span class="cart-line-price">${money(l.product.price)}</span>
              <div class="qty">
                <button data-dec="${esc(l.product.id)}" aria-label="Giảm">−</button>
                <span>${l.qty}</span>
                <button data-inc="${esc(l.product.id)}" aria-label="Tăng">+</button>
              </div>
            </div>
            <button class="cart-remove" data-del="${esc(l.product.id)}" aria-label="Xóa món">×</button>
          </div>`).join("");
      }
      const sub = document.getElementById("cart-subtotal");
      const ship = document.getElementById("cart-ship");
      const tot = document.getElementById("cart-total");
      if (sub) sub.textContent = money(cart.subtotal());
      if (ship) ship.textContent = cart.shipping() === 0 ? (cart.count() ? "Miễn phí" : money(0)) : money(cart.shipping());
      if (tot) tot.textContent = money(cart.total());
      const go = document.getElementById("cart-checkout-btn");
      if (go) go.classList.toggle("disabled", cart.count() === 0);
      this.updateBadge();
    },
    openCart() { document.getElementById("cart-drawer").classList.add("open"); document.getElementById("cart-overlay").classList.add("show"); document.body.style.overflow = "hidden"; },
    closeCart() { document.getElementById("cart-drawer").classList.remove("open"); document.getElementById("cart-overlay").classList.remove("show"); document.body.style.overflow = ""; },
  };

  /* ---------- Sự kiện toàn cục ---------- */
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) { cart.add(add.dataset.add, 1); UI.toast("Đã thêm vào giỏ hàng"); UI.openCart(); return; }
    const inc = e.target.closest("[data-inc]");
    if (inc) { const id = inc.dataset.inc; cart.setQty(id, (cart.items[id] || 0) + 1); return; }
    const dec = e.target.closest("[data-dec]");
    if (dec) { const id = dec.dataset.dec; cart.setQty(id, (cart.items[id] || 0) - 1); return; }
    const del = e.target.closest("[data-del]");
    if (del) { cart.setQty(del.dataset.del, 0); return; }
    if (e.target.closest("[data-open-cart]")) { UI.renderCart(); UI.openCart(); return; }
    if (e.target.closest("[data-close-cart]") || e.target.id === "cart-overlay") { UI.closeCart(); return; }
    const nav = e.target.closest("#nav-toggle");
    if (nav) { document.getElementById("site-nav").classList.toggle("open"); return; }
  });

  document.addEventListener("DOMContentLoaded", () => {
    UI.updateBadge(); UI.renderCart();
    const y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
  });

  window.PCN = { CFG, DEMO_MODE, LIVE, store, cart, UI, money, esc, STATUS_LABEL, createOrder, getOrder };
})();
