-- =====================================================================
-- 1) Precio de adquisición: un solo monto en soles por equipo que ya incluye
--    compra, pasaje/flete, desaduanaje y demás gastos. Reemplaza al cálculo
--    "costo USD × tipo de cambio del lote + gastos extra" (que se mantiene solo
--    para equipos antiguos que no tengan este dato).
-- =====================================================================
alter table unidades add column if not exists costo_adquisicion_pen numeric(12,2) check (costo_adquisicion_pen >= 0);
-- (anon no recibe permiso sobre esta columna: el público nunca ve costos)

create or replace function public.costo_unidad_pen(u unidades)
returns numeric language sql stable set search_path = public as $$
  select coalesce(
    u.costo_adquisicion_pen,
    round(u.costo_usd * coalesce((select tipo_cambio from lotes where id = u.lote_id), 3.75) + u.costo_extra_pen, 2)
  )
$$;

-- =====================================================================
-- 2) Configuración de la empresa (una sola fila): datos que se muestran en
--    la web, en las notas de venta y en las cotizaciones. Solo el admin edita.
-- =====================================================================
create table if not exists empresa (
  id             int primary key default 1 check (id = 1),
  nombre         text not null default 'Laptops Americanas',
  razon_social   text,
  ruc            text check (ruc is null or ruc ~ '^\d{11}$'),
  whatsapp       text not null default '51900000000' check (whatsapp ~ '^\d{9,15}$'),
  telefono       text,
  email          text,
  direccion      text,
  ciudad         text default 'Huánuco, Perú',
  horario        text,
  facebook       text,
  instagram      text,
  tiktok         text,
  actualizado_en timestamptz not null default now()
);

insert into empresa (id, nombre, whatsapp, email, direccion, ciudad, horario)
values (1, 'Laptops Americanas', '51900000000', 'ventas@laptopsamericanas.pe',
        'Centro de Huánuco (dirección por confirmar)', 'Huánuco, Perú', 'Lunes a sábado · 9:00 a. m. – 8:00 p. m.')
on conflict (id) do nothing;

alter table empresa enable row level security;
create policy "empresa publica" on empresa for select to anon, authenticated using (true);
create policy "admin edita empresa" on empresa for update to authenticated
  using (privado.es_admin()) with check (privado.es_admin());
revoke insert, delete, truncate on empresa from anon, authenticated;
revoke update on empresa from anon;
