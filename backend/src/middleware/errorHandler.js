// Global error handling middleware
// Enforces consistent JSON error format: { "error": "message" }
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('[Error Trace]', err);
  }

  res.status(statusCode).json({
    error: message,
  });
};

module.exports = errorHandler;
