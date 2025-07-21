<?php
/**
 * Plugin Name: ABM Sync
 * Description: Recibe usuarios desde el ABM externo y los sincroniza correctamente.
 * Version: 1.4
 */

add_action('rest_api_init', function () {
    register_rest_route('custom-abm/v1', '/create-user', [
        'methods'  => 'POST',
        'callback' => 'abm_create_user',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('custom-abm/v1', '/admin-login', [
        'methods'  => 'POST',
        'callback' => 'abm_admin_login',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('custom-abm/v1', '/update-user-status', [
        'methods'  => 'POST',
        'callback' => 'abm_update_user_status',
        'permission_callback' => '__return_true',
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
    $enabled = filter_var($params['enabled'], FILTER_VALIDATE_BOOLEAN);

    $user = get_user_by('login', $username);
    if (!$user) {
        return new WP_Error('not_found', 'Usuario no encontrado', ['status' => 404]);
    }

    update_user_meta($user->ID, 'abm_enabled', $enabled ? 1 : 0);

    return rest_ensure_response(['mensaje' => 'Estado actualizado correctamente']);
}

// Notificar cambios de contraseña al ABM externo
add_action('after_password_reset', 'abm_notify_password_change', 10, 2);
function abm_notify_password_change($user, $new_pass) {
    $url = 'http://tu-servidor-abm/api/usuarios/wp-password-change'; // Reemplazar por URL real

    $args = [
        'body' => json_encode([
            'username' => $user->user_login,
            'new_password' => $new_pass
        ]),
        'headers' => [
            'Content-Type' => 'application/json'
        ],
        'timeout' => 10,
    ];

    wp_remote_post($url, $args);
}

// Bloquear inicio de sesión si el usuario tiene abm_enabled = 0
add_filter('wp_authenticate_user', 'abm_block_disabled_users', 10, 2);
function abm_block_disabled_users($user, $password) {
    $enabled = get_user_meta($user->ID, 'abm_enabled', true);
    if ($enabled === '0') {
        return new WP_Error('abm_user_disabled', 'Su usuario no está habilitado');
    }

    return $user;
}

/*
 // OPCIONAL: Validar autenticación por token
function abm_permission_check($request) {
    $token = $request->get_header('Authorization');
    $valid_token = 'Bearer TU_TOKEN_SEGURO';

    return $token === $valid_token;
}
*/
