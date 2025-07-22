# ABM

Este proyecto implementa un servidor Express que sincroniza usuarios con un sistema externo y con WordPress. Se ejecuta en Node.js y utiliza MySQL como base de datos.

## Requisitos

- **Node.js** (versión 16 o superior)  
- **npm**  
- **MySQL**

## Instalación

1. Clona el repositorio y ubícate en la carpeta del proyecto.  
2. Ejecuta `npm install` para instalar las dependencias.  
3. Copia el archivo `.env.example` a `.env` y completa los valores necesarios:

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

Ajusta cada valor según tu configuración local o de producción.

## Uso

Una vez instaladas las dependencias y configurado el archivo `.env`, puedes iniciar el servidor con:

```bash
npm start
```

Por defecto, el servidor queda escuchando en el puerto indicado por `PORT`.

## Estructura de carpetas

- `controllers/` – Lógica principal de autenticación y gestión de usuarios.  
- `middlewares/` – Middlewares de Express: validaciones, control de sesión y manejo de errores.  
- `routes/` – Definición de rutas para la API (`/auth`, `/usuarios`).  
- `services/` – Funciones auxiliares para sincronizar usuarios con WordPress y otros sistemas.  
- `public/` – Archivos estáticos (formularios HTML) que sirven como interfaz básica.  
- `Plugins/` – Plugin de WordPress utilizado para la integración con el ABM.

## Comandos básicos

- `npm install` – Instala todas las dependencias declaradas en `package.json`.  
- `npm start` – Inicia el servidor utilizando `node server.js`.  
- `pm2 start ecosystem.config.cjs` – Ejecuta el servidor con [PM2](https://pm2.keymetrics.io/) usando la configuración definida en `ecosystem.config.cjs`. Esta configuración está preparada para reiniciar el proceso automáticamente cuando se modifican los archivos.