-- =====================================================================
-- Laptops Americanas · Esquema inicial
-- Inventario POR UNIDAD: cada laptop importada es un registro único
-- (modelo = ficha de catálogo, unidad = equipo físico con serie).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Tipos ----------
create type rol_usuario      as enum ('admin', 'vendedor');
create type condicion_equipo as enum ('nuevo', 'open_box', 'seminuevo', 'remate');
create type grado_estetico   as enum ('A', 'B', 'C');
create type estado_unidad    as enum ('en_transito', 'disponible', 'reservado', 'vendido', 'garantia', 'baja');
create type estado_lote      as enum ('comprado', 'en_transito', 'en_aduana', 'recibido');
create type metodo_pago      as enum ('efectivo', 'yape', 'plin', 'transferencia', 'tarjeta');
create type canal_venta      as enum ('tienda', 'whatsapp', 'tiktok', 'facebook', 'instagram', 'web');
create type estado_venta     as enum ('completada', 'anulada');
create type tipo_media       as enum ('imagen', 'video', 'video_url');

-- ---------- Perfiles (usuarios del panel) ----------
create table perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null default '',
  rol         rol_usuario not null default 'vendedor',
  creado_en   timestamptz not null default now()
);

-- ---------- Catálogos ----------
create table marcas (
  id      bigint generated always as identity primary key,
  nombre  text not null unique,
  slug    text not null unique
);

create table categorias (
  id           bigint generated always as identity primary key,
  nombre       text not null unique,
  slug         text not null unique,
  descripcion  text
);

-- Modelo = ficha general (p. ej. "Dell G7 7588")
create table modelos (
  id            bigint generated always as identity primary key,
  marca_id      bigint not null references marcas(id),
  categoria_id  bigint not null references categorias(id),
  nombre        text not null,
  slug          text not null unique,
  descripcion   text,
  anio          int,
  creado_en     timestamptz not null default now()
);
create index on modelos (marca_id);
create index on modelos (categoria_id);

-- ---------- Importaciones (lotes desde EE.UU.) ----------
create table lotes (
  id               bigint generated always as identity primary key,
  codigo           text not null unique,
  proveedor        text not null,              -- eBay, Amazon, Best Buy, subasta...
  origen           text not null default 'Miami, FL',
  courier          text,
  fecha_compra     date not null,
  fecha_llegada    date,
  flete_usd        numeric(12,2) not null default 0,
  aduana_pen       numeric(12,2) not null default 0,
  tipo_cambio      numeric(8,4)  not null default 3.75,
  estado           estado_lote   not null default 'comprado',
  notas            text,
  creado_en        timestamptz not null default now()
);

-- ---------- Unidades (cada equipo físico) ----------
create table unidades (
  id                bigint generated always as identity primary key,
  modelo_id         bigint not null references modelos(id),
  lote_id           bigint references lotes(id) on delete set null,
  sku               text not null unique,
  serie             text unique,
  slug              text not null unique,
  -- configuración real del equipo (la "variante")
  procesador        text not null,
  ram_gb            int  not null,
  ram_tipo          text,
  almacenamiento_gb int  not null,
  almacenamiento    text not null,          -- "512 GB SSD + 1 TB HDD"
  gpu               text,
  pantalla_pulg     numeric(4,1) not null,
  pantalla_detalle  text,                   -- "Full HD 144 Hz"
  color             text,
  sistema           text default 'Windows 11 Pro',
  condicion         condicion_equipo not null default 'seminuevo',
  grado             grado_estetico   not null default 'A',
  garantia_meses    int not null default 12,
  -- costos y precios
  costo_usd         numeric(12,2) not null default 0,   -- precio de compra en EE.UU.
  costo_extra_pen   numeric(12,2) not null default 0,   -- flete/aduana prorrateado + repuestos
  precio_pen        numeric(12,2) not null,
  precio_oferta_pen numeric(12,2),
  -- estado
  estado            estado_unidad not null default 'disponible',
  publicado         boolean not null default true,
  destacado         boolean not null default false,
  descripcion       text,
  notas_internas    text,
  ingresado_en      date not null default current_date,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now(),
  constraint precio_oferta_menor check (precio_oferta_pen is null or precio_oferta_pen < precio_pen)
);
create index on unidades (modelo_id);
create index on unidades (lote_id);
create index on unidades (estado);

-- ---------- Fotos y videos ----------
create table medios (
  id           bigint generated always as identity primary key,
  unidad_id    bigint not null references unidades(id) on delete cascade,
  tipo         tipo_media not null default 'imagen',
  url          text not null,
  ruta         text,                         -- ruta en Storage (para borrar)
  posicion     int  not null default 0,
  es_portada   boolean not null default false,
  creado_en    timestamptz not null default now()
);
create index on medios (unidad_id, posicion);

-- ---------- Clientes ----------
create table clientes (
  id           bigint generated always as identity primary key,
  nombre       text not null,
  tipo_doc     text not null default 'DNI',
  num_doc      text,
  telefono     text,
  email        text,
  ciudad       text default 'Huánuco',
  creado_en    timestamptz not null default now()
);

-- ---------- Ventas ----------
create table ventas (
  id               bigint generated always as identity primary key,
  codigo           text not null unique,
  unidad_id        bigint not null references unidades(id),
  cliente_id       bigint references clientes(id) on delete set null,
  vendedor_id      uuid references perfiles(id) on delete set null,
  fecha            timestamptz not null default now(),
  precio_lista_pen numeric(12,2) not null,
  descuento_pen    numeric(12,2) not null default 0,
  total_pen        numeric(12,2) generated always as (precio_lista_pen - descuento_pen) stored,
  costo_total_pen  numeric(12,2) not null default 0,   -- costo congelado al vender (para utilidad)
  metodo_pago      metodo_pago not null default 'efectivo',
  canal            canal_venta not null default 'tienda',
  garantia_hasta   date,
  estado           estado_venta not null default 'completada',
  notas            text,
  creado_en        timestamptz not null default now()
);
create index on ventas (fecha);
create index on ventas (unidad_id);
-- una unidad solo puede tener UNA venta completada
create unique index ventas_unidad_completada on ventas (unidad_id) where estado = 'completada';

-- ---------- Historial de movimientos ----------
create table movimientos (
  id            bigint generated always as identity primary key,
  unidad_id     bigint not null references unidades(id) on delete cascade,
  evento        text not null,
  estado_antes  estado_unidad,
  estado_nuevo  estado_unidad,
  detalle       text,
  usuario_id    uuid default auth.uid(),
  creado_en     timestamptz not null default now()
);
create index on movimientos (unidad_id, creado_en desc);

-- =====================================================================
-- Funciones y triggers
-- =====================================================================

-- Costo total en soles de una unidad
create or replace function costo_unidad_pen(u unidades)
returns numeric language sql stable as $$
  select round(u.costo_usd * coalesce((select tipo_cambio from lotes where id = u.lote_id), 3.75)
               + u.costo_extra_pen, 2)
$$;

create or replace function tocar_actualizado() returns trigger
language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

create trigger unidades_actualizado before update on unidades
for each row execute function tocar_actualizado();

-- Registrar alta y cambios de estado/precio en el historial
create or replace function registrar_movimiento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into movimientos (unidad_id, evento, estado_nuevo, detalle)
    values (new.id, 'alta', new.estado, 'Equipo registrado en inventario');
  else
    if new.estado is distinct from old.estado then
      insert into movimientos (unidad_id, evento, estado_antes, estado_nuevo)
      values (new.id, 'cambio_estado', old.estado, new.estado);
    end if;
    if new.precio_pen is distinct from old.precio_pen
       or new.precio_oferta_pen is distinct from old.precio_oferta_pen then
      insert into movimientos (unidad_id, evento, detalle)
      values (new.id, 'cambio_precio',
              format('S/ %s → S/ %s%s', old.precio_pen, new.precio_pen,
                     case when new.precio_oferta_pen is not null
                          then format(' (oferta S/ %s)', new.precio_oferta_pen) else '' end));
    end if;
  end if;
  return new;
end $$;

create trigger unidades_movimiento after insert or update on unidades
for each row execute function registrar_movimiento();

-- Al registrar/anular una venta: actualizar estado de la unidad y congelar el costo
create or replace function procesar_venta() returns trigger
language plpgsql security definer set search_path = public as $$
declare u unidades;
begin
  if tg_op = 'INSERT' then
    select * into u from unidades where id = new.unidad_id for update;
    if u.estado in ('vendido', 'baja') then
      raise exception 'El equipo % no está disponible para la venta (estado: %)', u.sku, u.estado;
    end if;
    new.costo_total_pen := costo_unidad_pen(u);
    if new.garantia_hasta is null then
      new.garantia_hasta := (new.fecha + make_interval(months => u.garantia_meses))::date;
    end if;
    return new;
  end if;
  return new;
end $$;

create trigger ventas_antes before insert on ventas
for each row execute function procesar_venta();

create or replace function despues_venta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.estado = 'completada' then
    update unidades set estado = 'vendido' where id = new.unidad_id;
  elsif tg_op = 'UPDATE' and old.estado = 'completada' and new.estado = 'anulada' then
    update unidades set estado = 'disponible' where id = new.unidad_id;
    insert into movimientos (unidad_id, evento, detalle)
    values (new.unidad_id, 'venta_anulada', 'Venta ' || new.codigo || ' anulada');
  end if;
  return null;
end $$;

create trigger ventas_despues after insert or update on ventas
for each row execute function despues_venta();

-- Crear perfil automáticamente al registrar un usuario
create or replace function nuevo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre, rol)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
          coalesce((new.raw_user_meta_data->>'rol')::rol_usuario, 'vendedor'));
  return new;
end $$;

create trigger al_crear_usuario after insert on auth.users
for each row execute function nuevo_usuario();

create or replace function es_personal() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid())
$$;

create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
$$;

-- =====================================================================
-- Seguridad (RLS)
-- Público: solo lee catálogo publicado y SIN costos.
-- Personal (admin/vendedor): gestiona todo. Solo admin borra.
-- =====================================================================
alter table perfiles    enable row level security;
alter table marcas      enable row level security;
alter table categorias  enable row level security;
alter table modelos     enable row level security;
alter table lotes       enable row level security;
alter table unidades    enable row level security;
alter table medios      enable row level security;
alter table clientes    enable row level security;
alter table ventas      enable row level security;
alter table movimientos enable row level security;

-- lectura pública del catálogo
create policy "catalogo publico marcas"     on marcas     for select using (true);
create policy "catalogo publico categorias" on categorias for select using (true);
create policy "catalogo publico modelos"    on modelos    for select using (true);
create policy "catalogo publico unidades"   on unidades   for select
  using (publicado and estado in ('disponible', 'reservado', 'vendido', 'en_transito') or es_personal());
create policy "catalogo publico medios"     on medios     for select
  using (exists (select 1 from unidades u where u.id = unidad_id and u.publicado) or es_personal());

-- el público (anon) no puede ver columnas de costo
revoke select on unidades from anon;
grant select (id, modelo_id, sku, slug, procesador, ram_gb, ram_tipo, almacenamiento_gb, almacenamiento,
              gpu, pantalla_pulg, pantalla_detalle, color, sistema, condicion, grado, garantia_meses,
              precio_pen, precio_oferta_pen, estado, publicado, destacado, descripcion, ingresado_en, creado_en)
  on unidades to anon;

-- personal
create policy "personal escribe marcas"     on marcas     for all using (es_personal()) with check (es_personal());
create policy "personal escribe categorias" on categorias for all using (es_personal()) with check (es_personal());
create policy "personal escribe modelos"    on modelos    for all using (es_personal()) with check (es_personal());
create policy "personal escribe unidades"   on unidades   for insert with check (es_personal());
create policy "personal edita unidades"     on unidades   for update using (es_personal()) with check (es_personal());
create policy "admin borra unidades"        on unidades   for delete using (es_admin());
create policy "personal escribe medios"     on medios     for all using (es_personal()) with check (es_personal());
create policy "personal lotes"              on lotes      for all using (es_personal()) with check (es_personal());
create policy "personal clientes"           on clientes   for all using (es_personal()) with check (es_personal());
create policy "personal lee ventas"         on ventas     for select using (es_personal());
create policy "personal crea ventas"        on ventas     for insert with check (es_personal());
create policy "personal edita ventas"       on ventas     for update using (es_personal()) with check (es_personal());
create policy "personal lee movimientos"    on movimientos for select using (es_personal());
create policy "personal lee perfiles"       on perfiles   for select using (es_personal());
create policy "admin gestiona perfiles"     on perfiles   for update using (es_admin()) with check (es_admin());

-- =====================================================================
-- Storage: bucket público "medios" para fotos y videos
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('medios', 'medios', true, 104857600,
        array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do nothing;

create policy "medios lectura publica" on storage.objects for select using (bucket_id = 'medios');
create policy "medios subida personal" on storage.objects for insert to authenticated
  with check (bucket_id = 'medios' and public.es_personal());
create policy "medios borrado personal" on storage.objects for delete to authenticated
  using (bucket_id = 'medios' and public.es_personal());
