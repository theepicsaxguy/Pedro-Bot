// services/userService.js
const UserXP = require('../models/UserXP');
const errorHandler = require('../utils/errorHandler');
const cache = require('../utils/cache');

module.exports = {
  /**
   * Fetch a user by ID (returns a document or null).
   * @param {String} id - The user ID.
   * @returns {Promise<Object|null>}
   */
  async getUser(id) {
    try {
      const cached = await cache.get(`user:${id}`);
      if (cached) return JSON.parse(cached);
      const doc = await UserXP.findById(id).exec();
      if (doc) await cache.set(`user:${id}`, JSON.stringify(doc));
      return doc;
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
      const doc = await UserXP.findByIdAndUpdate(
        id,
        { _id: id, ...data },
        { upsert: true, new: true }
      ).exec();
      await cache.set(`user:${id}`, JSON.stringify(doc));
      return doc;
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
      const doc = await UserXP.findByIdAndDelete(id).exec();
      await cache.del(`user:${id}`);
      return doc;
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
      const cacheKey = `topUsers:${limit}:${skip}`;
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached);
      const users = await UserXP.find({})
        .sort({ xp: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
      await cache.setEx(cacheKey, 60, JSON.stringify(users));
      return users;
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
      const cacheKey = 'userCount';
      const cached = await cache.get(cacheKey);
      if (cached) return Number(cached);
      const count = await UserXP.countDocuments().exec();
      await cache.setEx(cacheKey, 60, String(count));
      return count;
    } catch (error) {
      errorHandler(error, 'User Service - getUserCount');
      return 0;
    }
  },

  async getUserRank(id) {
    try {
      const result = await UserXP.aggregate([
        { $match: { _id: id } },
        {
          $lookup: {
            from: "userxps",
            let: { userXP: "$xp" },
            pipeline: [
              { $match: { $expr: { $gt: ["$xp", "$$userXP"] } } },
              { $count: "betterCount" }
            ],
            as: "betterUsers"
          }
        },
        {
          $addFields: {
            rank: {
              $add: [
                { $arrayElemAt: ["$betterUsers.betterCount", 0] },
                1
              ]
            }
          }
        },
        { $project: { rank: 1 } }
      ]).exec();
      return result.length > 0 ? result[0].rank : 0;
    } catch (error) {
      errorHandler(error, 'User Service - getUserRank');
      return 0;
    }
  },
};
