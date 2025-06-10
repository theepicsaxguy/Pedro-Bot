// commands/levels/challenge.command.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const userService = require('../../services/userService');
const levelsManager = require('./levelsManager');
const errorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('challenge')
    .setDescription('Complete daily or weekly challenges')
    .addSubcommand(sub => sub.setName('daily').setDescription('Claim the daily challenge'))
    .addSubcommand(sub => sub.setName('weekly').setDescription('Claim the weekly challenge')),

  async execute(interaction) {
    try {
      const type = interaction.options.getSubcommand();
      const userId = interaction.user.id;
      let userDoc = await userService.getUser(userId);
      if (!userDoc) {
        userDoc = await userService.setUser(userId, {
          xp: 0,
          level: 0,
          lastMessage: null,
          excludedChannels: [],
          lastDaily: null,
          lastWeekly: null,
        });
      }

      const now = new Date();
      if (type === 'daily') {
        if (userDoc.lastDaily && now - userDoc.lastDaily < 24 * 60 * 60 * 1000) {
          return interaction.reply({ content: '🕒 Daily challenge already completed.', flags: MessageFlags.Ephemeral });
        }
        userDoc.lastDaily = now;
        await userService.setUser(userId, userDoc);
        await levelsManager.incrementXP(userId, interaction.guild, interaction.channel, 10, 'DAILY');
        return interaction.reply({ content: '✅ Daily challenge completed! +20 XP', flags: MessageFlags.Ephemeral });
      }

      if (type === 'weekly') {
        if (userDoc.lastWeekly && now - userDoc.lastWeekly < 7 * 24 * 60 * 60 * 1000) {
          return interaction.reply({ content: '🕒 Weekly challenge already completed.', flags: MessageFlags.Ephemeral });
        }
        userDoc.lastWeekly = now;
        await userService.setUser(userId, userDoc);
        await levelsManager.incrementXP(userId, interaction.guild, interaction.channel, 10, 'WEEKLY');
        return interaction.reply({ content: '✅ Weekly challenge completed! +50 XP', flags: MessageFlags.Ephemeral });
      }
    } catch (error) {
      errorHandler(error, 'Challenge Command - execute');
      await interaction.reply({ content: '❌ Error running challenge.', flags: MessageFlags.Ephemeral });
    }
  },
};
