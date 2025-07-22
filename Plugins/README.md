# ABM Sync

Este plugin sincroniza usuarios con un ABM externo.

## Configuraci\u00f3n

1. Definir la URL base del API externo mediante la constante `ABM_API_URL` en `wp-config.php` o establecer la opción `abm_api_url` en WordPress.
2. Incluir el esquema `https://` si el servidor lo soporta.

Ejemplo en `wp-config.php`:

```php
define('ABM_API_URL', 'https://tu-servidor-abm');
```

Tambien puede guardarse mediante la consola de WP:

```sh
wp option update abm_api_url https://tu-servidor-abm
```

