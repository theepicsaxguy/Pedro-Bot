// commands/admin/schedule.command.js
const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const scheduleService = require('../../services/scheduleService');
const scheduler = require('../../utils/scheduler');
const errorHandler = require('../../utils/errorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Manage scheduled command executions')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new schedule')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Unique name for the schedule')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('command')
            .setDescription('Name of the command to execute')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('args')
            .setDescription('JSON string of arguments for the command')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('frequency')
            .setDescription('Cron expression for the schedule frequency (e.g., "0 * * * *")')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all schedules'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete an existing schedule')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Name of the schedule to delete')
            .setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      const name = interaction.options.getString('name');
      const commandName = interaction.options.getString('command');
      const argsString = interaction.options.getString('args') || '{}';
      const frequency = interaction.options.getString('frequency');

      let args;
      try {
        args = JSON.parse(argsString);
      } catch (err) {
        return interaction.reply({
          content: '❌ Invalid JSON format for arguments.',
          ephemeral: true,
        });
      }

      try {
        const schedule = await scheduleService.createSchedule(name, commandName, args, frequency);
        // Schedule the command execution
        scheduler.scheduleCommand(schedule);
        await interaction.reply({
          content: `✅ Schedule "${name}" has been created and scheduled.`,
          ephemeral: true,
        });
      } catch (error) {
        errorHandler(error, 'Schedule Command - create');
        await interaction.reply({
          content: `❌ Error creating schedule: ${error.message}`,
          ephemeral: true,
        });
      }
    }

    if (subcommand === 'list') {
      try {
        const schedules = await scheduleService.getAllSchedules();
        if (schedules.length === 0) {
          return interaction.reply({
            content: '📋 No schedules have been created.',
            ephemeral: true,
          });
        }

        let response = '📋 **Scheduled Commands:**\n';
        schedules.forEach(schedule => {
          response += `**Name:** ${schedule.name}\n` +
                      `**Command:** /${schedule.commandName}\n` +
                      `**Arguments:** ${JSON.stringify(schedule.args)}\n` +
                      `**Frequency:** ${schedule.frequency}\n\n`;
        });

        return interaction.reply({
          content: response,
          ephemeral: true,
        });
      } catch (error) {
        errorHandler(error, 'Schedule Command - list');
        await interaction.reply({
          content: '❌ There was an error fetching the schedules.',
          ephemeral: true,
        });
      }
    }

    if (subcommand === 'delete') {
      const name = interaction.options.getString('name');

      try {
        const schedule = await scheduleService.getScheduleByName(name);
        if (!schedule) {
          return interaction.reply({
            content: `🔴 No schedule found with the name "${name}".`,
            ephemeral: true,
          });
        }

        // Unschedule the command
        scheduler.unscheduleCommand(name);

        await scheduleService.deleteSchedule(name);
        await interaction.reply({
          content: `✅ Schedule "${name}" has been deleted and unscheduled.`,
          ephemeral: true,
        });
      } catch (error) {
        errorHandler(error, 'Schedule Command - delete');
        await interaction.reply({
          content: `❌ Error deleting schedule: ${error.message}`,
          ephemeral: true,
        });
      }
    }
  },
};
