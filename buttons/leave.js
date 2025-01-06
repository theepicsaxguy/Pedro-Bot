// buttons/leave.js
const lobbyService = require('../services/lobbyService');
const { updateLobbyEmbed } = require('../utils/matchmakingHelpers.js');
const ButtonManager = require('../utils/ButtonManager');
const threadManager = require('../utils/threadManager');
const config = require('../config/constants');
const { MessageFlags } = require('discord.js');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  customId: config.BUTTON_IDS.LEAVE,
  async execute(interaction) {
    try {
      const messageId = interaction.message.id;
      const lobbyData = await lobbyService.getLobby(messageId);

      if (!lobbyData) {
        await interaction.reply({
          content: '❌ Lobby data not found.',
          flags: MessageFlags.Ephemeral,
          allowedMentions: { parse: ['roles'] },
        });
        return;
      }

      const userId = interaction.user.id;
      const username = interaction.user.username;

      if (!lobbyData.joinedUsers.includes(username)) {
        await interaction.reply({
          content: '🔴 You are not in the match!',
          flags: MessageFlags.Ephemeral,
          allowedMentions: { parse: ['roles'] },
        });
        return;
      }

      // Remove user from lobby
      lobbyData.joinedUsers = lobbyData.joinedUsers.filter(user => user !== username);
      lobbyData.joinedUserIds = lobbyData.joinedUserIds.filter(id => id !== userId);
      lobbyData.currentSlots = (lobbyData.currentSlots || 1) - 1;

      // Remove user from thread
      if (lobbyData.threadId) {
        const thread = interaction.channel.threads.cache.get(lobbyData.threadId);
        if (thread) {
          await thread.members.remove(userId);
          await thread.send(`❌ <@${username}> has left the match.`);
        }
      }

      // Persist to DB
      await lobbyService.setLobby(messageId, lobbyData);
      await updateLobbyEmbed(interaction, lobbyData);
      await interaction.deferUpdate();
    } catch (error) {
      errorHandler(error, 'Leave Button - execute');
      await interaction.reply({
        content: '❌ There was an error processing your request.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
