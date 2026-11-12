-- =====================================================================
-- Roles: el ADMINISTRADOR accede a todo; el VENDEDOR solo registra y
-- consulta SUS ventas (y puede ver equipos disponibles y clientes para vender).
-- Los usuarios del personal se crean desde el panel (función gestionar-personal).
-- =====================================================================

-- ---------- perfiles: usuario, correo y estado ----------
alter table perfiles add column if not exists usuario text unique;
alter table perfiles add column if not exists email text;
alter table perfiles add column if not exists activo boolean not null default true;
alter table perfiles add column if not exists creado_por uuid references perfiles(id) on delete set null;

update perfiles p set email = u.email, usuario = coalesce(p.usuario, split_part(u.email, '@', 1))
from auth.users u where u.id = p.id;

-- el trigger toma usuario y rol SOLO de app_metadata (que únicamente escribe un administrador)
create or replace function public.nuevo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.raw_app_meta_data ? 'rol' then
    insert into perfiles (id, nombre, rol, usuario, email)
    values (new.id,
            coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
            (new.raw_app_meta_data->>'rol')::rol_usuario,
            coalesce(new.raw_app_meta_data->>'usuario', split_part(new.email, '@', 1)),
            new.email);
  end if;
  return new;
end $$;

-- un usuario desactivado pierde el acceso aunque tenga una sesión abierta
create or replace function privado.es_personal() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and activo)
$$;

create or replace function privado.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin' and activo)
$$;

-- ---------- políticas: escritura del catálogo solo para admin ----------
drop policy "personal crea marcas" on marcas;
drop policy "personal edita marcas" on marcas;
create policy "admin crea marcas"  on marcas for insert to authenticated with check (privado.es_admin());
create policy "admin edita marcas" on marcas for update to authenticated using (privado.es_admin()) with check (privado.es_admin());

drop policy "personal crea categorias" on categorias;
drop policy "personal edita categorias" on categorias;
create policy "admin crea categorias"  on categorias for insert to authenticated with check (privado.es_admin());
create policy "admin edita categorias" on categorias for update to authenticated using (privado.es_admin()) with check (privado.es_admin());

drop policy "personal crea modelos" on modelos;
drop policy "personal edita modelos" on modelos;
create policy "admin crea modelos"  on modelos for insert to authenticated with check (privado.es_admin());
create policy "admin edita modelos" on modelos for update to authenticated using (privado.es_admin()) with check (privado.es_admin());

drop policy "personal crea medios" on medios;
drop policy "personal edita medios" on medios;
drop policy "personal borra medios" on medios;
create policy "admin crea medios"  on medios for insert to authenticated with check (privado.es_admin());
create policy "admin edita medios" on medios for update to authenticated using (privado.es_admin()) with check (privado.es_admin());
create policy "admin borra medios" on medios for delete to authenticated using (privado.es_admin());

drop policy "personal escribe unidades" on unidades;
drop policy "personal edita unidades" on unidades;
create policy "admin crea unidades"  on unidades for insert to authenticated with check (privado.es_admin());
create policy "admin edita unidades" on unidades for update to authenticated using (privado.es_admin()) with check (privado.es_admin());

drop policy "personal lotes" on lotes;
create policy "admin lotes" on lotes for all to authenticated using (privado.es_admin()) with check (privado.es_admin());

drop policy "personal lee movimientos" on movimientos;
create policy "admin lee movimientos" on movimientos for select to authenticated using (privado.es_admin());

-- clientes: el vendedor los consulta y registra al vender; solo admin edita o borra
drop policy "personal clientes" on clientes;
create policy "personal lee clientes"  on clientes for select to authenticated using (privado.es_personal());
create policy "personal crea clientes" on clientes for insert to authenticated with check (privado.es_personal());
create policy "admin edita clientes"   on clientes for update to authenticated using (privado.es_admin()) with check (privado.es_admin());
create policy "admin borra clientes"   on clientes for delete to authenticated using (privado.es_admin());

-- ventas: el vendedor solo ve y registra las suyas; solo admin anula
drop policy "personal lee ventas" on ventas;
drop policy "personal crea ventas" on ventas;
drop policy "personal edita ventas" on ventas;
create policy "lee ventas" on ventas for select to authenticated
  using (privado.es_admin() or (privado.es_personal() and vendedor_id = auth.uid()));
create policy "crea ventas" on ventas for insert to authenticated
  with check (privado.es_admin() or (privado.es_personal() and vendedor_id = auth.uid()));
create policy "admin edita ventas" on ventas for update to authenticated
  using (privado.es_admin()) with check (privado.es_admin());

-- perfiles: cada quien ve el suyo; admin ve y edita todos
drop policy "personal lee perfiles" on perfiles;
create policy "lee perfiles" on perfiles for select to authenticated
  using (id = auth.uid() or privado.es_admin());

-- storage: solo admin sube o borra fotos y videos
drop policy "medios subida personal" on storage.objects;
drop policy "medios borrado personal" on storage.objects;
create policy "medios subida admin" on storage.objects for insert to authenticated
  with check (bucket_id = 'medios' and privado.es_admin());
create policy "medios borrado admin" on storage.objects for delete to authenticated
  using (bucket_id = 'medios' and privado.es_admin());

create index if not exists perfiles_creado_por_idx on perfiles (creado_por);
