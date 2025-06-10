// commands/profile.command.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const userService = require('../services/userService');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Show user profile statistics')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to check')
        .setRequired(false)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const user = interaction.options.getUser('user') || interaction.user;
      const userDoc = await userService.getUser(user.id) || { xp: 0, level: 0, messageCount: 0 };
      await interaction.editReply({
        content: `**${user.username}'s Profile**\n` +
                 `Level: ${userDoc.level}\n` +
                 `XP: ${userDoc.xp}\n` +
                 `Messages: ${userDoc.messageCount || 0}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      errorHandler(error, 'Profile Command - execute');
      await interaction.reply({
        content: '❌ Error fetching profile.',
        flags: MessageFlags.Ephemeral,
      }).catch(err => errorHandler(err, 'Profile Command - reply error'));
    }
  },
};
