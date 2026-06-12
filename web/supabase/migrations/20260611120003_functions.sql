-- ╔══════════════════════════════════════════════════════════╗
-- ║ 함수 / 트리거                                              ║
-- ╚══════════════════════════════════════════════════════════╝

-- ── 가입 시 profiles 자동 생성 ──────────────────────────────
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',
                           new.raw_user_meta_data->>'full_name'));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── 일반 유저의 민감 필드 변경 차단 ─────────────────────────
create or replace function protect_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    if new.role          is distinct from old.role
    or new.grade         is distinct from old.grade
    or new.points_balance is distinct from old.points_balance
    or new.is_banned     is distinct from old.is_banned
    or new.created_at    is distinct from old.created_at then
      raise exception 'FORBIDDEN_PROFILE_FIELD';
    end if;
  end if;
  return new;
end; $$;

create trigger t_profiles_protect before update on profiles
  for each row execute function protect_profile_fields();

-- ── 리뷰: 구매 이력 기반 is_verified 자동 설정 ──────────────
create or replace function set_review_verified() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.is_verified := exists (
    select 1
      from order_items oi
      join orders o on o.id = oi.order_id
     where o.user_id = new.user_id
       and oi.product_id = new.product_id
       and o.status in ('paid','preparing','shipped','delivered')
  );
  return new;
end; $$;

create trigger t_reviews_verify before insert on reviews
  for each row execute function set_review_verified();

-- ── 주문 생성 (재고차감 + 가격확정 + 쿠폰검증, 원자적) ──────
create or replace function place_order(
  p_items      jsonb,                       -- [{product_id, option_value_id?, qty, customization?}]
  p_coupon_code text default null,
  p_recipient  text default '',
  p_phone      text default '',
  p_address    text default '',
  p_memo       text default null,
  p_pay_method text default 'bank'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user_id  uuid := auth.uid();
  v_order_id uuid;
  v_subtotal int := 0;
  v_discount int := 0;
  v_item   jsonb;
  v_pid    uuid;
  v_ovid   uuid;
  v_qty    int;
  v_price  int;
  v_stock  int;
  v_pname  text;
  v_olabel text;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'EMPTY_CART'; end if;

  -- coupon_code는 검증 통과 후(말미)에 설정한다.
  -- (무효 코드를 여기서 넣으면 FK 위반이 쿠폰 검증보다 먼저 터짐)
  insert into orders (user_id, subtotal, discount, total, coupon_code,
                      pay_method, recipient, phone, address, memo, status)
  values (v_user_id, 0, 0, 0, null,
          p_pay_method, p_recipient, p_phone, p_address, p_memo, 'pending')
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid  := (v_item->>'product_id')::uuid;
    v_ovid := nullif(v_item->>'option_value_id','')::uuid;
    v_qty  := coalesce((v_item->>'qty')::int, 1);
    if v_qty < 1 then raise exception 'BAD_QTY'; end if;

    -- 가격/재고를 DB에서 확정 + 상품행 잠금(동시성)
    select p.name,
           coalesce(ov.price, p.sale_price, p.price),
           coalesce(ov.stock, p.stock),
           case when ov.id is not null then opt.label || ' / ' || ov.name end
      into v_pname, v_price, v_stock, v_olabel
      from products p
      left join product_option_values ov on ov.id = v_ovid
      left join product_options opt       on opt.id = ov.option_id
     where p.id = v_pid and p.is_active
     for update of p;

    if v_pname is null then raise exception 'PRODUCT_NOT_FOUND: %', v_pid; end if;
    if v_stock < v_qty then raise exception 'OUT_OF_STOCK: %', v_pid; end if;

    if v_ovid is not null then
      update product_option_values set stock = stock - v_qty where id = v_ovid;
    else
      update products set stock = stock - v_qty where id = v_pid;
    end if;

    insert into order_items (order_id, product_id, product_name, option_label,
                             unit_price, qty, customization)
    values (v_order_id, v_pid, v_pname, v_olabel, v_price, v_qty, v_item->'customization');

    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  -- 쿠폰: 보유/유효/최소금액 서버 검증
  if p_coupon_code is not null then
    select case c.discount_type
             when 'amount'  then c.discount_value
             when 'percent' then v_subtotal * c.discount_value / 100
           end
      into v_discount
      from coupons c
      join user_coupons uc on uc.code = c.code and uc.user_id = v_user_id
     where c.code = p_coupon_code
       and c.is_active
       and uc.used_at is null
       and (c.expires_at is null or c.expires_at > now())
       and v_subtotal >= c.min_order;

    if v_discount is null then raise exception 'INVALID_COUPON'; end if;
    if v_discount > v_subtotal then v_discount := v_subtotal; end if;

    update user_coupons set used_at = now()
     where user_id = v_user_id and code = p_coupon_code;
  end if;

  update orders
     set subtotal    = v_subtotal,
         discount    = coalesce(v_discount, 0),
         total       = v_subtotal - coalesce(v_discount, 0),
         coupon_code = p_coupon_code   -- 검증 통과한 경우에만 도달
   where id = v_order_id;

  return v_order_id;
end; $$;

-- ── 권한(execute) ───────────────────────────────────────────
grant execute on function is_admin()                                   to anon, authenticated;
grant execute on function place_order(jsonb, text, text, text, text, text, text) to authenticated;
