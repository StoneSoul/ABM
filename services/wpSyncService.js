const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');
const WP_API = process.env.WP_API;
const WP_TOKEN = process.env.WP_TOKEN;


exports.syncToWordpress = async ({
  username,
  password,
  email,
  rol,
  cod_profesional,
  nombre,
  apellido,
  alias,
}) => {
  const payload = {
    username,
    email,
    rol,
    cod_profesional,
    nombre,
    apellido,
    alias: alias || username,
  };

  try {
    if (password && email && rol) {
      try {
        await axios.post(
          `${WP_API}/create-user`,
          { ...payload, password },
          {
            headers: {
              Authorization: `Bearer ${WP_TOKEN}`,
            },
          }
        );
        return;
      } catch (err) {
        if (!(err.response && err.response.status === 409)) {
          throw err;
        }
      }
    }

    if (password) {
      payload.password = password;
    }

    await axios.post(`${WP_API}/update-user`, payload, {
      headers: {
        Authorization: `Bearer ${WP_TOKEN}`,
      },
    });
  } catch (error) {
    console.error(
      'Error sincronizando con WordPress:',
      error.response?.data || error
    );
    throw error;
  }
};

exports.actualizarEstado = async ({ username, estado }) => {
  try {
    await axios.post(`${WP_API}/update-user-status`, {
      username,
      enabled: estado === 1,
    }, {
      headers: {
        Authorization: `Bearer ${WP_TOKEN}`
      }
    });
  } catch (error) {
    console.error('Error actualizando estado en WordPress:', error.response?.data || error);
    throw error;
  }
};
