// commands/manageChannels.command.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const settingsService = require('../services/settingsService');
const { MessageFlags } = require('discord.js');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('managechannels')
    .setDescription('Manage the list of channels excluded from XP tracking')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
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

      let excludedChannels = await settingsService.getSetting('excludedChannels');
      if (!Array.isArray(excludedChannels)) excludedChannels = [];

      if (subcommand === 'add') {
        if (excludedChannels.includes(channel.id)) {
          await interaction.reply({
            content: `🔴 Channel <#${channel.id}> is already excluded.`,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          excludedChannels.push(channel.id);
          await settingsService.setSetting('excludedChannels', excludedChannels);
          await interaction.reply({
            content: `✅ Channel <#${channel.id}> has been added to the excluded list.`,
            flags: MessageFlags.Ephemeral,
          });
          console.log(`[ℹ️] ${interaction.user.tag} added channel ${channel.id} to excluded channels.`);
        }
      } else if (subcommand === 'remove') {
        if (!excludedChannels.includes(channel.id)) {
          await interaction.reply({
            content: `🔴 Channel <#${channel.id}> is not in the excluded list.`,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          excludedChannels = excludedChannels.filter(id => id !== channel.id);
          await settingsService.setSetting('excludedChannels', excludedChannels);
          await interaction.reply({
            content: `✅ Channel <#${channel.id}> has been removed from the excluded list.`,
            flags: MessageFlags.Ephemeral,
          });
          console.log(`[ℹ️] ${interaction.user.tag} removed channel ${channel.id} from excluded channels.`);
        }
      } else if (subcommand === 'list') {
        if (excludedChannels.length === 0) {
          await interaction.reply({
            content: '📋 No channels are currently excluded from XP tracking.',
            flags: MessageFlags.Ephemeral,
          });
        } else {
          const channelList = excludedChannels.map(id => `<#${id}>`).join('\n');
          await interaction.reply({
            content: `📋 **Excluded Channels:**\n${channelList}`,
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    } catch (error) {
      errorHandler(error, 'ManageChannels Command - execute');
      await interaction.reply({
        content: '❌ There was an error managing the excluded channels.',
        flags: MessageFlags.Ephemeral,
      }).catch(err => errorHandler(err, 'ManageChannels Command - reply error'));
    }
  },
};
