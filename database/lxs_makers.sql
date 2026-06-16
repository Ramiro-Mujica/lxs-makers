-- ============================================================
-- BASE DE DATOS: LXS MAKERS
-- Sistema de Gestión Comercial para Emprendedores
-- Compatible con MySQL / phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS lxs_makers CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lxs_makers;

-- ============================================================
-- TABLA: USUARIOS
-- Base para Vendedor y Administrador (Herencia)
-- Estado: pendiente | activo | deshabilitado
-- ============================================================
CREATE TABLE usuarios (
    id          CHAR(36)        NOT NULL DEFAULT (UUID()),
    email       VARCHAR(255)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,
    rol         ENUM('vendedor','administrador') NOT NULL,
    estado      ENUM('pendiente','activo','deshabilitado') NOT NULL DEFAULT 'pendiente',
    nombre_negocio  VARCHAR(255)    NULL,
    codigo_catalogo VARCHAR(50)     NULL UNIQUE,
    whatsapp        VARCHAR(20)     NULL,
    limite_tableros INT             NOT NULL DEFAULT 5,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuarios PRIMARY KEY (id)
);

-- ============================================================
-- TABLA: PRODUCTOS
-- Composición con Vendedor: no existen sin un vendedor
-- ============================================================
CREATE TABLE productos (
    id          CHAR(36)        NOT NULL DEFAULT (UUID()),
    usuario_id  CHAR(36)        NOT NULL,
    nombre      VARCHAR(255)    NOT NULL,
    descripcion TEXT            NULL,
    precio      DECIMAL(10,2)   NOT NULL,
    estado      ENUM('visible','sin_stock','oculto') NOT NULL DEFAULT 'visible',
    orden_visual INT            NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_productos PRIMARY KEY (id),
    CONSTRAINT fk_productos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLA: IMAGENES_PRODUCTO
-- Cada producto puede tener hasta 5 imágenes (URLs de Cloudinary)
-- ============================================================
CREATE TABLE imagenes_producto (
    id          CHAR(36)        NOT NULL DEFAULT (UUID()),
    producto_id CHAR(36)        NOT NULL,
    url         VARCHAR(500)    NOT NULL,
    orden       INT             NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_imagenes PRIMARY KEY (id),
    CONSTRAINT fk_imagenes_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLA: VARIANTES
-- Variantes libres por producto (talle, color, etc.)
-- Composición con Producto
-- ============================================================
CREATE TABLE variantes (
    id          CHAR(36)        NOT NULL DEFAULT (UUID()),
    producto_id CHAR(36)        NOT NULL,
    tipo        VARCHAR(100)    NOT NULL,
    valor       VARCHAR(100)    NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_variantes PRIMARY KEY (id),
    CONSTRAINT fk_variantes_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLA: PEDIDOS
-- Composición con Vendedor
-- Se purgan automáticamente a los 7 días (Cron Job)
-- Estados: pendiente | en_proceso | enviado | entregado
-- ============================================================
CREATE TABLE pedidos (
    id                  CHAR(36)        NOT NULL DEFAULT (UUID()),
    usuario_id          CHAR(36)        NOT NULL,
    codigo_seguimiento  CHAR(8)         NOT NULL UNIQUE,
    datos_carrito       JSON            NOT NULL,
    total               DECIMAL(10,2)   NOT NULL,
    estado_pedido       ENUM('pendiente','en_proceso','enviado','entregado') NOT NULL DEFAULT 'pendiente',
    comentario          TEXT            NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_pedidos PRIMARY KEY (id),
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLA: HISTORIAL_VENTAS
-- Se alimenta cuando un pedido pasa a estado "entregado"
-- Si se elimina el producto, desaparece de las estadísticas
-- ============================================================
CREATE TABLE historial_ventas (
    id              CHAR(36)        NOT NULL DEFAULT (UUID()),
    usuario_id      CHAR(36)        NOT NULL,
    pedido_id       CHAR(36)        NOT NULL,
    producto_id     CHAR(36)        NOT NULL,
    nombre_producto VARCHAR(255)    NOT NULL,
    precio_unitario DECIMAL(10,2)   NOT NULL,
    cantidad        INT             NOT NULL DEFAULT 1,
    total_linea     DECIMAL(10,2)   NOT NULL,
    fecha_venta     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_historial PRIMARY KEY (id),
    CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_historial_pedido  FOREIGN KEY (pedido_id)  REFERENCES pedidos(id)  ON DELETE CASCADE,
    CONSTRAINT fk_historial_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLA: TABLEROS
-- Agregación con Vendedor: pueden existir independientemente
-- Límite por vendedor definido en usuarios.limite_tableros
-- ============================================================
CREATE TABLE tableros (
    id          CHAR(36)        NOT NULL DEFAULT (UUID()),
    usuario_id  CHAR(36)        NOT NULL,
    nombre      VARCHAR(255)    NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_tableros PRIMARY KEY (id),
    CONSTRAINT fk_tableros_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLA: TAREAS
-- Composición con Tablero: no existen sin un tablero
-- ============================================================
CREATE TABLE tareas (
    id          CHAR(36)        NOT NULL DEFAULT (UUID()),
    tablero_id  CHAR(36)        NOT NULL,
    contenido   TEXT            NOT NULL,
    seccion     ENUM('por_hacer','en_progreso','hecho') NOT NULL DEFAULT 'por_hacer',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_tareas PRIMARY KEY (id),
    CONSTRAINT fk_tareas_tablero FOREIGN KEY (tablero_id) REFERENCES tableros(id) ON DELETE CASCADE
);

-- ============================================================
-- USUARIO ADMINISTRADOR POR DEFECTO
-- Password: admin123 (cambiar en producción)
-- ============================================================
INSERT INTO usuarios (id, email, password, rol, estado, nombre_negocio)
VALUES (
    UUID(),
    'admin@lxsmakers.com',
    '$2b$12$placeholder_hash_cambiar',
    'administrador',
    'activo',
    'LXS Makers Admin'
);
