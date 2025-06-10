// events/messageCreate.js
const levelsManager = require('../commands/levels/levelsManager');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    try {
      if (!message.guild || message.author.bot) return;
      await levelsManager.incrementXP(
        message.author.id,
        message.guild,
        message.channel,
        5,
        'MESSAGE'
      );
    } catch (error) {
      errorHandler(error, 'MessageCreate Event - execute');
    }
  },
};
