// services/scheduleService.js
const Schedule = require('../models/Schedule');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  /**
   * Create a new schedule.
   * @param {String} name - Unique name for the schedule.
   * @param {String} commandName - Name of the command to execute.
   * @param {Object} args - Arguments for the command.
   * @param {String} frequency - Cron expression defining the schedule frequency.
   * @returns {Promise<Object>}
   */
  async createSchedule(name, commandName, args, frequency) {
    try {
      const existing = await Schedule.findOne({ name });
      if (existing) {
        throw new Error(`A schedule with the name "${name}" already exists.`);
      }

      const schedule = new Schedule({ name, commandName, args, frequency });
      await schedule.save();
      return schedule;
    } catch (error) {
      errorHandler(error, 'Schedule Service - createSchedule');
      throw error;
    }
  },

  /**
   * Retrieve all schedules.
   * @returns {Promise<Array>}
   */
  async getAllSchedules() {
    try {
      return await Schedule.find().exec();
    } catch (error) {
      errorHandler(error, 'Schedule Service - getAllSchedules');
      throw error;
    }
  },

  /**
   * Retrieve a schedule by name.
   * @param {String} name - Name of the schedule.
   * @returns {Promise<Object|null>}
   */
  async getScheduleByName(name) {
    try {
      return await Schedule.findOne({ name }).exec();
    } catch (error) {
      errorHandler(error, 'Schedule Service - getScheduleByName');
      throw error;
    }
  },

  /**
   * Delete a schedule by name.
   * @param {String} name - Name of the schedule to delete.
   * @returns {Promise<Object|null>}
   */
  async deleteSchedule(name) {
    try {
      return await Schedule.findOneAndDelete({ name }).exec();
    } catch (error) {
      errorHandler(error, 'Schedule Service - deleteSchedule');
      throw error;
    }
  },
};
