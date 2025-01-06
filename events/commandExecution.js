// events/commandExecution.js
const errorHandler = require('../utils/errorHandler');

module.exports = {
  name: 'commandExecution',
  once: false,
  async execute(commandName, args) {
    try {
      const command = this.client.commands.get(commandName);
      if (!command) {
        console.warn(`[⚠️] Command "/${commandName}" not found for scheduled execution.`);
        return;
      }

      if (typeof command.executeScheduled === 'function') {
        await command.executeScheduled(args);
        console.log(`[✅] Executed scheduled command "/${commandName}" with args: ${JSON.stringify(args)}`);
      } else {
        console.warn(`[⚠️] Command "/${commandName}" does not have an executeScheduled method.`);
      }
    } catch (error) {
      errorHandler(error, `Command Execution Event - "${commandName}"`);
    }
  },
};
