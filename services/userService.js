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
};
