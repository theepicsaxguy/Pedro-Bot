// utils/scheduler.js
const cron = require('node-cron');
const scheduleService = require('../services/scheduleService');
const errorHandler = require('./errorHandler');

class Scheduler {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Initialize the scheduler by loading all schedules from the database and scheduling them.
   * @param {Client} client - The Discord client instance.
   */
  async initialize(client) {
    this.client = client;

    try {
      const schedules = await scheduleService.getAllSchedules();
      schedules.forEach(schedule => {
        this.scheduleCommand(schedule);
      });
      console.log(`[ℹ️] Scheduler initialized with ${schedules.length} schedules.`);
    } catch (error) {
      errorHandler(error, 'Scheduler - initialize');
    }

    // Listen for commandExecution event
    this.client.on('commandExecution', this.executeScheduledCommand.bind(this));
  }

  /**
   * Schedule a command based on the schedule object.
   * @param {Object} schedule - The schedule object from the database.
   */
  scheduleCommand(schedule) {
    try {
      if (!cron.validate(schedule.frequency)) {
        console.warn(`[⚠️] Invalid cron expression "${schedule.frequency}" for schedule "${schedule.name}". Skipping.`);
        return;
      }

      const task = cron.schedule(schedule.frequency, () => {
        this.client.emit('commandExecution', schedule.commandName, schedule.args);
      });

      this.jobs.set(schedule.name, task);
      console.log(`[✅] Scheduled command "/${schedule.commandName}" with name "${schedule.name}" and frequency "${schedule.frequency}".`);
    } catch (error) {
      errorHandler(error, `Scheduler - scheduleCommand "${schedule.name}"`);
    }
  }

  /**
   * Unschedule a command based on the schedule name.
   * @param {String} name - The unique name of the schedule to unschedule.
   */
  unscheduleCommand(name) {
    try {
      const task = this.jobs.get(name);
      if (task) {
        task.stop();
        this.jobs.delete(name);
        console.log(`[✅] Unschedule command with name "${name}".`);
      } else {
        console.warn(`[⚠️] No scheduled task found with name "${name}".`);
      }
    } catch (error) {
      errorHandler(error, `Scheduler - unscheduleCommand "${name}"`);
    }
  }

  /**
   * Execute a scheduled command.
   * @param {String} commandName - The name of the command to execute.
   * @param {Object} args - The arguments for the command.
   */
  async executeScheduledCommand(commandName, args) {
    try {
      const command = this.client.commands.get(commandName);
      if (!command) {
        console.warn(`[⚠️] Command "/${commandName}" not found for scheduled execution.`);
        return;
      }

      if (typeof command.executeScheduled === 'function') {
        await command.executeScheduled(args);
        console.log(`[✅] Executed scheduled command "/${commandName}" with args: ${JSON.stringify(args)}`);
      } else {
        console.warn(`[⚠️] Command "/${commandName}" does not have an executeScheduled method.`);
      }
    } catch (error) {
      errorHandler(error, `Scheduler - executeScheduledCommand "${commandName}"`);
    }
  }
}

module.exports = new Scheduler();
