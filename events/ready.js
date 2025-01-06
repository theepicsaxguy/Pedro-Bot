// events/ready.js
const scheduler = require('../utils/scheduler');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`[✅] Bot is online as ${client.user.tag}.`);
    scheduler.initialize(client); // Initialize the scheduler with the client
  },
};
