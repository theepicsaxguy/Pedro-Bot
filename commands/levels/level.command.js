// commands/levels/level.command.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const userService = require('../../services/userService');
const levelUtils = require('../../utils/levelUtils');
const errorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Check your current level'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const userId = interaction.user.id;
      const userDoc = await userService.getUser(userId) || { xp: 0, level: 0 };
      const xp = userDoc.xp;
      const lvl = userDoc.level;
      const xpNeeded = levelUtils.xpRequiredForLevel(lvl + 1) - xp;

      await interaction.editReply({
        content: `📈 You are **Level ${lvl}** with **${xp} XP**.\n` +
                 `You need **${xpNeeded > 0 ? xpNeeded : 0} XP** to reach Level ${lvl + 1}.`,
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      errorHandler(error, 'Level Command - execute');
      await interaction.reply({
        content: '❌ There was an error fetching your level.',
        ephemeral: true
      }).catch(() => {});
    }
  }
};
