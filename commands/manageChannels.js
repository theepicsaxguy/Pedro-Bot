const {
    SlashCommandBuilder,
    ActionRowBuilder,
    MessageFlags
  } = require('discord.js');
const UserXP = require('../models/UserXP');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('managechannels')
    .setDescription('Manage the list of channels excluded from XP tracking')
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
    const subcommand = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel('channel');

    // Fetch or create global settings document
    let globalSettings = await UserXP.findById('globalSettings').exec();
    if (!globalSettings) {
      globalSettings = new UserXP({ _id: 'globalSettings', excludedChannels: [] });
      await globalSettings.save();
    }

    if (subcommand === 'add') {
      if (globalSettings.excludedChannels.includes(channel.id)) {
        await interaction.reply(`🔴 Channel <#${channel.id}> is already excluded.`);
      } else {
        globalSettings.excludedChannels.push(channel.id);
        await globalSettings.save();
        await interaction.reply(`✅ Channel <#${channel.id}> has been added to the excluded list.`);
      }
    } else if (subcommand === 'remove') {
      if (!globalSettings.excludedChannels.includes(channel.id)) {
        await interaction.reply(`🔴 Channel <#${channel.id}> is not in the excluded list.`);
      } else {
        globalSettings.excludedChannels = globalSettings.excludedChannels.filter(id => id !== channel.id);
        await globalSettings.save();
        await interaction.reply(`✅ Channel <#${channel.id}> has been removed from the excluded list.`);
      }
    } else if (subcommand === 'list') {
      if (globalSettings.excludedChannels.length === 0) {
        await interaction.reply('📋 No channels are currently excluded from XP tracking.');
      } else {
        const channelList = globalSettings.excludedChannels.map(id => `<#${id}>`).join('\n');
        await interaction.reply(`📋 Excluded Channels:\n${channelList}`);
      }
    }
  },
};
