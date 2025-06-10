// commands/serverstats.command.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('Display basic server statistics'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const { guild } = interaction;
      const members = await guild.members.fetch();
      const total = members.size;
      const bots = members.filter(m => m.user.bot).size;
      const humans = total - bots;
      const roles = guild.roles.cache.size;
      const channels = guild.channels.cache.size;
      await interaction.editReply({
        content: `**Server Stats**\nMembers: ${total} (Humans: ${humans}, Bots: ${bots})\n` +
                 `Roles: ${roles}\nChannels: ${channels}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      errorHandler(error, 'ServerStats Command - execute');
      await interaction.reply({
        content: '❌ Error fetching server stats.',
        flags: MessageFlags.Ephemeral,
      }).catch(err => errorHandler(err, 'ServerStats Command - reply error'));
    }
  },
};
