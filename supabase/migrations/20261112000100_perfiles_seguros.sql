-- Seguridad: el rol del personal NO puede venir de los metadatos que envía el propio usuario
-- (raw_user_meta_data), porque cualquiera podría registrarse por la API como "admin".
-- Ahora solo se crea perfil si el rol viene en raw_app_meta_data, que únicamente puede
-- escribir un administrador desde Supabase (SQL o Auth Admin API).
create or replace function nuevo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.raw_app_meta_data ? 'rol' then
    insert into perfiles (id, nombre, rol)
    values (new.id,
            coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
            (new.raw_app_meta_data->>'rol')::rol_usuario);
  end if;
  return new;
end $$;

-- las funciones auxiliares no deben poder ejecutarse directamente desde la API pública
revoke execute on function nuevo_usuario() from public, anon, authenticated;
revoke execute on function registrar_movimiento() from public, anon, authenticated;
revoke execute on function procesar_venta() from public, anon, authenticated;
revoke execute on function despues_venta() from public, anon, authenticated;
