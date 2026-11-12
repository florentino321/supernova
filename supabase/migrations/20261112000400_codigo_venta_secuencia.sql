-- El código de venta (V-00001…) lo genera la base con una secuencia:
-- no depende de qué ventas puede ver cada usuario y evita códigos repetidos
-- cuando dos vendedores registran ventas al mismo tiempo.
create sequence if not exists ventas_codigo_seq;
select setval('ventas_codigo_seq',
  greatest(1, coalesce((select max(substring(codigo from 3)::int) from ventas where codigo ~ '^V-\d+$'), 0)),
  (select count(*) > 0 from ventas where codigo ~ '^V-\d+$'));
alter table ventas alter column codigo set default 'V-' || lpad(nextval('ventas_codigo_seq')::text, 5, '0');
grant usage on sequence ventas_codigo_seq to authenticated;
