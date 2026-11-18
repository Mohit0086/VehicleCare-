const app = require('./src/app');
const env = require('./src/config/env');
const { initReminderCronJob } = require('./src/jobs/reminderJob');

let server;
async function start() {
  await require('./src/config/db').execute('SELECT 1');
  server = app.listen(env.port, () => {
  console.log(`[Server] VehicleCare backend is running on http://localhost:${env.port} in ${env.nodeEnv} mode.`);
  // Initialize daily cron jobs (FR-30, FR-31)
  initReminderCronJob();
});

}
start().catch((err) => {
  console.error('[Startup] Cannot connect to MySQL. Check backend/.env and import database/schema.sql.', err.code || err.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err.message);
  if (server) server.close(() => process.exit(1));
  else process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err.message);
  process.exit(1);
});
