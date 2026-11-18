/**
 * Scheduled Cron Job for Daily Reminders
 * Implements SRS FR-30, FR-31 (Daily reminder generator).
 */

let cron = null;
try {
  cron = require('node-cron');
} catch (e) {
  // node-cron will be used once npm install is run
}
const { generateDailyReminders } = require('../services/reminderService');

/**
 * Initializes the background scheduled job.
 * Runs daily at midnight (00:05:00).
 */
function initReminderCronJob() {
  console.log('[Cron Job] Initializing daily vehicle maintenance and document reminder schedule.');

  const runTask = async () => {
    console.log(`[Cron Job Trigger] Running daily reminders scan at ${new Date().toISOString()}...`);
    try {
      const result = await generateDailyReminders();
      console.log(`[Cron Job Complete] Processed ${result.processedUsers} users. Created ${result.remindersCreated} new reminders.`);
    } catch (err) {
      console.error(`[Cron Job Error] Failed to generate daily reminders: ${err.message}`);
    }
  };

  if (cron) {
    cron.schedule('5 0 * * *', runTask);
  } else {
    // 24-hour interval fallback
    setInterval(runTask, 24 * 60 * 60 * 1000);
  }
}

module.exports = {
  initReminderCronJob,
};
