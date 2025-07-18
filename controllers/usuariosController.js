const { syncToWordpress } = require('../services/wpSyncService');
const { syncToSuite } = require('../services/suiteSyncService');

exports.crearUsuario = async (req, res) => {
  try {
    const datos = req.body;
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
