// commands/admin/settings.command.js
const { SlashCommandBuilder,MessageFlags, PermissionsBitField } = require('discord.js');
const settingsService = require('../../services/settingsService');
const config = require('../../config/constants');
const errorHandler = require('../../utils/errorHandler');
const auditService = require('../../services/auditService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Manage bot settings')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    // Existing subcommands
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-role')
        .setDescription('Set a Discord role for a specific user level')
        .addIntegerOption(option =>
          option.setName('level')
            .setDescription('The user level')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The Discord role to assign')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-role')
        .setDescription('Remove the Discord role for a specific user level')
        .addIntegerOption(option =>
          option.setName('level')
            .setDescription('The user level')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('get-roles')
        .setDescription('Get all role mappings for user levels'))
    // New subcommands for Notifications
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-notification-channel')
        .setDescription('Set the channel for join/leave notifications')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel to send notifications in')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle-welcome')
        .setDescription('Enable or disable welcome messages')
        .addBooleanOption(option =>
          option.setName('enable')
            .setDescription('Enable or disable welcome messages')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle-leave')
        .setDescription('Enable or disable leave messages')
        .addBooleanOption(option =>
          option.setName('enable')
            .setDescription('Enable or disable leave messages')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-welcome-message')
        .setDescription('Set a custom welcome message')
        .addStringOption(option =>
          option.setName('message')
            .setDescription('The welcome message (use {user} and {memberCount} as placeholders)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-matchmaking-role')
        .setDescription('Set the Discord role to mention in matchmaking embeds')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The Discord role to assign to matchmaking notifications')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('get-matchmaking-role')
        .setDescription('Get the currently set matchmaking role'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-leave-message')
        .setDescription('Set a custom leave message')
        .addStringOption(option =>
          option.setName('message')
            .setDescription('The leave message (use {user} as a placeholder)')
            .setRequired(true))),

    


  /**
   * Execute the command in response to an interaction.
   * @param {Interaction} interaction - The Discord interaction.
   */
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'set-role') {
      const level = interaction.options.getInteger('level');
      const role = interaction.options.getRole('role');

      if (level < 1) {
        return interaction.reply({
          content: '❌ Level must be at least 1.',
          flags: MessageFlags.Ephemeral,
        });
      }

      await settingsService.setRoleForLevel(level, role.id);
      await auditService.logAction(interaction.user.id, 'settings:set-role', { level, role: role.id });
      return interaction.reply({
        content: `✅ Role <@&${role.id}> has been set for Level ${level}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === 'remove-role') {
      const level = interaction.options.getInteger('level');

      if (level < 1) {
        return interaction.reply({
          content: '❌ Level must be at least 1.',
          flags: MessageFlags.Ephemeral,
        });
      }

      await settingsService.setRoleForLevel(level, null);
      await auditService.logAction(interaction.user.id, 'settings:remove-role', { level });
      return interaction.reply({
        content: `✅ Role for Level ${level} has been removed.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === 'get-roles') {
      const roleMap = await settingsService.getAllRoleMappings();
      if (Object.keys(roleMap).length === 0) {
        return interaction.reply({
          content: '📋 No role mappings have been set.',
          flags: MessageFlags.Ephemeral,
        });
      }

      let response = '📋 **Role Mappings:**\n';
      for (const [level, roleId] of Object.entries(roleMap)) {
        response += `**Level ${level}:** <@&${roleId}>\n`;
      }

      return interaction.reply({
        content: response,
        flags: MessageFlags.Ephemeral,
      });
    }

    // New subcommands for Notifications
    if (subcommand === 'set-notification-channel') {
      const channel = interaction.options.getChannel('channel');

      if (!channel.isTextBased()) {
        return interaction.reply({
          content: '❌ Please select a text-based channel.',
          flags: MessageFlags.Ephemeral,
        });
      }

      await settingsService.setSetting('notificationChannelId', channel.id);
      await auditService.logAction(interaction.user.id, 'settings:set-notification-channel', { channel: channel.id });
      return interaction.reply({
        content: `✅ Notification channel has been set to ${channel}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === 'toggle-welcome') {
      const enable = interaction.options.getBoolean('enable');
      await settingsService.setSetting('welcomeEnabled', enable);
      await auditService.logAction(interaction.user.id, 'settings:toggle-welcome', { enable });
      return interaction.reply({
        content: `✅ Welcome messages have been ${enable ? 'enabled' : 'disabled'}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === 'toggle-leave') {
      const enable = interaction.options.getBoolean('enable');
      await settingsService.setSetting('leaveEnabled', enable);
      await auditService.logAction(interaction.user.id, 'settings:toggle-leave', { enable });
      return interaction.reply({
        content: `✅ Leave messages have been ${enable ? 'enabled' : 'disabled'}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === 'set-welcome-message') {
      const message = interaction.options.getString('message');

      // Optional: Validate placeholders
      if (!message.includes('{user}') || !message.includes('{memberCount}')) {
        return interaction.reply({
          content: '❌ The welcome message must include `{user}` and `{memberCount}` placeholders.',
          flags: MessageFlags.Ephemeral,
        });
      }

      await settingsService.setSetting('welcomeMessage', message);
      await auditService.logAction(interaction.user.id, 'settings:set-welcome-message');
      return interaction.reply({
        content: '✅ Welcome message has been updated.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === 'set-leave-message') {
      const message = interaction.options.getString('message');

      // Optional: Validate placeholders
      if (!message.includes('{user}')) {
        return interaction.reply({
          content: '❌ The leave message must include `{user}` placeholder.',
          flags: MessageFlags.Ephemeral,
        });
      }

      await settingsService.setSetting('leaveMessage', message);
      await auditService.logAction(interaction.user.id, 'settings:set-leave-message');
      return interaction.reply({
        content: '✅ Leave message has been updated.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },

  /**
   * Execute the command programmatically without an interaction.
   * @param {Object} args - Arguments for the command.
   */
  async executeScheduled(args) {
    try {
      const { subcommand, level, roleId } = args;

      if (subcommand === 'set-role') {
        if (!level || !roleId) throw new Error('Missing "level" or "roleId" arguments.');

        if (level < 1) {
          console.warn(`Scheduled Execution: Level must be at least 1.`);
          return;
        }

        await settingsService.setRoleForLevel(level, roleId);
        console.log(`Scheduled Execution: Role <@&${roleId}> has been set for Level ${level}.`);
      }

      if (subcommand === 'remove-role') {
        if (!level) throw new Error('Missing "level" argument.');

        if (level < 1) {
          console.warn(`Scheduled Execution: Level must be at least 1.`);
          return;
        }

        await settingsService.setRoleForLevel(level, null);
        console.log(`Scheduled Execution: Role for Level ${level} has been removed.`);
      }
      if (subcommand === 'set-matchmaking-role') {
        if (!roleId) throw new Error('Missing "roleId" argument.');

        await settingsService.setSetting('matchmakingRoleId', roleId);
        console.log(`Scheduled Execution: The matchmaking role has been set to <@&${roleId}>.`);
      }

      if (subcommand === 'get-matchmaking-role') {
        const currentRoleId = await settingsService.getSetting('matchmakingRoleId');
        if (currentRoleId) {
          console.log(`Scheduled Execution: The current matchmaking role is <@&${currentRoleId}>.`);
        } else {
          console.log('Scheduled Execution: No matchmaking role has been set yet.');
        }
      }


      if (subcommand === 'get-roles') {
        const roleMap = await settingsService.getAllRoleMappings();
        if (Object.keys(roleMap).length === 0) {
          console.log('Scheduled Execution: No role mappings have been set.');
          return;
        }

        let response = '📋 **Role Mappings:**\n';
        for (const [level, roleId] of Object.entries(roleMap)) {
          response += `**Level ${level}:** <@&${roleId}>\n`;
        }

        console.log(`Scheduled Execution:\n${response}`);
      }
    } catch (error) {
      errorHandler(error, 'Schedule Command - executeScheduled');
    }
  },
};
