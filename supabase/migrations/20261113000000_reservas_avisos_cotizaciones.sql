-- =====================================================================
-- Reservas con adelanto, "Avísame cuando llegue" y cotizaciones (proformas)
-- =====================================================================

-- ---------------------------------------------------------------------
-- RESERVAS: el cliente separa la unidad con un adelanto por unos días.
-- Mientras está activa, el equipo figura como "Reservado". Si vence o se
-- cancela vuelve a su estado anterior; si se vende, la reserva se completa.
-- ---------------------------------------------------------------------
create type estado_reserva as enum ('activa', 'completada', 'cancelada', 'vencida');
create sequence if not exists reservas_codigo_seq;

create table reservas (
  id                  bigint generated always as identity primary key,
  codigo              text not null unique default 'R-' || lpad(nextval('reservas_codigo_seq')::text, 5, '0'),
  unidad_id           bigint not null references unidades(id),
  cliente_id          bigint references clientes(id) on delete set null,
  vendedor_id         uuid default auth.uid() references perfiles(id) on delete set null,
  precio_acordado_pen numeric(12,2) not null check (precio_acordado_pen > 0),
  adelanto_pen        numeric(12,2) not null check (adelanto_pen > 0),
  metodo_pago         metodo_pago not null default 'yape',
  vence_en            date not null,
  estado              estado_reserva not null default 'activa',
  estado_previo       estado_unidad,
  venta_id            bigint references ventas(id) on delete set null,
  notas               text,
  creado_en           timestamptz not null default now(),
  constraint adelanto_menor_precio check (adelanto_pen < precio_acordado_pen)
);
-- una unidad solo puede tener UNA reserva activa
create unique index reservas_unidad_activa on reservas (unidad_id) where estado = 'activa';
create index on reservas (unidad_id);
create index on reservas (cliente_id);
create index on reservas (vendedor_id);
create index on reservas (venta_id);

create or replace function public.antes_reserva() returns trigger
language plpgsql security definer set search_path = public as $$
declare u unidades;
begin
  select * into u from unidades where id = new.unidad_id for update;
  if u.estado not in ('disponible', 'en_transito') then
    raise exception 'El equipo % no se puede reservar (estado: %)', u.sku, u.estado;
  end if;
  new.estado_previo := u.estado;
  return new;
end $$;

create or replace function public.despues_reserva() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.estado = 'activa' then
    update unidades set estado = 'reservado' where id = new.unidad_id;
    insert into movimientos (unidad_id, evento, detalle)
    values (new.unidad_id, 'reserva',
            format('Reserva %s · adelanto S/ %s · vence el %s', new.codigo, new.adelanto_pen, to_char(new.vence_en, 'DD/MM/YYYY')));
  elsif tg_op = 'UPDATE' and old.estado = 'activa' and new.estado in ('cancelada', 'vencida') then
    update unidades set estado = coalesce(new.estado_previo, 'disponible')
    where id = new.unidad_id and estado = 'reservado';
    insert into movimientos (unidad_id, evento, detalle)
    values (new.unidad_id, 'reserva_' || new.estado::text, format('Reserva %s %s', new.codigo, new.estado::text));
  end if;
  return null;
end $$;

create trigger reservas_antes before insert on reservas for each row execute function public.antes_reserva();
create trigger reservas_despues after insert or update on reservas for each row execute function public.despues_reserva();

-- al vender un equipo reservado, la reserva queda completada y enlazada a la venta
create or replace function public.despues_venta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.estado = 'completada' then
    update unidades set estado = 'vendido' where id = new.unidad_id;
    update reservas set estado = 'completada', venta_id = new.id
    where unidad_id = new.unidad_id and estado = 'activa';
  elsif tg_op = 'UPDATE' and old.estado = 'completada' and new.estado = 'anulada' then
    update unidades set estado = 'disponible' where id = new.unidad_id;
    insert into movimientos (unidad_id, evento, detalle)
    values (new.unidad_id, 'venta_anulada', 'Venta ' || new.codigo || ' anulada');
  end if;
  return null;
end $$;

-- vencimiento automático (hora de Perú). Se ejecuta a diario y al abrir el panel.
create or replace function public.liberar_reservas_vencidas() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  -- solo el personal activo o la tarea programada (sin usuario) pueden ejecutarla
  if auth.uid() is not null and not privado.es_personal() then
    return 0;
  end if;
  update reservas set estado = 'vencida'
  where estado = 'activa' and vence_en < (now() at time zone 'America/Lima')::date;
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.liberar_reservas_vencidas() from public, anon;
grant execute on function public.liberar_reservas_vencidas() to authenticated;
revoke execute on function public.antes_reserva() from public, anon, authenticated;
revoke execute on function public.despues_reserva() from public, anon, authenticated;
revoke execute on function public.despues_venta() from public, anon, authenticated;

alter table reservas enable row level security;
create policy "lee reservas" on reservas for select to authenticated
  using (privado.es_admin() or (privado.es_personal() and vendedor_id = auth.uid()));
create policy "crea reservas" on reservas for insert to authenticated
  with check (privado.es_admin() or (privado.es_personal() and vendedor_id = auth.uid()));
create policy "edita reservas" on reservas for update to authenticated
  using (privado.es_admin() or (privado.es_personal() and vendedor_id = auth.uid()))
  with check (privado.es_admin() or (privado.es_personal() and vendedor_id = auth.uid()));
grant usage on sequence reservas_codigo_seq to authenticated;

-- ---------------------------------------------------------------------
-- AVISOS: "Avísame cuando llegue / si se libera / si llega uno similar".
-- El público solo puede INSERTAR (no leer). El personal los atiende.
-- ---------------------------------------------------------------------
create type estado_aviso as enum ('pendiente', 'contactado', 'descartado');

create table avisos (
  id         bigint generated always as identity primary key,
  unidad_id  bigint references unidades(id) on delete set null,
  nombre     text not null check (char_length(nombre) between 2 and 80),
  telefono   text not null check (telefono ~ '^\+?[0-9]{9,15}$'),
  mensaje    text check (char_length(mensaje) <= 300),
  estado     estado_aviso not null default 'pendiente',
  creado_en  timestamptz not null default now()
);
create index on avisos (unidad_id);
create index on avisos (estado, creado_en desc);
-- evita registros repetidos del mismo número para el mismo equipo
create unique index avisos_sin_duplicados on avisos (coalesce(unidad_id, 0), telefono) where estado = 'pendiente';

alter table avisos enable row level security;
revoke all on avisos from anon;
grant insert (unidad_id, nombre, telefono, mensaje) on avisos to anon;
create policy "publico deja aviso" on avisos for insert to anon, authenticated with check (estado = 'pendiente');
create policy "personal lee avisos" on avisos for select to authenticated using (privado.es_personal());
create policy "personal atiende avisos" on avisos for update to authenticated
  using (privado.es_personal()) with check (privado.es_personal());
create policy "admin borra avisos" on avisos for delete to authenticated using (privado.es_admin());

-- ---------------------------------------------------------------------
-- COTIZACIONES (proformas): uno o varios equipos para un cliente.
-- Se convierten en venta(s) con un clic, en una sola transacción.
-- ---------------------------------------------------------------------
create type estado_cotizacion as enum ('pendiente', 'aceptada', 'anulada');
create sequence if not exists cotizaciones_codigo_seq;

create table cotizaciones (
  id           bigint generated always as identity primary key,
  codigo       text not null unique default 'C-' || lpad(nextval('cotizaciones_codigo_seq')::text, 5, '0'),
  cliente_id   bigint references clientes(id) on delete set null,
  vendedor_id  uuid default auth.uid() references perfiles(id) on delete set null,
  fecha        timestamptz not null default now(),
  valida_hasta date not null,
  estado       estado_cotizacion not null default 'pendiente',
  notas        text,
  creado_en    timestamptz not null default now()
);
create index on cotizaciones (cliente_id);
create index on cotizaciones (vendedor_id);

create table cotizacion_items (
  id             bigint generated always as identity primary key,
  cotizacion_id  bigint not null references cotizaciones(id) on delete cascade,
  unidad_id      bigint not null references unidades(id),
  precio_pen     numeric(12,2) not null check (precio_pen > 0),
  descuento_pen  numeric(12,2) not null default 0,
  constraint descuento_valido check (descuento_pen >= 0 and descuento_pen < precio_pen),
  unique (cotizacion_id, unidad_id)
);
create index on cotizacion_items (unidad_id);

alter table ventas add column if not exists cotizacion_id bigint references cotizaciones(id) on delete set null;
create index if not exists ventas_cotizacion_id_idx on ventas (cotizacion_id);

alter table cotizaciones enable row level security;
create policy "lee cotizaciones" on cotizaciones for select to authenticated
  using (privado.es_admin() or (privado.es_personal() and vendedor_id = auth.uid()));
create policy "crea cotizaciones" on cotizaciones for insert to authenticated
  with check (privado.es_admin() or (privado.es_personal() and vendedor_id = auth.uid()));
create policy "edita cotizaciones" on cotizaciones for update to authenticated
  using (privado.es_admin() or (privado.es_personal() and vendedor_id = auth.uid()))
  with check (privado.es_admin() or (privado.es_personal() and vendedor_id = auth.uid()));

alter table cotizacion_items enable row level security;
create policy "items de cotizaciones visibles" on cotizacion_items for all to authenticated
  using (exists (select 1 from cotizaciones c where c.id = cotizacion_id))
  with check (exists (select 1 from cotizaciones c where c.id = cotizacion_id and c.estado = 'pendiente'));
grant usage on sequence cotizaciones_codigo_seq to authenticated;

-- Convierte una cotización en ventas (una por equipo). Corre con los permisos
-- de quien llama (RLS aplica). Si algún equipo ya no está disponible, no se registra nada.
create or replace function public.convertir_cotizacion(p_id bigint, p_metodo metodo_pago, p_canal canal_venta)
returns bigint
language plpgsql security invoker set search_path = public as $$
declare c cotizaciones; it record; primera bigint; vid bigint;
begin
  select * into c from cotizaciones where id = p_id for update;
  if not found then raise exception 'Cotización no encontrada'; end if;
  if c.estado <> 'pendiente' then raise exception 'La cotización % ya está %', c.codigo, c.estado; end if;
  for it in select * from cotizacion_items where cotizacion_id = p_id order by id loop
    insert into ventas (unidad_id, cliente_id, vendedor_id, precio_lista_pen, descuento_pen, metodo_pago, canal, cotizacion_id, notas)
    values (it.unidad_id, c.cliente_id, auth.uid(), it.precio_pen, it.descuento_pen, p_metodo, p_canal, c.id, 'Según cotización ' || c.codigo)
    returning id into vid;
    primera := coalesce(primera, vid);
  end loop;
  if primera is null then raise exception 'La cotización no tiene equipos'; end if;
  update cotizaciones set estado = 'aceptada' where id = p_id;
  return primera;
end $$;
revoke execute on function public.convertir_cotizacion(bigint, metodo_pago, canal_venta) from public, anon;
grant execute on function public.convertir_cotizacion(bigint, metodo_pago, canal_venta) to authenticated;

-- ---------------------------------------------------------------------
-- Tarea diaria: liberar reservas vencidas (00:05 hora de Perú = 05:05 UTC)
-- ---------------------------------------------------------------------
create extension if not exists pg_cron;
select cron.schedule('liberar-reservas-vencidas', '5 5 * * *', $$select public.liberar_reservas_vencidas()$$);
