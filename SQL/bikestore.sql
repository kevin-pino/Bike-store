-- Esquema inicial de BikeStore. Es seguro volver a ejecutarlo: no elimina tablas ni datos.
CREATE DATABASE IF NOT EXISTS bikestore
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
USE bikestore;

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'cliente') NOT NULL DEFAULT 'cliente',
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    categoria VARCHAR(100) NOT NULL,
    marca VARCHAR(100) NULL,
    modelo VARCHAR(100) NULL,
    precio DECIMAL(12, 2) NOT NULL,
    stock INT UNSIGNED NOT NULL DEFAULT 0,
    imagen VARCHAR(255) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_productos_categoria (categoria),
    INDEX idx_productos_activo (activo),
    INDEX idx_productos_precio (precio)
);

CREATE TABLE IF NOT EXISTS producto_imagenes (
    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    archivo VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_producto_imagenes_producto (id_producto),
    CONSTRAINT fk_producto_imagenes_producto FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS carritos (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carritos_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS carrito_detalles (
    id_carrito INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_carrito, id_producto),
    CONSTRAINT fk_carrito_detalles_carrito FOREIGN KEY (id_carrito)
        REFERENCES carritos(id_carrito) ON DELETE CASCADE,
    CONSTRAINT fk_carrito_detalles_producto FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    numero_pedido VARCHAR(40) NOT NULL UNIQUE,
    id_usuario INT NOT NULL,
    estado ENUM('pagado_simulado', 'cancelado') NOT NULL DEFAULT 'pagado_simulado',
    total DECIMAL(12, 2) NOT NULL,
    direccion_envio VARCHAR(250) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    metodo_pago VARCHAR(40) NOT NULL DEFAULT 'PAGO_SIMULADO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pedidos_usuario_fecha (id_usuario, created_at),
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS detalles_pedido (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    nombre_producto VARCHAR(150) NOT NULL,
    precio_unitario DECIMAL(12, 2) NOT NULL,
    cantidad INT UNSIGNED NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_detalles_pedido_pedido FOREIGN KEY (id_pedido)
        REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_detalles_pedido_producto FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto) ON DELETE RESTRICT
);


-- Migración idempotente para bases existentes creadas antes del control de cuentas activas.
SET @bikestore_add_activo = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE usuarios ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1 AFTER rol',
        'SELECT 1')
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'activo'
);
PREPARE bikestore_stmt FROM @bikestore_add_activo;
EXECUTE bikestore_stmt;
DEALLOCATE PREPARE bikestore_stmt;

-- Activa una sola vez las cuentas de cliente que quedaron pendientes del flujo de verificación anterior.
-- Marca también sus tokens como usados para que futuras ejecuciones no reactiven cuentas deshabilitadas por administración.
SET @bikestore_activate_pending = (
    SELECT IF(COUNT(*) = 0,
        'SELECT 1',
        'UPDATE usuarios u JOIN tokens_verificacion_correo tv ON tv.id_usuario = u.id_usuario SET u.activo = 1, tv.usado_en = NOW() WHERE u.rol = ''cliente'' AND u.activo = 0 AND tv.usado_en IS NULL')
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tokens_verificacion_correo'
);
PREPARE bikestore_stmt FROM @bikestore_activate_pending;
EXECUTE bikestore_stmt;
DEALLOCATE PREPARE bikestore_stmt;
