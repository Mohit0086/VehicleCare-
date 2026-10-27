const app = require('./src/app');
const env = require('./src/config/env');

const server = app.listen(env.port, () => {
  console.log(`[Server] VehicleCare backend is running on http://localhost:${env.port} in ${env.nodeEnv} mode.`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err.message);
  process.exit(1);
});
