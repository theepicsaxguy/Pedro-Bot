const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const userService = require('../services/userService');
const lobbyService = require('../services/lobbyService');
const scheduleService = require('../services/scheduleService');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('Show server statistics'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const memberCount = interaction.guild.memberCount;
      const activeLobbies = await lobbyService.getActiveLobbyCount();
      const userCount = await userService.getUserCount();
      const scheduleCount = await scheduleService.getScheduleCount();

      const embed = new EmbedBuilder()
        .setTitle('Server Statistics')
        .addFields(
          { name: 'Members', value: String(memberCount), inline: true },
          { name: 'Registered Users', value: String(userCount), inline: true },
          { name: 'Active Lobbies', value: String(activeLobbies), inline: true },
          { name: 'Scheduled Commands', value: String(scheduleCount), inline: true },
        );

      await interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (error) {
      errorHandler(error, 'ServerStats Command - execute');
      if (interaction.deferred) {
        await interaction.editReply({ content: '❌ Error fetching server stats.', flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: '❌ Error fetching server stats.', flags: MessageFlags.Ephemeral });
      }
    }
  },
};
