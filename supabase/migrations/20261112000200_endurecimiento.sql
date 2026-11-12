-- Correcciones sugeridas por el linter de Supabase (seguridad y rendimiento)

-- 1) search_path fijo en funciones
alter function public.costo_unidad_pen(unidades) set search_path = public;
alter function public.tocar_actualizado() set search_path = public;

-- 2) Las funciones de permisos se mueven a un esquema NO expuesto por la API REST.
--    Las políticas guardan la referencia por OID, así que siguen funcionando.
create schema if not exists privado;
grant usage on schema privado to anon, authenticated;
alter function public.es_personal() set schema privado;
alter function public.es_admin() set schema privado;

-- 3) Una sola política de lectura por tabla: las de escritura del personal ya no incluyen SELECT
drop policy "personal escribe marcas" on marcas;
drop policy "personal escribe categorias" on categorias;
drop policy "personal escribe modelos" on modelos;
drop policy "personal escribe medios" on medios;

create policy "personal crea marcas"   on marcas for insert to authenticated with check (privado.es_personal());
create policy "personal edita marcas"  on marcas for update to authenticated using (privado.es_personal()) with check (privado.es_personal());
create policy "admin borra marcas"     on marcas for delete to authenticated using (privado.es_admin());

create policy "personal crea categorias"  on categorias for insert to authenticated with check (privado.es_personal());
create policy "personal edita categorias" on categorias for update to authenticated using (privado.es_personal()) with check (privado.es_personal());
create policy "admin borra categorias"    on categorias for delete to authenticated using (privado.es_admin());

create policy "personal crea modelos"  on modelos for insert to authenticated with check (privado.es_personal());
create policy "personal edita modelos" on modelos for update to authenticated using (privado.es_personal()) with check (privado.es_personal());
create policy "admin borra modelos"    on modelos for delete to authenticated using (privado.es_admin());

create policy "personal crea medios"   on medios for insert to authenticated with check (privado.es_personal());
create policy "personal edita medios"  on medios for update to authenticated using (privado.es_personal()) with check (privado.es_personal());
create policy "personal borra medios"  on medios for delete to authenticated using (privado.es_personal());

-- 4) Índices para claves foráneas
create index if not exists ventas_cliente_id_idx  on ventas (cliente_id);
create index if not exists ventas_vendedor_id_idx on ventas (vendedor_id);
