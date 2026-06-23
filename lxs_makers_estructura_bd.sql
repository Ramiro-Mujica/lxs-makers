-- ============================================================
-- LXS Makers — Estructura de Base de Datos
-- Sistema de gestión comercial para emprendedores
-- Motor: PostgreSQL (Supabase)
-- ============================================================

-- ============================================================
-- Tabla: usuarios
-- Representa a Administradores y Vendedores (herencia por tipo,
-- discriminada por la columna "rol")
-- ============================================================
CREATE TABLE usuarios (
    id              UUID PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password        VARCHAR(255) NOT NULL,
    rol             VARCHAR(20) NOT NULL DEFAULT 'vendedor',
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    nombre_negocio  VARCHAR(255),
    descripcion     TEXT,
    codigo_catalogo VARCHAR(50) UNIQUE,
    whatsapp        VARCHAR(20),
    limite_tableros INTEGER NOT NULL DEFAULT 5,
    is_staff        BOOLEAN NOT NULL DEFAULT FALSE,
    is_superuser    BOOLEAN NOT NULL DEFAULT FALSE,
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Tabla: productos
-- Pertenece a un vendedor (agregación con usuarios)
-- ============================================================
CREATE TABLE productos (
    id            UUID PRIMARY KEY,
    vendedor_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre        VARCHAR(255) NOT NULL,
    descripcion   TEXT,
    precio_venta  NUMERIC(10,2) NOT NULL,
    precio_costo  NUMERIC(10,2) NOT NULL,
    estado        VARCHAR(20) NOT NULL DEFAULT 'visible',
    orden_visual  INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Tabla: imagenes_producto
-- Composición con productos: no existe sin su producto (hasta 5 por producto)
-- ============================================================
CREATE TABLE imagenes_producto (
    id          UUID PRIMARY KEY,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    url         VARCHAR(500) NOT NULL,
    orden       INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Tabla: variantes
-- Composición con productos: no existe sin su producto (talle, color, etc.)
-- ============================================================
CREATE TABLE variantes (
    id          UUID PRIMARY KEY,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    tipo        VARCHAR(100) NOT NULL,
    valor       VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Tabla: pedidos
-- Compra realizada por un cliente a través del catálogo público
-- ============================================================
CREATE TABLE pedidos (
    id                  UUID PRIMARY KEY,
    vendedor_id         UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo_seguimiento  VARCHAR(8) UNIQUE NOT NULL,
    nombre_cliente      VARCHAR(255),
    comentario          TEXT,
    estado              VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    total               NUMERIC(10,2) NOT NULL DEFAULT 0,
    completado_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Tabla: detalles_pedido
-- Composición con pedidos: no existe sin su pedido.
-- Guarda precio y nombre congelados al momento de la venta.
-- ============================================================
CREATE TABLE detalles_pedido (
    id              UUID PRIMARY KEY,
    pedido_id       UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id     UUID REFERENCES productos(id) ON DELETE SET NULL,
    nombre_producto VARCHAR(255) NOT NULL,
    precio_venta    NUMERIC(10,2) NOT NULL,
    precio_costo    NUMERIC(10,2) NOT NULL,
    cantidad        INTEGER NOT NULL DEFAULT 1,
    variante        VARCHAR(255)
);

-- ============================================================
-- Tabla: estadisticas_vendedor
-- Relación UNO A UNO con usuarios (un vendedor tiene un solo
-- período de estadísticas activo a la vez)
-- ============================================================
CREATE TABLE estadisticas_vendedor (
    id              UUID PRIMARY KEY,
    vendedor_id     UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    inicio_periodo  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Tabla: tableros
-- Agregación con usuarios: organización Kanban del vendedor
-- ============================================================
CREATE TABLE tableros (
    id          UUID PRIMARY KEY,
    vendedor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre      VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Tabla: tareas
-- Composición con tableros: no existe sin su tablero
-- ============================================================
CREATE TABLE tareas (
    id          UUID PRIMARY KEY,
    tablero_id  UUID NOT NULL REFERENCES tableros(id) ON DELETE CASCADE,
    contenido   TEXT NOT NULL,
    seccion     VARCHAR(20) NOT NULL DEFAULT 'por_hacer',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Índices recomendados para mejorar rendimiento de consultas
-- ============================================================
CREATE INDEX idx_productos_vendedor       ON productos(vendedor_id);
CREATE INDEX idx_pedidos_vendedor         ON pedidos(vendedor_id);
CREATE INDEX idx_detalles_pedido_pedido   ON detalles_pedido(pedido_id);
CREATE INDEX idx_tableros_vendedor        ON tableros(vendedor_id);
CREATE INDEX idx_tareas_tablero           ON tareas(tablero_id);
