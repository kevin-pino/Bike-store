# BikeStore Backend

API didáctica de BikeStore construida con Express y MySQL. Conserva la autenticación JWT y bcrypt del proyecto base.

## Preparar la base de datos

Ejecuta `../SQL/bikestore.sql` en MySQL. Este esquema crea la base de datos `bikestore` y las tablas que necesita la aplicación sin borrar tablas ni datos existentes. Si ya usabas BikeStore, vuelve a ejecutar el archivo para crear la tabla de imágenes adicionales de producto.

## Variables de entorno

Copia `.env.example` como `.env`, configura las credenciales locales de MySQL y cambia `JWT_SECRET` por una clave segura de desarrollo. El `.env` no debe compartirse ni versionarse.

## Instalar y ejecutar

Requiere Node.js 20 o superior (usa `fetch` integrado para el proveedor de correo).

```bash
npm install
npm run dev
```

API: `http://localhost:3000`

## Rutas disponibles en esta etapa

Públicas:
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/productos`
- `GET /api/productos/:id`

Solo administrador:
- `GET /api/productos/admin/all`
- `POST /api/productos`
- `PUT /api/productos/:id`
- `PATCH /api/productos/:id/estado`

Las imágenes aceptadas son JPG, PNG o WebP, con un tamaño máximo de 2 MB cada una. Cada producto puede tener una imagen principal y hasta seis imágenes adicionales.


## Carrito y compra simulada

El carrito se guarda en MySQL por cliente, por lo que puede recuperarse al volver a iniciar sesión. El checkout crea un pedido, conserva sus detalles históricos, descuenta existencias dentro de una transacción y devuelve un número único de confirmación.

Solo clientes autenticados:
- `GET /api/carrito`
- `POST /api/carrito/items`
- `PATCH /api/carrito/items/:idProducto`
- `DELETE /api/carrito/items/:idProducto`
- `POST /api/pedidos/checkout`
- `GET /api/pedidos` para consultar el historial propio con sus detalles.

Los campos de cuenta del checkout son de demostración y no se almacenan. No se conecta ninguna pasarela de pago real.




## Administración

Solo administradores pueden consultar el dashboard, exportar el informe Excel-compatible (CSV) y buscar o gestionar cuentas.
- `GET /api/dashboard?desde=AAAA-MM-DD&hasta=AAAA-MM-DD&categoria=...`
- `GET /api/dashboard/exportar?desde=AAAA-MM-DD&hasta=AAAA-MM-DD&categoria=...`
- `GET /api/usuarios?busqueda=...`
- `PATCH /api/usuarios/:id/rol`
- `PATCH /api/usuarios/:id/estado`

El esquema añade el estado activo de los usuarios mediante una migración idempotente.

## Registro y recuperación de contraseña

El registro valida el formato del correo y que no esté repetido, pero no confirma que el buzón exista. La cuenta queda activa inmediatamente y se puede usar ese mismo correo y contraseña para iniciar sesión.

Para restablecer la contraseña, `POST /api/auth/recuperar-contrasena` consulta si el correo pertenece a una cuenta activa. Si existe, el formulario permite escribir y guardar la contraseña nueva mediante `POST /api/auth/restablecer-contrasena`. No requiere servicio de correo.

Este flujo didáctico no prueba la identidad de quien solicita el cambio: cualquier persona que conozca el correo registrado puede cambiar esa contraseña. Las tablas de tokens que pudieran existir de una versión anterior se conservan, pero ya no se utilizan. Al volver a ejecutar el esquema, las cuentas pendientes de confirmación de esa versión se activan una sola vez; el esquema no elimina tablas ni datos.
