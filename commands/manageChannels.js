// commands/manageChannels.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('@discordjs/builders');
const UserXP = require('../models/UserXP');
const { MessageFlags } = require('discord.js');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('managechannels')
    .setDescription('Manage the list of channels excluded from XP tracking')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a channel to the excluded list')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('Channel to exclude')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a channel from the excluded list')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('Channel to remove')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all excluded channels')),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      const channel = interaction.options.getChannel('channel');

      let globalSettings = await UserXP.findById('globalSettings').exec();
      if (!globalSettings) {
        globalSettings = new UserXP({
          _id: 'globalSettings',
          excludedChannels: [],
        });
        await globalSettings.save();
      }

      if (subcommand === 'add') {
        if (globalSettings.excludedChannels.includes(channel.id)) {
          await interaction.reply({
            content: `🔴 Channel <#${channel.id}> is already excluded.`,
            ephemeral: true
          });
        } else {
          globalSettings.excludedChannels.push(channel.id);
          await globalSettings.save();
          await interaction.reply({
            content: `✅ Channel <#${channel.id}> has been added to the excluded list.`,
            ephemeral: true
          });
          console.log(`[ℹ️] ${interaction.user.tag} added channel ${channel.id} to excluded channels.`);
        }
      } else if (subcommand === 'remove') {
        if (!globalSettings.excludedChannels.includes(channel.id)) {
          await interaction.reply({
            content: `🔴 Channel <#${channel.id}> is not in the excluded list.`,
            ephemeral: true
          });
        } else {
          globalSettings.excludedChannels = globalSettings.excludedChannels.filter(id => id !== channel.id);
          await globalSettings.save();
          await interaction.reply({
            content: `✅ Channel <#${channel.id}> has been removed from the excluded list.`,
            ephemeral: true
          });
          console.log(`[ℹ️] ${interaction.user.tag} removed channel ${channel.id} from excluded channels.`);
        }
      } else if (subcommand === 'list') {
        if (globalSettings.excludedChannels.length === 0) {
          await interaction.reply({
            content: '📋 No channels are currently excluded from XP tracking.',
            ephemeral: true
          });
        } else {
          const channelList = globalSettings.excludedChannels.map(id => `<#${id}>`).join('\n');
          await interaction.reply({
            content: `📋 **Excluded Channels:**\n${channelList}`,
            ephemeral: true
          });
        }
      }
    } catch (error) {
      errorHandler(error, 'ManageChannels Command - execute');
      await interaction.reply({
        content: '❌ There was an error managing the excluded channels.',
        ephemeral: true
      }).catch(() => {});
    }
  },
};
