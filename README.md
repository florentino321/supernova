# Laptops Americanas · Sistema web con gestión de inventario

Sitio web público + panel de administración para una empresa que importa laptops de Estados Unidos.
El inventario se maneja **por unidad**: cada laptop es un registro único con su serie, configuración,
costo de importación y precio, porque la empresa recibe un solo equipo por modelo.

## Tecnología

| Capa | Herramienta |
|---|---|
| Frontend y backend | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Estilos | Tailwind CSS 4 |
| Base de datos | Supabase (PostgreSQL) con Row Level Security |
| Autenticación | Supabase Auth (correo y contraseña) |
| Archivos (fotos y videos) | Supabase Storage, bucket público `medios` |
| Gráficos | Recharts |

## Módulos

**Sitio público**
- `/`: portada con destacados, categorías, ofertas y equipos en camino.
- `/catalogo`: filtros por categoría, marca, condición, RAM, precio y búsqueda de texto.
- `/equipo/[slug]`: ficha con galería de fotos y videos, especificaciones, grado estético, compra por WhatsApp, botón para **separar con adelanto** y formulario **"Avísame cuando llegue"** (o "si se libera" / "si llega uno similar").
- Los videos de YouTube cargan su reproductor solo al tocar "play"; los de TikTok se abren en TikTok. Así la ficha carga rápido.

**Optimización y SEO**
- Vista previa al compartir por WhatsApp o Facebook: imagen generada con la foto, el modelo, el precio y el estado del equipo.
- `sitemap.xml`, `robots.txt`, descripción por equipo y datos estructurados de producto (schema.org) para Google.
- Fotos optimizadas con `next/image` (AVIF o WebP según el navegador y tamaño según la pantalla).
- Las fotos se comprimen en el navegador antes de subirlas (máx. 1600 px, JPEG): de 5 MB pasan a unos 200 KB. Desde el celular se puede tomar la foto directamente con la cámara.
- Catálogo en caché: la tienda no consulta la base en cada visita; el panel la actualiza al instante al guardar.
- Páginas propias de error, "no encontrado" y carga.

**Panel** (`/admin`, requiere sesión)
- **Dashboard:** ingresos, utilidad, margen, ticket promedio y días para vender, con comparación contra el periodo anterior. Pendientes del día (reservas, interesados y cotizaciones). Gráfico por mes o semana, desglose de ventas en una sola tarjeta (categoría, marca, canal, pago o ciudad), estado y antigüedad del inventario. Filtros de periodo, marca y categoría.
- **Inventario:** CRUD de equipos con fotos y videos (arrastrar y soltar, ordenar, elegir portada) e historial automático de movimientos. Exporta a CSV.
- **Ventas:** registro de ventas (el equipo pasa a "Vendido" solo), nota de venta imprimible o en PDF con garantía y anulación con devolución al stock.
- **Reservas:** el cliente separa un equipo con adelanto por unos días (por defecto 7, mínimo S/ 100 o 10 % del precio, configurable en `src/lib/empresa.ts`). El equipo figura como "Reservado" en la web; si vence, se libera solo (tarea diaria con `pg_cron`). Al venderlo, la nota de venta descuenta el adelanto.
- **Cotizaciones:** proformas con uno o varios equipos, imprimibles o en PDF y enviables por WhatsApp. Se convierten en venta con un clic (en una sola transacción).
- **Interesados:** lista de quienes pidieron aviso desde la web, con mensaje de WhatsApp listo para cuando llega o se libera el equipo.
- **Importaciones:** lotes con flete en USD, aduana, tipo de cambio y prorrateo automático de gastos por equipo.
- **Modelos y marcas:** fichas generales, marcas y categorías.
- **Clientes:** historial de compras y clientes recurrentes.
- **Usuarios y vendedores:** el administrador crea cuentas con usuario y contraseña, las edita, cambia contraseñas, activa o desactiva y cambia roles. Muestra las ventas de cada vendedor.

### Roles

| | Administrador | Vendedor |
|---|---|---|
| Dashboard, inventario, fotos, importaciones, modelos, clientes | ✅ | ❌ |
| Registrar ventas (con cliente nuevo o existente) | ✅ | ✅ |
| Reservas y cotizaciones | Todas | Solo las suyas |
| Interesados de la web | ✅ | ✅ |
| Ver ventas | Todas | Solo las suyas |
| Ver costos, utilidad y márgenes | ✅ | ❌ |
| Anular ventas | ✅ | ❌ |
| Crear y gestionar usuarios | ✅ | ❌ |

Los permisos se aplican **en la base de datos (RLS)**, no solo en la pantalla: aunque un vendedor intentara usar la API directamente, no podría ver otras ventas, cambiar precios, anular ni darse permisos de administrador. Un usuario desactivado pierde el acceso al instante, aunque tenga la sesión abierta.

Los vendedores ingresan con un **usuario** (por ejemplo, `jperez`) y no necesitan correo. Internamente, Supabase Auth lo guarda como `jperez@personal.laptopsamericanas.invalid`. `.invalid` es un dominio reservado que nunca recibe correos, así que nadie puede pedir la recuperación de esas cuentas por correo.

## Instalación

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. En tu proyecto de Supabase, ejecuta en el **SQL Editor**, en orden, los archivos de `supabase/migrations/`:
   - `20261112000000_esquema_inicial.sql`: tablas, triggers, seguridad y bucket.
   - `20261112000100_perfiles_seguros.sql`: solo un administrador asigna roles del personal.
   - `20261112000200_endurecimiento.sql`: correcciones del linter de Supabase.
   - `20261112000300_roles_y_usuarios.sql`: permisos por rol (admin y vendedor).
   - `20261112000400_codigo_venta_secuencia.sql`: numeración de ventas V-00001…
   - `20261113000000_reservas_avisos_cotizaciones.sql`: reservas con adelanto, avisos y cotizaciones (activa `pg_cron`).
3. Despliega la Edge Function que crea usuarios. Usa la clave de servicio, que nunca llega al navegador:
   ```bash
   npx supabase functions deploy gestionar-personal --project-ref TU-PROYECTO
   ```
4. Copia `.env.example` a `.env.local` y completa la URL y la clave del proyecto.
5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   La tienda queda en http://localhost:3000 y el panel en http://localhost:3000/admin.

**Primer administrador:** créalo en Supabase > Authentication > Users > *Add user*, con el correo `admin@personal.laptopsamericanas.invalid` para poder entrar con el usuario `admin`. Luego dale el rol:
```sql
insert into perfiles (id, nombre, rol, usuario, email)
select id, 'Nombre del administrador', 'admin', 'admin', email from auth.users where email = 'admin@personal.laptopsamericanas.invalid';
```
Los demás usuarios se crean desde el panel, en **Usuarios y vendedores**. Por seguridad, quien se registre por su cuenta **no** obtiene acceso. Se recomienda además desactivar *Allow new users to sign up* en Supabase > Authentication > Sign In / Providers.

### Datos de demostración
El proyecto en la nube arranca **sin datos de prueba**: solo con marcas y categorías. Para desarrollar con un Supabase local,
`node scripts/generar-seed.mjs` genera `supabase/seed.sql` con datos ficticios (13 importaciones, 50 equipos, 30 ventas).

## Publicación (Vercel)
1. En [vercel.com](https://vercel.com), entra con tu cuenta de GitHub e importa el repositorio.
2. En *Environment Variables* agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (los mismos valores de `.env.local`).
3. *Deploy*. Cada `git push` a `main` vuelve a publicar el sitio solo.

La dirección pública (para el sitemap y las vistas previas) se toma sola del dominio de Vercel. Si usas un dominio propio,
agrega `NEXT_PUBLIC_SITIO_URL=https://tu-dominio.pe`.

> En el plan gratuito, Supabase pausa el proyecto tras 7 días sin actividad. Antes de una presentación, entra al sitio
> o al panel de Supabase para reactivarlo.

## Modelo de datos

```
marcas ─┐
        ├─< modelos ─< unidades >─ lotes
categorias ┘              │  │
                          │  └─< medios      (fotos y videos)
                          │  └─< movimientos (historial automático)
                          ├─< ventas >─ clientes ─< reservas, cotizaciones
                          ├─< reservas (adelanto)        └─< cotizacion_items >─ unidades
                          └─< avisos ("Avísame")
                                 perfiles (vendedor) ── auth.users
```

Reglas de negocio implementadas en la base de datos (triggers):
- Una unidad solo puede tener **una venta completada** (índice único parcial).
- Al vender, el equipo pasa a `vendido`, se **congela su costo** (para calcular la utilidad histórica) y se calcula la fecha de fin de garantía.
- Al anular una venta, el equipo vuelve a `disponible`.
- Cada alta, cambio de estado o cambio de precio queda en `movimientos`.
- El público (rol `anon`) **no puede leer las columnas de costo**; solo los equipos publicados.

## Datos de la empresa

El WhatsApp, la dirección, el horario y las redes se editan en `src/lib/empresa.ts`.
