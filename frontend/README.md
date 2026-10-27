# BikeStore Frontend

Interfaz de BikeStore creada con React y Vite. En esta primera etapa reutiliza la estructura del frontend del CRUD original y presenta un catálogo público de productos; el formulario de mantenimiento aparece únicamente para usuarios administradores.

## Requisitos
- Node.js 20+
- API de BikeStore ejecutándose en `http://localhost:3000`
- Base de datos MySQL `bikestore` configurada con `../SQL/bikestore.sql`

## Instalar y ejecutar

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Estructura reutilizada
- `components`: navegación, formulario y tarjetas del catálogo.
- `context`, `hooks`, `services`: sesión y comunicación con la API.
- `pages`: catálogo, inicio de sesión y registro.
- `utils`: sesión, formato de precio y rutas de imágenes.


Los clientes pueden iniciar sesión para guardar productos en su carrito. El checkout solicita datos ficticios y confirma un pago simulado; no procesa tarjetas ni cuentas reales. La vista “Mis pedidos” muestra las compras de la cuenta activa.

El formulario de productos permite cargar una imagen principal y hasta seis imágenes adicionales; la ficha del catálogo las presenta en una galería vertical.


Los administradores cuentan con vistas de dashboard y gestión de usuarios. El reporte se puede descargar como CSV compatible con Excel o imprimirse/guardarse como PDF desde el diálogo del navegador.

El registro no requiere confirmar el correo. La recuperación consulta el correo en la base de datos y permite establecer una nueva contraseña cuando la cuenta existe.
