// events/messageCreate.js
const levelsManager = require('../commands/levels/levelsManager');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    try {
      if (!message.guild || message.author.bot) return;
      await levelsManager.incrementXP(message, 5);
    } catch (error) {
      errorHandler(error, 'MessageCreate Event - execute');
    }
  },
};
