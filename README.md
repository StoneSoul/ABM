# ABM

Este proyecto implementa un servidor Express que sincroniza usuarios con un sistema externo y con WordPress. Se ejecuta en Node.js y utiliza MySQL como base de datos.

## Requisitos

- **Node.js** (versi\u00f3n 16 o superior)
- **npm**
- **MySQL**

## Instalaci\u00f3n

1. Clona el repositorio y ub\u00edcate en la carpeta del proyecto.
2. Ejecuta `npm install` para instalar las dependencias.
3. Copia el archivo `.env.example` a `.env` y completa los valores necesarios.

```bash
cp .env.example .env
# Edita .env con los datos de tu entorno
```

El archivo `.env.example` define todas las variables de entorno requeridas:

```
PORT=
DB_HOST=
DB_PORT=
DB_USER=
DB_PASS=
DB_NAME=
SUITE_API=
WP_API=
ADMIN_USER=
ADMIN_PASS=
SESSION_SECRET=
WP_TOKEN=
WP_HOST=
WP_USER=
WP_PASS=
WP_DB=
```

Ajusta cada valor seg\u00fan tu configuraci\u00f3n local o de producci\u00f3n.

## Uso

Una vez instaladas las dependencias y configurado el archivo `.env`, puedes iniciar el servidor con:

```bash
npm start
```

Por defecto el servidor queda escuchando en el puerto indicado por `PORT`.

## Estructura de carpetas

- `controllers/` &ndash; L\u00f3gica principal de autenticaci\u00f3n y gesti\u00f3n de usuarios.
- `middlewares/` &ndash; Middlewares de Express: validaciones, control de sesi\u00f3n y manejo de errores.
- `routes/` &ndash; Definici\u00f3n de rutas para la API (`/auth`, `/usuarios`).
- `services/` &ndash; Funciones auxiliares para sincronizar usuarios con WordPress y otros sistemas.
- `public/` &ndash; Archivos est\u00e1ticos (formularios HTML) que sirven como interfaz b\u00e1sica.
- `Plugins/` &ndash; Plugin de WordPress utilizado para la integraci\u00f3n con el ABM.

## Comandos b\u00e1sicos

- `npm install` &ndash; Instala todas las dependencias declaradas en `package.json`.
- `npm start` &ndash; Inicia el servidor utilizando `node server.js`.

