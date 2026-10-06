-- ============================================================
-- PHỞ CUỐN NGON — Database schema cho Supabase (PostgreSQL)
-- Chạy file này 1 lần trong Supabase > SQL Editor > New query
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Bảng sản phẩm ----------
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  description text,
  price       integer not null check (price >= 0),
  old_price   integer check (old_price is null or old_price >= 0),
  image_url   text,
  category    text not null default 'Phở cuốn',
  is_available boolean not null default true,
  is_featured  boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- Bảng đơn hàng ----------
create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  order_code     text unique not null,
  customer_name  text not null,
  phone          text not null,
  address        text not null,
  note           text default '',
  items          jsonb not null default '[]'::jsonb,
  subtotal       integer not null default 0,
  shipping_fee   integer not null default 0,
  total          integer not null default 0,
  status         text not null default 'pending'
                 check (status in ('pending','confirmed','preparing','delivering','completed','cancelled')),
  payment_method text not null default 'cod',
  created_at     timestamptz not null default now()
);
create index if not exists idx_orders_code  on orders (order_code);
create index if not exists idx_orders_phone on orders (phone);
create index if not exists idx_orders_created on orders (created_at desc);

-- ---------- Bảng cài đặt (mã PIN quản trị…) ----------
create table if not exists settings (
  key   text primary key,
  value text not null
);

-- ---------- Row Level Security ----------
alter table products enable row level security;
alter table orders   enable row level security;
alter table settings enable row level security;

-- Ai cũng xem được sản phẩm đang bán
drop policy if exists "products_public_read" on products;
create policy "products_public_read"
  on products for select
  using (is_available = true);

-- Khách chỉ được TẠO đơn (không xem/sửa/xóa trực tiếp)
drop policy if exists "orders_public_insert" on orders;
create policy "orders_public_insert"
  on orders for insert
  with check (true);

-- Không policy nào khác cho anon => settings & orders an toàn.

-- ---------- Hàm RPC: khách tra cứu đơn của chính mình ----------
create or replace function get_my_order(p_code text, p_phone text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare r jsonb;
begin
  select to_jsonb(o) into r
  from orders o
  where o.order_code = p_code and o.phone = p_phone
  limit 1;
  return r;
end $$;

-- ---------- Hàm RPC: quản trị ----------
create or replace function _admin_ok(p_pin text)
returns boolean
language sql security definer
set search_path = public
as $$
  select exists (
    select 1 from settings where key = 'admin_pin' and value = p_pin
  );
$$;

create or replace function admin_login(p_pin text)
returns boolean
language sql security definer
set search_path = public
as $$ select _admin_ok(p_pin); $$;

create or replace function admin_list_orders(p_pin text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
begin
  if not _admin_ok(p_pin) then
    raise exception 'unauthorized';
  end if;
  return coalesce(
    (select jsonb_agg(to_jsonb(o) order by o.created_at desc) from orders o),
    '[]'::jsonb
  );
end $$;

create or replace function admin_update_order(p_pin text, p_id uuid, p_status text)
returns boolean
language plpgsql security definer
set search_path = public
as $$
begin
  if not _admin_ok(p_pin) then
    raise exception 'unauthorized';
  end if;
  if p_status not in ('pending','confirmed','preparing','delivering','completed','cancelled') then
    raise exception 'invalid status';
  end if;
  update orders set status = p_status where id = p_id;
  return found;
end $$;

-- Cho phép anon gọi các hàm RPC trên (PostgREST)
grant execute on function get_my_order(text, text) to anon;
grant execute on function admin_login(text) to anon;
grant execute on function admin_list_orders(text) to anon;
grant execute on function admin_update_order(text, uuid, text) to anon;
