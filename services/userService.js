// services/userService.js
const UserXP = require('../models/UserXP');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  /**
   * Fetch a user by ID (returns a document or null).
   * @param {String} id - The user ID.
   * @returns {Promise<Object|null>}
   */
  async getUser(id) {
    try {
      return await UserXP.findById(id).exec();
    } catch (error) {
      errorHandler(error, 'User Service - getUser');
      return null;
    }
  },

  /**
   * Upsert a user document based on the ID.
   * @param {String} id - The user ID.
   * @param {Object} data - The user data to update.
   * @returns {Promise<Object>}
   */
  async setUser(id, data) {
    try {
      return await UserXP.findByIdAndUpdate(
        id,
        { _id: id, ...data },
        { upsert: true, new: true }
      ).exec();
    } catch (error) {
      errorHandler(error, 'User Service - setUser');
      throw error;
    }
  },

  /**
   * Delete a user by ID.
   * @param {String} id - The user ID.
   * @returns {Promise<Object|null>}
   */
  async deleteUser(id) {
    try {
      return await UserXP.findByIdAndDelete(id).exec();
    } catch (error) {
      errorHandler(error, 'User Service - deleteUser');
      throw error;
    }
  },

  /**
   * Get top users ordered by XP.
   * @param {Number} limit - Number of users to return.
   * @param {Number} skip - How many users to skip.
   * @returns {Promise<Array>}
   */
  async getTopUsers(limit, skip) {
    try {
      return await UserXP.find({})
        .sort({ xp: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      errorHandler(error, 'User Service - getTopUsers');
      return [];
    }
  },

  /**
   * Count all users with XP records.
   * @returns {Promise<Number>}
   */
  async getUserCount() {
    try {
      return await UserXP.countDocuments().exec();
    } catch (error) {
      errorHandler(error, 'User Service - getUserCount');
      return 0;
    }
  },
};
