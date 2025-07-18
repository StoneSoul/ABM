module.exports = (err, req, res, next) => {
  console.error(err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Error interno del servidor'
  });
};
