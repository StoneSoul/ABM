const axios = require('axios');
const WP_API = process.env.WP_API;

exports.syncToWordpress = async ({
  username,
  password,
  email,
  rol,
  cod_profesional,
  nombre,
  apellido,
  alias
}) => {
  try {
    await axios.post(`${WP_API}/create-user`, {
      username,
      password,
      email,
      rol,
      cod_profesional,
      nombre,
      apellido,
      alias: alias || username // si no viene alias, usa username
    });
  } catch (error) {
    console.error('Error sincronizando con WordPress:', error.response?.data || error);
    throw error;
  }
};

exports.actualizarEstado = async ({ username, estado }) => {
  try {
    await axios.post(`${WP_API}/update-user-status`, {
      username,
      enabled: estado === 1,
    });
  } catch (error) {
    console.error('Error actualizando estado en WordPress:', error.response?.data || error);
    throw error;
  }
};
