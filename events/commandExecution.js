// events/commandExecution.js

const errorHandler = require('../utils/errorHandler');

module.exports = {
  name: 'commandExecution',
  once: false,
  /**
   * Executes a scheduled command.
   * @param {String} commandName - The name of the command to execute.
   * @param {Object} args - The arguments for the command.
   * @param {Client} client - The Discord client instance.
   */
  async execute(commandName, args, client) { // Added 'client' parameter
    try {
      const command = client.commands.get(commandName); // Use 'client' directly
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
