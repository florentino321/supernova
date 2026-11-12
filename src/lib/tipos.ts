export type Rol = "admin" | "vendedor";
export type Condicion = "nuevo" | "open_box" | "seminuevo" | "remate";
export type Grado = "A" | "B" | "C";
export type EstadoUnidad = "en_transito" | "disponible" | "reservado" | "vendido" | "garantia" | "baja";
export type EstadoLote = "comprado" | "en_transito" | "en_aduana" | "recibido";
export type MetodoPago = "efectivo" | "yape" | "plin" | "transferencia" | "tarjeta";
export type Canal = "tienda" | "whatsapp" | "tiktok" | "facebook" | "instagram" | "web";
export type EstadoVenta = "completada" | "anulada";
export type TipoMedia = "imagen" | "video" | "video_url";

export interface Perfil {
  id: string;
  nombre: string;
  rol: Rol;
  usuario: string | null;
  email: string | null;
  activo: boolean;
  creado_por: string | null;
  creado_en: string;
}

export interface Marca {
  id: number;
  nombre: string;
  slug: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
}

export interface Modelo {
  id: number;
  marca_id: number;
  categoria_id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  anio: number | null;
  marcas?: Marca;
  categorias?: Categoria;
}

export interface Lote {
  id: number;
  codigo: string;
  proveedor: string;
  origen: string;
  courier: string | null;
  fecha_compra: string;
  fecha_llegada: string | null;
  flete_usd: number;
  aduana_pen: number;
  tipo_cambio: number;
  estado: EstadoLote;
  notas: string | null;
}

export interface Medio {
  id: number;
  unidad_id: number;
  tipo: TipoMedia;
  url: string;
  ruta: string | null;
  posicion: number;
  es_portada: boolean;
}

/** Columnas visibles para el público (sin costos). */
export interface UnidadPublica {
  id: number;
  modelo_id: number;
  sku: string;
  slug: string;
  procesador: string;
  ram_gb: number;
  ram_tipo: string | null;
  almacenamiento_gb: number;
  almacenamiento: string;
  gpu: string | null;
  pantalla_pulg: number;
  pantalla_detalle: string | null;
  color: string | null;
  sistema: string | null;
  condicion: Condicion;
  grado: Grado;
  garantia_meses: number;
  precio_pen: number;
  precio_oferta_pen: number | null;
  estado: EstadoUnidad;
  publicado: boolean;
  destacado: boolean;
  descripcion: string | null;
  ingresado_en: string;
  modelos?: Modelo;
  medios?: Medio[];
}

export interface Unidad extends UnidadPublica {
  lote_id: number | null;
  serie: string | null;
  costo_usd: number;
  costo_extra_pen: number;
  notas_internas: string | null;
  creado_en: string;
  actualizado_en: string;
  lotes?: Lote | null;
}

export interface Cliente {
  id: number;
  nombre: string;
  tipo_doc: string;
  num_doc: string | null;
  telefono: string | null;
  email: string | null;
  ciudad: string | null;
  creado_en: string;
}

export interface Venta {
  id: number;
  codigo: string;
  unidad_id: number;
  cliente_id: number | null;
  vendedor_id: string | null;
  fecha: string;
  precio_lista_pen: number;
  descuento_pen: number;
  total_pen: number;
  costo_total_pen: number;
  metodo_pago: MetodoPago;
  canal: Canal;
  garantia_hasta: string | null;
  estado: EstadoVenta;
  notas: string | null;
  unidades?: Unidad;
  clientes?: Cliente | null;
  perfiles?: Perfil | null;
}

export interface Movimiento {
  id: number;
  unidad_id: number;
  evento: string;
  estado_antes: EstadoUnidad | null;
  estado_nuevo: EstadoUnidad | null;
  detalle: string | null;
  creado_en: string;
}
