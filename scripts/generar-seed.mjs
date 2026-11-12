// Genera supabase/seed.sql con datos de demostración realistas (ficticios).
// Uso: node scripts/generar-seed.mjs
import { writeFileSync } from "node:fs";

// PRNG determinista para que el seed sea siempre igual
let s = 20261112;
const rnd = () => {
  s |= 0; s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (a, b) => Math.floor(rnd() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const weighted = (pairs) => {
  const total = pairs.reduce((a, [, w]) => a + w, 0);
  let r = rnd() * total;
  for (const [v, w] of pairs) { if ((r -= w) <= 0) return v; }
  return pairs[0][0];
};
const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const slugify = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const addDays = (d, n) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };
const iso = (d) => d.toISOString().slice(0, 10);
const HOY = new Date("2026-11-12T00:00:00Z");

const marcas = ["Dell", "HP", "Lenovo", "Asus", "Acer", "MSI", "Apple", "Microsoft", "Alienware", "Razer", "Samsung", "LG"];
const categorias = [
  ["Gaming", "Equipos con tarjeta de video dedicada para juegos y edición."],
  ["Ultrabooks", "Livianas, delgadas y con gran autonomía."],
  ["Ejecutivas / Oficina", "Resistentes y confiables para el trabajo diario."],
  ["Workstation", "Potencia profesional para diseño, ingeniería y render."],
  ["2 en 1 / Convertibles", "Pantalla táctil que se convierte en tablet."],
  ["Estudiantes / Hogar", "La mejor relación precio-rendimiento para estudiar."],
];

// [marca, categoria, modelo, año, procesador, ram, ramTipo, almacenamiento, gb, gpu, pulg, detalle, color, costoUSD]
const equipos = [
  ["Dell", "Gaming", "Dell G7 7588", 2018, "Intel Core i7-8750H", 16, "DDR4", "256 GB SSD + 1 TB HDD", 1256, "NVIDIA GeForce GTX 1060 6 GB", 15.6, "Full HD IPS", "Negro Licorice", 330],
  ["Dell", "Gaming", "Dell G5 15 SE 5505", 2020, "AMD Ryzen 5 4600H", 16, "DDR4", "512 GB SSD", 512, "AMD Radeon RX 5600M 6 GB", 15.6, "Full HD 120 Hz", "Gris Eclipse", 430],
  ["Dell", "Gaming", "Dell G15 5520", 2022, "Intel Core i7-12700H", 16, "DDR5", "1 TB SSD", 1024, "NVIDIA GeForce RTX 3060 6 GB", 15.6, "Full HD 165 Hz", "Gris Obsidiana", 690],
  ["HP", "Gaming", "HP Pavilion Gaming 15", 2020, "AMD Ryzen 5 4600H", 16, "DDR4", "512 GB SSD", 512, "NVIDIA GeForce GTX 1650 4 GB", 15.6, "Full HD IPS", "Negro Sombra", 360],
  ["HP", "Gaming", "HP Victus 16", 2022, "Intel Core i5-12500H", 16, "DDR4", "512 GB SSD", 512, "NVIDIA GeForce RTX 3050 Ti 4 GB", 16.1, "Full HD 144 Hz", "Plata Mica", 520],
  ["HP", "Gaming", "HP Omen 16", 2023, "AMD Ryzen 7 7840HS", 16, "DDR5", "1 TB SSD", 1024, "NVIDIA GeForce RTX 4060 8 GB", 16.1, "QHD 165 Hz", "Negro Sombra", 840],
  ["MSI", "Gaming", "MSI GS63 Stealth 8RE", 2018, "Intel Core i7-8750H", 16, "DDR4", "256 GB SSD + 1 TB HDD", 1256, "NVIDIA GeForce GTX 1060 6 GB", 15.6, "Full HD 120 Hz", "Negro", 410],
  ["MSI", "Gaming", "MSI Katana GF66", 2022, "Intel Core i7-11800H", 16, "DDR4", "512 GB SSD", 512, "NVIDIA GeForce RTX 3060 6 GB", 15.6, "Full HD 144 Hz", "Negro", 610],
  ["Asus", "Gaming", "Asus TUF Gaming F15", 2022, "Intel Core i5-11400H", 16, "DDR4", "512 GB SSD", 512, "NVIDIA GeForce RTX 3050 4 GB", 15.6, "Full HD 144 Hz", "Gris Eclipse", 480],
  ["Asus", "Gaming", "Asus ROG Strix G15", 2021, "AMD Ryzen 7 5800H", 16, "DDR4", "1 TB SSD", 1024, "NVIDIA GeForce RTX 3070 8 GB", 15.6, "Full HD 300 Hz", "Gris Eclipse", 780],
  ["Acer", "Gaming", "Acer Nitro 5 AN515", 2022, "AMD Ryzen 7 5800H", 16, "DDR4", "512 GB SSD", 512, "NVIDIA GeForce RTX 3060 6 GB", 15.6, "Full HD 144 Hz", "Negro", 560],
  ["Acer", "Gaming", "Acer Predator Helios 300", 2021, "Intel Core i7-11800H", 16, "DDR4", "512 GB SSD", 512, "NVIDIA GeForce RTX 3060 6 GB", 15.6, "Full HD 144 Hz", "Negro Abisal", 640],
  ["Alienware", "Gaming", "Alienware m15 R6", 2021, "Intel Core i7-11800H", 32, "DDR4", "1 TB SSD", 1024, "NVIDIA GeForce RTX 3080 8 GB", 15.6, "QHD 240 Hz", "Lado Oscuro de la Luna", 1050],
  ["Razer", "Gaming", "Razer Blade 15 Base", 2021, "Intel Core i7-10750H", 16, "DDR4", "512 GB SSD", 512, "NVIDIA GeForce RTX 3060 6 GB", 15.6, "Full HD 144 Hz", "Negro", 890],
  ["Microsoft", "Ultrabooks", "Microsoft Surface Laptop Go 2", 2022, "Intel Core i5-1135G7", 8, "LPDDR4x", "128 GB SSD", 128, "Intel Iris Xe", 12.4, "PixelSense táctil", "Platino", 290],
  ["Microsoft", "Ultrabooks", "Microsoft Surface Laptop 4", 2021, "AMD Ryzen 5 4680U", 8, "LPDDR4x", "256 GB SSD", 256, "AMD Radeon", 13.5, "PixelSense táctil", "Platino", 420],
  ["Apple", "Ultrabooks", "MacBook Air M1", 2020, "Apple M1 8 núcleos", 8, "Unificada", "256 GB SSD", 256, "GPU 7 núcleos", 13.3, "Retina", "Gris Espacial", 470],
  ["Apple", "Ultrabooks", "MacBook Air M2", 2022, "Apple M2 8 núcleos", 8, "Unificada", "256 GB SSD", 256, "GPU 8 núcleos", 13.6, "Liquid Retina", "Medianoche", 690],
  ["Apple", "Workstation", "MacBook Pro 14 M1 Pro", 2021, "Apple M1 Pro 8 núcleos", 16, "Unificada", "512 GB SSD", 512, "GPU 14 núcleos", 14.2, "Liquid Retina XDR", "Plata", 1020],
  ["Dell", "Ultrabooks", "Dell XPS 13 9310", 2021, "Intel Core i7-1185G7", 16, "LPDDR4x", "512 GB SSD", 512, "Intel Iris Xe", 13.4, "FHD+ táctil", "Plata", 560],
  ["Asus", "Ultrabooks", "Asus ZenBook 14 UX425", 2021, "Intel Core i5-1135G7", 8, "LPDDR4x", "512 GB SSD", 512, "Intel Iris Xe", 14, "Full HD IPS", "Gris Pino", 380],
  ["Samsung", "Ultrabooks", "Samsung Galaxy Book2 Pro", 2022, "Intel Core i7-1260P", 16, "LPDDR5", "512 GB SSD", 512, "Intel Iris Xe", 13.3, "AMOLED Full HD", "Grafito", 610],
  ["LG", "Ultrabooks", "LG Gram 16", 2022, "Intel Core i7-1260P", 16, "LPDDR5", "512 GB SSD", 512, "Intel Iris Xe", 16, "WQXGA IPS", "Negro Obsidiana", 640],
  ["HP", "Ejecutivas / Oficina", "HP ProBook 640 G3", 2017, "Intel Core i5-7300U", 8, "DDR4", "256 GB SSD", 256, "Intel HD 620", 14, "HD", "Plata", 150],
  ["HP", "Ejecutivas / Oficina", "HP EliteBook 840 G6", 2019, "Intel Core i5-8365U", 16, "DDR4", "256 GB SSD", 256, "Intel UHD 620", 14, "Full HD IPS", "Plata", 250],
  ["HP", "Ejecutivas / Oficina", "HP EliteBook 850 G8", 2021, "Intel Core i7-1165G7", 16, "DDR4", "512 GB SSD", 512, "Intel Iris Xe", 15.6, "Full HD IPS", "Plata", 410],
  ["Lenovo", "Ejecutivas / Oficina", "Lenovo ThinkPad T480", 2018, "Intel Core i5-8350U", 16, "DDR4", "256 GB SSD", 256, "Intel UHD 620", 14, "Full HD IPS", "Negro", 210],
  ["Lenovo", "Ejecutivas / Oficina", "Lenovo ThinkPad T14 Gen 2", 2021, "AMD Ryzen 5 PRO 5650U", 16, "DDR4", "512 GB SSD", 512, "AMD Radeon", 14, "Full HD IPS", "Negro", 380],
  ["Lenovo", "Ejecutivas / Oficina", "Lenovo ThinkBook 14 G7 ARP", 2024, "AMD Ryzen 5 7535HS", 16, "DDR5", "512 GB SSD", 512, "AMD Radeon 660M", 14, "WUXGA IPS", "Gris Ártico", 470],
  ["Dell", "Ejecutivas / Oficina", "Dell Latitude 5420", 2021, "Intel Core i5-1145G7", 16, "DDR4", "256 GB SSD", 256, "Intel Iris Xe", 14, "Full HD", "Negro", 300],
  ["Dell", "Ejecutivas / Oficina", "Dell Latitude 7490", 2018, "Intel Core i7-8650U", 16, "DDR4", "512 GB SSD", 512, "Intel UHD 620", 14, "Full HD IPS", "Negro", 230],
  ["Dell", "Workstation", "Dell Precision 7530", 2018, "Intel Core i7-8850H", 32, "DDR4", "512 GB SSD", 512, "NVIDIA Quadro P2000 4 GB", 15.6, "Full HD IPS", "Gris", 430],
  ["Lenovo", "Workstation", "Lenovo ThinkPad P52", 2018, "Intel Core i7-8850H", 32, "DDR4", "1 TB SSD", 1024, "NVIDIA Quadro P1000 4 GB", 15.6, "Full HD IPS", "Negro", 460],
  ["HP", "Workstation", "HP ZBook 15 G6", 2019, "Intel Core i7-9850H", 32, "DDR4", "512 GB SSD", 512, "NVIDIA Quadro T2000 4 GB", 15.6, "Full HD IPS", "Plata", 520],
  ["Asus", "Workstation", "Asus ZenBook Pro Duo 15", 2019, "Intel Core i7-9750H", 16, "DDR4", "1 TB SSD", 1024, "NVIDIA GeForce RTX 2060 6 GB", 15.6, "4K OLED táctil + ScreenPad Plus", "Azul Celestial", 820],
  ["Dell", "2 en 1 / Convertibles", "Dell Latitude 5285", 2017, "Intel Core i5-7300U", 8, "LPDDR3", "256 GB SSD", 256, "Intel HD 620", 12.3, "FHD+ táctil", "Negro", 170],
  ["HP", "2 en 1 / Convertibles", "HP Envy x360 15", 2021, "AMD Ryzen 7 5700U", 16, "DDR4", "512 GB SSD", 512, "AMD Radeon", 15.6, "Full HD táctil", "Negro Nocturno", 450],
  ["Lenovo", "2 en 1 / Convertibles", "Lenovo Yoga 7i 14", 2022, "Intel Core i5-1235U", 8, "LPDDR4x", "512 GB SSD", 512, "Intel Iris Xe", 14, "2.2K táctil", "Gris Tormenta", 430],
  ["Microsoft", "2 en 1 / Convertibles", "Microsoft Surface Pro 7", 2019, "Intel Core i5-1035G4", 8, "LPDDR4x", "128 GB SSD", 128, "Intel Iris Plus", 12.3, "PixelSense táctil", "Platino", 270],
  ["Lenovo", "Estudiantes / Hogar", "Lenovo IdeaPad 3 15", 2022, "AMD Ryzen 5 5500U", 8, "DDR4", "256 GB SSD", 256, "AMD Radeon", 15.6, "Full HD", "Gris Arena", 260],
  ["HP", "Estudiantes / Hogar", "HP 15-dy2xxx", 2021, "Intel Core i5-1135G7", 8, "DDR4", "256 GB SSD", 256, "Intel Iris Xe", 15.6, "HD", "Plata Natural", 250],
  ["Acer", "Estudiantes / Hogar", "Acer Aspire 5 A515", 2022, "Intel Core i5-1235U", 8, "DDR4", "512 GB SSD", 512, "Intel Iris Xe", 15.6, "Full HD IPS", "Plata Pura", 300],
  ["Asus", "Estudiantes / Hogar", "Asus VivoBook 15 X515", 2022, "Intel Core i3-1115G4", 8, "DDR4", "256 GB SSD", 256, "Intel UHD", 15.6, "Full HD", "Gris Pizarra", 210],
  ["Dell", "Estudiantes / Hogar", "Dell Inspiron 15 3511", 2021, "Intel Core i5-1135G7", 8, "DDR4", "256 GB SSD", 256, "Intel Iris Xe", 15.6, "Full HD", "Negro Carbón", 260],
];

// Algunos modelos llegan dos veces con distinta configuración (variantes)
const variantes = [
  { base: "Dell G15 5520", ram: 32, alm: "1 TB SSD", gb: 1024, extraUsd: 80 },
  { base: "MacBook Air M1", ram: 16, alm: "512 GB SSD", gb: 512, extraUsd: 140, color: "Oro" },
  { base: "Lenovo ThinkPad T480", ram: 8, alm: "256 GB SSD", gb: 256, extraUsd: -30, grado: "B" },
  { base: "HP EliteBook 840 G6", ram: 8, alm: "256 GB SSD", gb: 256, extraUsd: -20, grado: "B" },
  { base: "Asus TUF Gaming F15", ram: 8, alm: "512 GB SSD", gb: 512, extraUsd: -40 },
  { base: "Lenovo IdeaPad 3 15", ram: 16, alm: "512 GB SSD", gb: 512, extraUsd: 30 },
];

const proveedores = ["eBay (vendedor certificado)", "Amazon Renewed", "Best Buy Open Box", "Subasta corporativa Dell Outlet", "Back Market US", "Liquidación corporativa (Texas)"];
const couriers = ["Aerocargo Miami", "Urbano Express Courier", "SkyBox Perú", "Olva Courier Internacional"];

// ---------- lotes: uno por mes, el último aún en tránsito ----------
const lotes = [];
for (let m = 0; m < 13; m++) {
  const compra = new Date(Date.UTC(2025, 10 + m, int(2, 9)));
  const llegada = addDays(compra, int(12, 20));
  const enTransito = llegada > HOY;
  lotes.push({
    codigo: `IMP-${compra.getUTCFullYear()}-${String(compra.getUTCMonth() + 1).padStart(2, "0")}`,
    proveedor: pick(proveedores), courier: pick(couriers),
    compra, llegada: enTransito ? null : llegada, llegadaEstimada: llegada,
    tc: +(3.62 + rnd() * 0.18).toFixed(3),
    estado: enTransito ? (m === 12 ? "en_transito" : "en_aduana") : "recibido",
    unidades: [],
  });
}

// ---------- unidades ----------
const condiciones = [["seminuevo", 60], ["open_box", 20], ["nuevo", 8], ["remate", 12]];
const usados = new Set();
const unidades = [];
const fichas = [...equipos.map((e) => ({ e })), ...variantes.map((v) => ({ e: equipos.find((x) => x[2] === v.base), v }))];
// mezclar
for (let i = fichas.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [fichas[i], fichas[j]] = [fichas[j], fichas[i]]; }

fichas.forEach(({ e, v }, idx) => {
  const lote = lotes[idx % lotes.length];
  const [marca, , modelo, , cpu, ram, ramTipo, alm, gb, gpu, pulg, detalle, color, costo] = e;
  const condicion = v?.grado === "B" ? "remate" : weighted(condiciones);
  const grado = v?.grado ?? (condicion === "remate" ? pick(["B", "C"]) : condicion === "seminuevo" ? weighted([["A", 80], ["B", 20]]) : "A");
  const costoUsd = Math.max(120, costo + (v?.extraUsd ?? 0) + int(-25, 25));
  const extraPen = int(90, 260); // flete+aduana prorrateado + mantenimiento
  const costoPen = costoUsd * lote.tc + extraPen;
  const margen = condicion === "remate" ? 0.18 + rnd() * 0.1 : 0.28 + rnd() * 0.17;
  const precio = Math.ceil((costoPen * (1 + margen)) / 50) * 50 - 10;
  let base = slugify(modelo);
  let n = 1; while (usados.has(base + (n > 1 ? `-${n}` : ""))) n++;
  const slug = base + (n > 1 ? `-${n}` : "");
  usados.add(slug);
  const u = {
    modelo, marca, slug, lote, sku: `LA-${String(1001 + idx)}`,
    serie: `${marca.slice(0, 2).toUpperCase()}${int(10, 99)}${Math.floor(rnd() * 36 ** 6).toString(36).toUpperCase().padStart(6, "0")}`,
    cpu, ram: v?.ram ?? ram, ramTipo, alm: v?.alm ?? alm, gb: v?.gb ?? gb, gpu, pulg, detalle,
    color: v?.color ?? color, condicion, grado,
    garantia: condicion === "remate" ? 6 : 12,
    costoUsd, extraPen, precio,
    oferta: null, estado: lote.llegada ? "disponible" : "en_transito",
    destacado: false, ingresado: lote.llegada ?? lote.llegadaEstimada,
  };
  lote.unidades.push(u);
  unidades.push(u);
});

// ---------- clientes ----------
const nombres = ["Luis", "María", "José", "Rosa", "Carlos", "Ana", "Jorge", "Lucía", "Miguel", "Carmen", "Diego", "Sofía", "Renzo", "Valeria", "Kevin", "Milagros", "Jhon", "Fiorella", "Edwin", "Katherine", "Junior", "Yesenia", "Alex", "Diana", "Brayan", "Nataly"];
const apellidos = ["Quispe", "Huamán", "Flores", "Rojas", "Mendoza", "Torres", "Ramírez", "Espinoza", "Cárdenas", "Vásquez", "Chávez", "Soto", "Trujillo", "Ponce", "Albornoz", "Ventura", "Rivera", "Salazar", "Paucar", "Tucto", "Malpartida", "Berrospi"];
const ciudades = [["Huánuco", 55], ["Tingo María", 14], ["Amarilis", 10], ["Lima", 8], ["Cerro de Pasco", 5], ["Pucallpa", 4], ["Huancayo", 4]];
const clientes = [];
for (let i = 0; i < 46; i++) {
  const nombre = `${pick(nombres)} ${pick(apellidos)} ${pick(apellidos)}`;
  const empresa = i % 11 === 5;
  clientes.push({
    nombre: empresa ? `${pick(["Inversiones", "Corporación", "Consultora", "Estudio Contable"])} ${pick(apellidos)} S.A.C.` : nombre,
    tipo: empresa ? "RUC" : "DNI",
    doc: empresa ? `20${int(400000000, 609999999)}` : String(int(40000000, 79999999)),
    tel: `9${int(10000000, 99999999)}`,
    email: empresa ? null : rnd() < 0.6 ? `${slugify(nombre).replace(/-/g, ".")}${int(1, 99)}@gmail.com` : null,
    ciudad: weighted(ciudades),
  });
}

// ---------- ventas ----------
const pagos = [["yape", 34], ["transferencia", 26], ["efectivo", 22], ["plin", 10], ["tarjeta", 8]];
const canales = [["tienda", 30], ["whatsapp", 32], ["tiktok", 18], ["facebook", 10], ["instagram", 6], ["web", 4]];
const ventas = [];
let nVenta = 1;
for (const u of unidades) {
  if (u.estado !== "disponible") continue;
  const diasEnStock = (HOY - u.ingresado) / 86400000;
  // probabilidad de venta crece con el tiempo en tienda
  const prob = Math.min(0.7, 0.04 + diasEnStock / 260);
  if (rnd() < prob) {
    const dias = int(2, Math.max(3, Math.min(85, Math.floor(diasEnStock) - 1)));
    const fecha = addDays(u.ingresado, dias);
    if (fecha >= HOY) continue;
    fecha.setUTCHours(int(14, 25) % 24 + 0, int(0, 59)); // 9am–8pm hora Perú aprox. (UTC-5)
    const descuento = rnd() < 0.35 ? pick([50, 50, 100, 100, 150, 200]) : 0;
    ventas.push({
      codigo: `V-${String(nVenta++).padStart(5, "0")}`, sku: u.sku, cliente: pick(clientes).doc,
      fecha, precio: u.precio, descuento,
      pago: weighted(pagos), canal: weighted(canales),
    });
    u.estado = "vendido";
  }
}
ventas.sort((a, b) => a.fecha - b.fecha);
ventas.forEach((v, i) => (v.codigo = `V-${String(i + 1).padStart(5, "0")}`));
// una venta anulada (devolución) para mostrar el flujo
const anulada = ventas[Math.floor(ventas.length / 3)];

// algunas disponibles: reservadas, en oferta y destacadas
const disponibles = unidades.filter((u) => u.estado === "disponible");
disponibles.slice(0, 2).forEach((u) => (u.estado = "reservado"));
disponibles.filter((u) => (HOY - u.ingresado) / 86400000 > 100).sort((a, b) => a.ingresado - b.ingresado).slice(0, 5).forEach((u) => {
  u.oferta = Math.ceil((u.precio * 0.92) / 10) * 10 - 10;
});
disponibles.sort((a, b) => b.precio - a.precio).slice(0, 8).forEach((u) => (u.destacado = true));

// ---------- SQL ----------
const L = [];
L.push("-- Datos de demostración generados por scripts/generar-seed.mjs (ficticios)");
L.push("-- Usuarios de prueba SOLO para desarrollo local.");
L.push(`
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'admin@personal.laptopsamericanas.invalid', crypt('Admin2026!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"rol":"admin","usuario":"admin"}', '{"nombre":"Administrador"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'ventas@personal.laptopsamericanas.invalid', crypt('Ventas2026!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"rol":"vendedor","usuario":"ventas"}', '{"nombre":"Vendedor de tienda"}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users where id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');
`);

L.push("insert into marcas (nombre, slug) values");
L.push(marcas.map((m) => `  (${q(m)}, ${q(slugify(m))})`).join(",\n") + ";\n");
L.push("insert into categorias (nombre, slug, descripcion) values");
L.push(categorias.map(([n, d]) => `  (${q(n)}, ${q(slugify(n))}, ${q(d)})`).join(",\n") + ";\n");

L.push("insert into modelos (marca_id, categoria_id, nombre, slug, anio, descripcion) values");
L.push(equipos.map((e) => `  ((select id from marcas where nombre = ${q(e[0])}), (select id from categorias where nombre = ${q(e[1])}), ${q(e[2])}, ${q(slugify(e[2]))}, ${e[3]}, ${q(`${e[2]} importada de Estados Unidos, revisada y certificada en nuestro taller.`)})`).join(",\n") + ";\n");

L.push("insert into lotes (codigo, proveedor, origen, courier, fecha_compra, fecha_llegada, flete_usd, aduana_pen, tipo_cambio, estado) values");
L.push(lotes.map((l) => {
  const flete = l.unidades.length * int(38, 55);
  const aduana = Math.round(l.unidades.reduce((a, u) => a + u.costoUsd, 0) * l.tc * 0.04);
  return `  (${q(l.codigo)}, ${q(l.proveedor)}, 'Miami, FL', ${q(l.courier)}, ${q(iso(l.compra))}, ${l.llegada ? q(iso(l.llegada)) : "null"}, ${flete}, ${aduana}, ${l.tc}, ${q(l.estado)})`;
}).join(",\n") + ";\n");

L.push(`insert into unidades (modelo_id, lote_id, sku, serie, slug, procesador, ram_gb, ram_tipo, almacenamiento_gb, almacenamiento,
  gpu, pantalla_pulg, pantalla_detalle, color, condicion, grado, garantia_meses, costo_usd, costo_extra_pen,
  precio_pen, precio_oferta_pen, estado, publicado, destacado, ingresado_en, descripcion) values`);
L.push(unidades.map((u) => {
  const estadoInicial = u.estado === "vendido" ? "disponible" : u.estado;
  const desc = `Equipo ${u.condicion === "nuevo" ? "nuevo en caja" : u.condicion === "open_box" ? "open box (caja abierta, sin uso)" : u.condicion === "remate" ? "en remate con detalles estéticos" : "seminuevo certificado"}. ${u.cpu}, ${u.ram} GB ${u.ramTipo}, ${u.alm}${u.gpu ? `, ${u.gpu}` : ""}. Pantalla ${u.pulg}" ${u.detalle}. Incluye cargador original, limpieza interna, pasta térmica nueva y programas instalados.`;
  return `  ((select id from modelos where nombre = ${q(u.modelo)}), (select id from lotes where codigo = ${q(u.lote.codigo)}), ${q(u.sku)}, ${q(u.serie)}, ${q(u.slug)}, ${q(u.cpu)}, ${u.ram}, ${q(u.ramTipo)}, ${u.gb}, ${q(u.alm)}, ${q(u.gpu)}, ${u.pulg}, ${q(u.detalle)}, ${q(u.color)}, ${q(u.condicion)}, ${q(u.grado)}, ${u.garantia}, ${u.costoUsd}, ${u.extraPen}, ${u.precio}, ${u.oferta ?? "null"}, ${q(estadoInicial)}, true, ${u.destacado}, ${q(iso(u.ingresado))}, ${q(desc)})`;
}).join(",\n") + ";\n");

L.push("insert into clientes (nombre, tipo_doc, num_doc, telefono, email, ciudad, creado_en) values");
L.push(clientes.map((c) => `  (${q(c.nombre)}, ${q(c.tipo)}, ${q(c.doc)}, ${q(c.tel)}, ${q(c.email)}, ${q(c.ciudad)}, '2025-10-15')`).join(",\n") + ";\n");

L.push("insert into ventas (codigo, unidad_id, cliente_id, vendedor_id, fecha, precio_lista_pen, descuento_pen, metodo_pago, canal) values");
L.push(ventas.map((v, i) => `  (${q(v.codigo)}, (select id from unidades where sku = ${q(v.sku)}), (select id from clientes where num_doc = ${q(v.cliente)} limit 1), ${q(i % 3 === 0 ? "11111111-1111-4111-8111-111111111111" : "22222222-2222-4222-8222-222222222222")}, ${q(v.fecha.toISOString())}, ${v.precio}, ${v.descuento}, ${q(v.pago)}, ${q(v.canal)})`).join(",\n") + ";\n");

L.push(`-- devolución de ejemplo
update ventas set estado = 'anulada', notas = 'Cliente devolvió el equipo dentro de los 7 días (cambio de modelo).' where codigo = ${q(anulada.codigo)};
`);

L.push(`-- fechas realistas en el historial
update clientes c set creado_en = coalesce((select min(v.fecha) from ventas v where v.cliente_id = c.id), c.creado_en);
update movimientos m set creado_en = u.ingresado_en::timestamptz + interval '15 hours'
  from unidades u where m.unidad_id = u.id and m.evento = 'alta';
update movimientos m set creado_en = v.fecha
  from ventas v where m.unidad_id = v.unidad_id and m.evento = 'cambio_estado' and m.estado_nuevo = 'vendido';
update movimientos m set creado_en = v.fecha + interval '5 days'
  from ventas v where v.estado = 'anulada' and m.unidad_id = v.unidad_id
   and (m.evento = 'venta_anulada' or (m.evento = 'cambio_estado' and m.estado_nuevo = 'disponible'));
`);

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), L.join("\n"));
console.log(`OK: ${lotes.length} lotes, ${unidades.length} unidades, ${ventas.length} ventas, ${clientes.length} clientes`);

// ---------------------------------------------------------------------
// Modo --api: carga los mismos datos en el proyecto de Supabase configurado
// en .env.local, iniciando sesión como el administrador de prueba
// (credenciales en credenciales-demo.local.txt). Pasa por RLS y triggers.
// Uso: node scripts/generar-seed.mjs --api
// ---------------------------------------------------------------------
if (process.argv.includes("--api")) {
  const { readFileSync } = await import("node:fs");
  const { createClient } = await import("@supabase/supabase-js");
  const env = Object.fromEntries(
    readFileSync(new URL("../.env.local", import.meta.url), "utf8")
      .split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
  );
  const cred = readFileSync(new URL("../credenciales-demo.local.txt", import.meta.url), "utf8");
  const usuarioAdmin = cred.match(/Administrador:\s*(\S+)/)[1];
  // los usuarios del personal se guardan como correo en un dominio interno reservado
  const email = usuarioAdmin.includes("@") ? usuarioAdmin : `${usuarioAdmin}@personal.laptopsamericanas.invalid`;
  const password = cred.match(/Administrador:[\s\S]*?Contraseña:\s*(\S+)/)[1];
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { error: eLogin } = await sb.auth.signInWithPassword({ email, password });
  if (eLogin) throw eLogin;
  const ins = async (tabla, filas, cols = "*") => {
    const { data, error } = await sb.from(tabla).insert(filas).select(cols);
    if (error) throw new Error(`${tabla}: ${error.message}`);
    return data;
  };
  const idMarca = new Map((await ins("marcas", marcas.map((m) => ({ nombre: m, slug: slugify(m) })), "id, nombre")).map((x) => [x.nombre, x.id]));
  const idCat = new Map((await ins("categorias", categorias.map(([n, d]) => ({ nombre: n, slug: slugify(n), descripcion: d })), "id, nombre")).map((x) => [x.nombre, x.id]));
  const idModelo = new Map((await ins("modelos", equipos.map((e) => ({
    marca_id: idMarca.get(e[0]), categoria_id: idCat.get(e[1]), nombre: e[2], slug: slugify(e[2]), anio: e[3],
    descripcion: `${e[2]} importada de Estados Unidos, revisada y certificada en nuestro taller.`,
  })), "id, nombre")).map((x) => [x.nombre, x.id]));
  const idLote = new Map((await ins("lotes", lotes.map((l) => ({
    codigo: l.codigo, proveedor: l.proveedor, origen: "Miami, FL", courier: l.courier,
    fecha_compra: iso(l.compra), fecha_llegada: l.llegada ? iso(l.llegada) : null,
    flete_usd: l.unidades.length * 45, aduana_pen: Math.round(l.unidades.reduce((a, u) => a + u.costoUsd, 0) * l.tc * 0.04),
    tipo_cambio: l.tc, estado: l.estado,
  })), "id, codigo")).map((x) => [x.codigo, x.id]));
  const idUnidad = new Map((await ins("unidades", unidades.map((u) => ({
    modelo_id: idModelo.get(u.modelo), lote_id: idLote.get(u.lote.codigo), sku: u.sku, serie: u.serie, slug: u.slug,
    procesador: u.cpu, ram_gb: u.ram, ram_tipo: u.ramTipo, almacenamiento_gb: u.gb, almacenamiento: u.alm, gpu: u.gpu,
    pantalla_pulg: u.pulg, pantalla_detalle: u.detalle, color: u.color, condicion: u.condicion, grado: u.grado,
    garantia_meses: u.garantia, costo_usd: u.costoUsd, costo_extra_pen: u.extraPen, precio_pen: u.precio,
    precio_oferta_pen: u.oferta, estado: u.estado === "vendido" ? "disponible" : u.estado, publicado: true,
    destacado: u.destacado, ingresado_en: iso(u.ingresado),
    descripcion: `Equipo ${u.condicion === "nuevo" ? "nuevo en caja" : u.condicion === "open_box" ? "open box (caja abierta, sin uso)" : u.condicion === "remate" ? "en remate con detalles estéticos" : "seminuevo certificado"}. ${u.cpu}, ${u.ram} GB ${u.ramTipo}, ${u.alm}${u.gpu ? `, ${u.gpu}` : ""}. Pantalla ${u.pulg}" ${u.detalle}. Incluye cargador original, limpieza interna, pasta térmica nueva y programas instalados.`,
  })), "id, sku")).map((x) => [x.sku, x.id]));
  const idCliente = new Map((await ins("clientes", clientes.map((c) => ({
    nombre: c.nombre, tipo_doc: c.tipo, num_doc: c.doc, telefono: c.tel, email: c.email, ciudad: c.ciudad,
  })), "id, num_doc")).map((x) => [x.num_doc, x.id]));
  await ins("ventas", ventas.map((v, i) => ({
    codigo: v.codigo, unidad_id: idUnidad.get(v.sku), cliente_id: idCliente.get(v.cliente),
    vendedor_id: i % 3 === 0 ? "11111111-1111-4111-8111-111111111111" : "22222222-2222-4222-8222-222222222222",
    fecha: v.fecha.toISOString(), precio_lista_pen: v.precio, descuento_pen: v.descuento, metodo_pago: v.pago, canal: v.canal,
  })), "id");
  const { error: eAnul } = await sb.from("ventas")
    .update({ estado: "anulada", notas: "Cliente devolvió el equipo dentro de los 7 días (cambio de modelo)." })
    .eq("codigo", anulada.codigo);
  if (eAnul) throw eAnul;
  console.log("Carga por API completada. Ejecuta ahora el bloque 'fechas realistas' de supabase/seed.sql en el SQL Editor.");
}
