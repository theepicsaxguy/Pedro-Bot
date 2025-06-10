const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const backupService = require('../../services/backupService');
const auditService = require('../../services/auditService');
const errorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Create or restore a backup')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand(sc => sc.setName('create').setDescription('Create a backup'))
    .addSubcommand(sc =>
      sc.setName('restore')
        .setDescription('Restore from a backup')
        .addStringOption(o =>
          o.setName('file')
            .setDescription('Backup file path')
            .setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      try {
        const file = await backupService.createBackup();
        await auditService.logAction(interaction.user.id, 'backup:create', { file });
        await interaction.reply({ content: `✅ Backup created at ${file}`, flags: MessageFlags.Ephemeral });
      } catch (error) {
        errorHandler(error, 'Backup Command - create');
        await interaction.reply({ content: '❌ Error creating backup.', flags: MessageFlags.Ephemeral });
      }
    }

    if (subcommand === 'restore') {
      const file = interaction.options.getString('file');
      try {
        await backupService.restoreBackup(file);
        await auditService.logAction(interaction.user.id, 'backup:restore', { file });
        await interaction.reply({ content: '✅ Backup restored.', flags: MessageFlags.Ephemeral });
      } catch (error) {
        errorHandler(error, 'Backup Command - restore');
        await interaction.reply({ content: '❌ Error restoring backup.', flags: MessageFlags.Ephemeral });
      }
    }
  },
};
