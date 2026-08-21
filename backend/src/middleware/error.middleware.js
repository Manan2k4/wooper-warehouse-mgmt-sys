exports.errorHandler = (err, req, res, next) => {
  console.error('Error Details:', err);
  let error = { ...err };
  error.message = err.message;

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `Duplicate field value entered for '${field}'. Please use another value.`;
    return res.status(400).json({ success: false, message: error.message });
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({ success: false, message });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
};
