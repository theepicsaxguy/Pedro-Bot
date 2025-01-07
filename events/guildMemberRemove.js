// events/guildMemberRemove.js
const settingsService = require('../services/settingsService');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    try {
      const leaveEnabled = await settingsService.getSetting('leaveEnabled');
      const notificationChannelId = await settingsService.getSetting('notificationChannelId');
      const leaveMessageTemplate = await settingsService.getSetting('leaveMessage') || '{user}, has left MATAC!';

      if (leaveEnabled && notificationChannelId) {
        const channel = await client.channels.fetch(notificationChannelId);
        if (channel && channel.isTextBased()) {
          const leaveMessage = leaveMessageTemplate
            .replace('{user}', `<@${member.id}>`);
          
          await channel.send({ content: leaveMessage });
        }
      }
    } catch (error) {
      errorHandler(error, 'guildMemberRemove Event');
    }
  },
};
