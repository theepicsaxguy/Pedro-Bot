// commands/admin/settings.command.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const settingsService = require('../../services/settingsService');
const config = require('../../config/constants');
const errorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Manage bot settings')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
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
        .setDescription('Get all role mappings for user levels')),

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
          ephemeral: true,
        });
      }

      await settingsService.setRoleForLevel(level, role.id);
      return interaction.reply({
        content: `✅ Role <@&${role.id}> has been set for Level ${level}.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'remove-role') {
      const level = interaction.options.getInteger('level');

      if (level < 1) {
        return interaction.reply({
          content: '❌ Level must be at least 1.',
          ephemeral: true,
        });
      }

      await settingsService.setRoleForLevel(level, null);
      return interaction.reply({
        content: `✅ Role for Level ${level} has been removed.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'get-roles') {
      const roleMap = await settingsService.getAllRoleMappings();
      if (Object.keys(roleMap).length === 0) {
        return interaction.reply({
          content: '📋 No role mappings have been set.',
          ephemeral: true,
        });
      }

      let response = '📋 **Role Mappings:**\n';
      for (const [level, roleId] of Object.entries(roleMap)) {
        response += `**Level ${level}:** <@&${roleId}>\n`;
      }

      return interaction.reply({
        content: response,
        ephemeral: true,
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
