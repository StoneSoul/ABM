<?php
/**
 * Plugin Name: ABM Sync
 * Description: Recibe usuarios desde el ABM externo y los sincroniza correctamente.
 * Version: 1.7
 */

// Registrar rutas de la API
add_action('rest_api_init', function () {
    register_rest_route('custom-abm/v1', '/create-user', [
        'methods'  => 'POST',
        'callback' => 'abm_create_user',
        'permission_callback' => 'abm_permission_check',
    ]);

    register_rest_route('custom-abm/v1', '/admin-login', [
        'methods'  => 'POST',
        'callback' => 'abm_admin_login',
        'permission_callback' => 'abm_permission_check',
    ]);

    register_rest_route('custom-abm/v1', '/update-user-status', [
        'methods'  => 'POST',
        'callback' => 'abm_update_user_status',
        'permission_callback' => 'abm_permission_check',
    ]);
});

// Crear usuario desde el ABM
function abm_create_user($request) {
    $params = $request->get_json_params();

    $username = sanitize_user($params['username']);
    $email = sanitize_email($params['email']);
    $password = $params['password'];
    $rol = sanitize_text_field($params['rol']);
    $codigos = sanitize_text_field($params['cod_profesional']);

    $nombre = sanitize_text_field($params['nombre'] ?? '');
    $apellido = sanitize_text_field($params['apellido'] ?? '');
    $alias = sanitize_text_field($params['alias'] ?? $username);

    if (!$username || !$email || !$password || !$rol) {
        return new WP_Error('invalid_data', 'Faltan datos obligatorios', ['status' => 400]);
    }

    if (username_exists($username) || email_exists($email)) {
        return new WP_Error('user_exists', 'El usuario ya existe', ['status' => 409]);
    }

    $user_id = wp_insert_user([
        'user_login'    => $username,
        'user_pass'     => $password,
        'user_email'    => $email,
        'role'          => $rol,
        'first_name'    => $nombre,
        'last_name'     => $apellido,
        'nickname'      => $alias,
        'display_name'  => "$nombre $apellido"
    ]);

    if (is_wp_error($user_id)) {
        return new WP_Error('insert_failed', 'Error al crear usuario', ['status' => 500]);
    }

    update_user_meta($user_id, 'professional_code', $codigos);
    update_user_meta($user_id, 'abm_enabled', 1); // Por defecto: habilitado

    return rest_ensure_response(['mensaje' => 'Usuario creado correctamente']);
}

// Validar login de administrador
function abm_admin_login($request) {
    $params = $request->get_json_params();
    $username = sanitize_user($params['username']);
    $password = $params['password'];

    $user = wp_authenticate($username, $password);
    if (is_wp_error($user) || !user_can($user, 'administrator')) {
        return new WP_Error('unauthorized', 'Credenciales inválidas o usuario no es administrador', ['status' => 401]);
    }

    return rest_ensure_response(['mensaje' => 'Login exitoso']);
}

// Actualizar estado habilitado/deshabilitado del usuario (vía ABM)
function abm_update_user_status($request) {
    $params = $request->get_json_params();
    $username = sanitize_user($params['username']);

    if (!isset($params['enabled'])) {
        return new WP_Error('missing_param', 'Falta el parámetro enabled', ['status' => 400]);
    }

    $enabled = filter_var($params['enabled'], FILTER_VALIDATE_BOOLEAN);

    $user = get_user_by('login', $username);
    if (!$user) {
        return new WP_Error('not_found', 'Usuario no encontrado', ['status' => 404]);
    }

    update_user_meta($user->ID, 'abm_enabled', $enabled ? 1 : 0);

    return rest_ensure_response(['mensaje' => 'Estado actualizado correctamente']);
}

// Notificar cambios de contraseña al ABM externo (o solo guardar en metadatos si no hay URL)
add_action('password_reset', 'abm_notify_password_change', 10, 2);
function abm_notify_password_change($user, $new_pass) {
    $base_url = defined('ABM_API_URL') ? ABM_API_URL : get_option('abm_api_url', '');
    $current = wp_get_current_user();
    $changed_by = ($current && $current->ID && $current->ID !== $user->ID) ? 'admin' : 'user';

    if ($base_url) {
        $url = rtrim($base_url, '/') . '/api/usuarios/wp-password-change';
        $token = defined('ABM_SYNC_TOKEN') ? ABM_SYNC_TOKEN : get_option('abm_sync_token');

        $args = [
            'body' => json_encode([
                'username' => $user->user_login,
                'new_password' => $new_pass,
                'changed_by' => $changed_by
            ]),
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $token,
            ],
            'timeout' => 10,
        ];

        wp_remote_post($url, $args);
    }

    // Guardar en cualquier caso
    update_user_meta($user->ID, 'abm_last_pwd_change', current_time('mysql'));
    update_user_meta($user->ID, 'abm_last_pwd_changed_by', $changed_by);
}

// Registrar cambios de contraseña desde el administrador
add_action('profile_update', 'abm_track_admin_password_change', 10, 2);
function abm_track_admin_password_change($user_id, $old_user_data) {
    if (!isset($_POST['pass1']) || empty($_POST['pass1'])) {
        return;
    }

    $current_user = wp_get_current_user();
    $changed_by = ($current_user && $current_user->ID !== $user_id) ? 'admin' : 'user';

    update_user_meta($user_id, 'abm_last_pwd_change', current_time('mysql'));
    update_user_meta($user_id, 'abm_last_pwd_changed_by', $changed_by);
}

// Bloquear inicio de sesión si el usuario está deshabilitado
add_filter('wp_authenticate_user', 'abm_block_disabled_users', 10, 2);
function abm_block_disabled_users($user, $password) {
    $enabled = get_user_meta($user->ID, 'abm_enabled', true);

    if ($enabled === '0') {
        return new WP_Error('abm_user_disabled', 'Su usuario no está habilitado');
    }

    return $user;
}

// Página en el admin para verificar estado de usuarios
add_action('admin_menu', 'abm_admin_menu');
function abm_admin_menu() {
    add_menu_page(
        'Estado ABM',
        'Estado ABM',
        'manage_options',
        'estado-abm',
        'abm_estado_admin_page',
        'dashicons-admin-users',
        80
    );
}

function abm_estado_admin_page() {
    echo '<div class="wrap"><h1>Consulta de estado ABM</h1>';

    if (isset($_POST['abm_check_user'])) {
        $username = sanitize_user($_POST['username']);
        $user = get_user_by('login', $username);

        if ($user) {
            $enabled = get_user_meta($user->ID, 'abm_enabled', true);
            echo "<p><strong>Usuario:</strong> {$username}</p>";
            echo "<p><strong>abm_enabled:</strong> " . ($enabled !== '' ? $enabled : '<em>(no definido)</em>') . "</p>";
        } else {
            echo "<p style='color:red;'>Usuario no encontrado</p>";
        }
    }

    echo '<form method="post">';
    echo '<label for="username">Nombre de usuario:</label><br>';
    echo '<input type="text" name="username" id="username" required><br><br>';
    echo '<input type="submit" name="abm_check_user" value="Consultar estado">';
    echo '</form>';
    echo '</div>';
}

// Validación por token para los endpoints
function abm_permission_check($request) {
    $token = $request->get_header('Authorization');
    $expected = defined('ABM_SYNC_TOKEN')
        ? 'Bearer ' . ABM_SYNC_TOKEN
        : 'Bearer ' . get_option('abm_sync_token');

    return hash_equals($expected, $token);
}
