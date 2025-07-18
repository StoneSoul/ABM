const { syncToWordpress } = require('../services/wpSyncService');
const { syncToSuite, actualizarClave } = require('../services/suiteSyncService');

exports.crearUsuario = async (req, res) => {
  try {
    const datos = req.body;

    // Agregar alias si no viene (usa username como valor por defecto)
    if (!datos.alias) {
      datos.alias = datos.username;
    }

    await syncToWordpress(datos);
    await syncToSuite(datos);

    res.status(201).json({ mensaje: 'Usuario creado correctamente' });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

exports.modificarUsuario = async (req, res) => {
  try {
    const datos = req.body;
    await syncToWordpress(datos);
    await syncToSuite(datos);
    res.json({ mensaje: 'Usuario modificado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al modificar usuario' });
  }
};

exports.passwordCambiadaDesdeWp = async (req, res) => {
  try {
    const { username, password } = req.body;
    await actualizarClave({ username, password });
    res.json({ mensaje: 'Clave actualizada en Suite' });
  } catch (error) {
    console.error('Error actualizando clave desde WP:', error);
    res.status(500).json({ error: 'Error actualizando clave' });
  }
};
