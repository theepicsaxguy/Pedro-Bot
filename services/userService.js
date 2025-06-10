// services/userService.js
const UserXP = require('../models/UserXP');
const cache = require('../utils/cache');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  /**
   * Fetch a user by ID (returns a document or null).
   * @param {String} id - The user ID.
   * @returns {Promise<Object|null>}
   */
  async getUser(id) {
    try {
      const cacheKey = `user:${id}`;
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const user = await UserXP.findById(id).lean().exec();
      if (user) {
        await cache.set(cacheKey, JSON.stringify(user));
      }
      return user;
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
      const user = await UserXP.findByIdAndUpdate(
        id,
        { _id: id, ...data },
        { upsert: true, new: true }
      ).lean().exec();

      await cache.set(`user:${id}`, JSON.stringify(user));
      return user;
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
      await cache.del(`user:${id}`);
      return await UserXP.findByIdAndDelete(id).exec();
    } catch (error) {
      errorHandler(error, 'User Service - deleteUser');
      throw error;
    }
  },
};
