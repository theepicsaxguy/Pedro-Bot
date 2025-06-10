// events/guildMemberAdd.js
const settingsService = require('../services/settingsService');
const errorHandler = require('../utils/errorHandler');
const discordCache = require('../utils/discordCache');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    try {
      const welcomeEnabled = await settingsService.getSetting('welcomeEnabled');
      const notificationChannelId = await settingsService.getSetting('notificationChannelId');
      const welcomeMessageTemplate = await settingsService.getSetting('welcomeMessage') || 'Welcome to MATAC {user} you are the {memberCount}th member.';

      if (welcomeEnabled && notificationChannelId) {
        const channel = await discordCache.getChannel(client, notificationChannelId);
        if (channel && channel.isTextBased()) {
          const welcomeMessage = welcomeMessageTemplate
            .replace('{user}', `<@${member.id}>`)
            .replace('{memberCount}', member.guild.memberCount);
          
          await channel.send({ content: welcomeMessage });
        }
      }
    } catch (error) {
      errorHandler(error, 'guildMemberAdd Event');
    }
  },
};
