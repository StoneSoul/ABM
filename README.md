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
SESSION_SECRET=
SESSION_COOKIE_SECURE=
WP_TOKEN=
WP_HOST=
WP_USER=
WP_PASS=
WP_DB=
TZ=
WP_SYNC_INTERVAL=
```

`TZ` permite establecer la zona horaria que usará el servidor. Si no se define,
se tomará `America/Argentina/Cordoba` por defecto.

Ajusta cada valor según tu configuración local o de producción.

`WP_TOKEN` debe coincidir con el valor configurado en WordPress mediante la
constante `ABM_SYNC_TOKEN` (o la opción `abm_sync_token`). Este token se envía en
la cabecera `Authorization` al llamar a los endpoints del plugin.

Si necesitas exponer el sitio únicamente por HTTP (por ejemplo, en entornos
internos sin SSL), define `SESSION_COOKIE_SECURE=false`. De lo contrario, el
cookie de sesión no se guardará en el navegador y los usuarios no podrán
autenticarse. Cuando el despliegue utilice HTTPS, establece
`SESSION_COOKIE_SECURE=true` para mantener la cookie marcada como segura.

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

## Tabla `password_logs`

Para registrar los cambios de contraseña se utiliza la tabla `password_logs` en la base de datos del ABM. Debe crearse con la siguiente estructura básica:

```sql
CREATE TABLE password_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL, -- hash de la contraseña
  changed_by VARCHAR(50) NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Evitar registros duplicados por usuario y fecha de cambio
ALTER TABLE password_logs ADD UNIQUE KEY unq_user_time (username, changed_at);
```

Cada vez que WordPress notifica un cambio de clave se inserta un registro indicando si el cambio lo realizó un usuario o un administrador.

## Tabla `usuarios`

La tabla principal de usuarios debe incluir ahora una columna `password` para almacenar la última clave sincronizada. Un esquema simplificado sería:

```sql
CREATE TABLE usuarios (
  username VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  nombre_completo VARCHAR(255),
  rol VARCHAR(50),
  cod_profesional VARCHAR(50),
  estado TINYINT DEFAULT 1,
  fecha_alta DATETIME,
  fecha_modificacion DATETIME
);
```

## Comandos básicos

- `npm install` – Instala todas las dependencias declaradas en `package.json`.  
- `npm start` – Inicia el servidor utilizando `node server.js`.  
- `pm2 start ecosystem.config.cjs` – Ejecuta el servidor con [PM2](https://pm2.keymetrics.io/) usando la configuración definida en `ecosystem.config.cjs`. Esta configuración está preparada para reiniciar el proceso automáticamente cuando se modifican los archivos.

## Sincronización de cambios desde WordPress

Cuando el ABM no está disponible, WordPress guarda en cada usuario la fecha del
último cambio de contraseña y quién lo realizó mediante los metadatos
`abm_last_pwd_change` y `abm_last_pwd_changed_by`. Adicionalmente se registra
`abm_last_pwd_hash` con la nueva clave ya en formato hash para que el ABM pueda
recuperarla en caso de estar caído.
El script `services/checkWpPasswordChanges.js` consulta esos valores
directamente en la base de datos de WordPress, actualiza la tabla `usuarios`
con la clave y registra cada modificación en `password_logs`.
El servidor ejecuta este proceso de forma automática cada minuto (o según el
valor definido en `WP_SYNC_INTERVAL`).
