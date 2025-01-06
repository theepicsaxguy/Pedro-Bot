// commands/levels/level.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const UserXP = require('../../models/UserXP');
const { xpRequiredForLevel } = require('./levelUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Check your current level'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const userId = interaction.user.id;
    const userDoc = await UserXP.findById(userId).exec() || { xp: 0, level: 0 };
    const xp = userDoc.xp;
    const lvl = userDoc.level;
    const xpNeeded = xpRequiredForLevel(lvl + 1) - xp;

    await interaction.editReply({
      content: `You are **Level ${lvl}** with **${xp} XP**.\n` +
               `You need **${xpNeeded > 0 ? xpNeeded : 0} XP** to reach Level ${lvl + 1}.`,
      flags: MessageFlags.Ephemeral
    });
  }
};
