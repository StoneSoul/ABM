module.exports = (err, req, res, next) => {
  console.error(err);
  const statusCode = err.status || 500;
  const message = statusCode >= 500 ? 'Error interno del servidor' : err.message;
  res.status(statusCode).json({
    error: message
  });
};
