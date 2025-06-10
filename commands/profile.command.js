const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const userService = require('../services/userService');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Show your user profile'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const userId = interaction.user.id;
      const userDoc = await userService.getUser(userId) || { xp: 0, level: 0 };
      const rank = await userService.getUserRank(userId);

      const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s Profile`)
        .addFields(
          { name: 'Level', value: String(userDoc.level), inline: true },
          { name: 'XP', value: String(userDoc.xp), inline: true },
          { name: 'Rank', value: `#${rank}`, inline: true },
        )
        .setThumbnail(interaction.user.displayAvatarURL());

      await interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (error) {
      errorHandler(error, 'Profile Command - execute');
      if (interaction.deferred) {
        await interaction.editReply({ content: '❌ Error fetching profile.', flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: '❌ Error fetching profile.', flags: MessageFlags.Ephemeral });
      }
    }
  },
};
