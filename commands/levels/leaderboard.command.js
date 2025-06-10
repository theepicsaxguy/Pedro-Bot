// commands/levels/leaderboard.command.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const userService = require('../../services/userService');
const errorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the XP leaderboard')
    .addIntegerOption(option =>
      option.setName('page')
        .setDescription('Page number')
        .setRequired(false)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const page = interaction.options.getInteger('page') || 1;
      const pageSize = 10;
      const totalUsers = await userService.getUserCount();
      const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
      const pageNum = Math.min(Math.max(page, 1), totalPages);
      const users = await userService.getTopUsers(pageSize, (pageNum - 1) * pageSize);

      let response = `**XP Leaderboard (Page ${pageNum}/${totalPages})**\n`;
      users.forEach((u, idx) => {
        response += `${(pageNum - 1) * pageSize + idx + 1}. <@${u._id}> - ${u.xp} XP (Lvl ${u.level})\n`;
      });

      await interaction.editReply({ content: response, flags: MessageFlags.Ephemeral });
    } catch (error) {
      errorHandler(error, 'Leaderboard Command - execute');
      if (interaction.deferred) {
        await interaction.editReply({ content: '❌ Error fetching leaderboard.', flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: '❌ Error fetching leaderboard.', flags: MessageFlags.Ephemeral });
      }
    }
  },
};
