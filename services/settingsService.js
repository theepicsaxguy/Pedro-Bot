// services/settingsService.js
const Settings = require('../models/Settings');
const errorHandler = require('../utils/errorHandler');
const cache = require('../utils/cache');

module.exports = {
  /**
   * Get a setting by key.
   * @param {String} key - The setting key.
   * @returns {Promise<Any>}
   */
  async getSetting(key) {
    try {
      const cached = await cache.get(`setting:${key}`);
      if (cached !== null) return JSON.parse(cached);
      const setting = await Settings.findOne({ key }).exec();
      const value = setting ? setting.value : null;
      if (value !== null) await cache.set(`setting:${key}`, JSON.stringify(value));
      return value;
    } catch (error) {
      errorHandler(error, 'Settings Service - getSetting');
      return null;
    }
  },

  /**
   * Set a setting by key.
   * @param {String} key - The setting key.
   * @param {Any} value - The value to set.
   * @returns {Promise<Object>}
   */
  async setSetting(key, value) {
    try {
      const doc = await Settings.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      ).exec();
      await cache.set(`setting:${key}`, JSON.stringify(doc.value));
      return doc;
    } catch (error) {
      errorHandler(error, 'Settings Service - setSetting');
      throw error;
    }
  },

  /**
   * Get role ID by level.
   * @param {Number} level - The user level.
   * @returns {Promise<String|null>}
   */
  async getRoleByLevel(level) {
    try {
      return await module.exports.getSetting(`levelRole_${level}`);
    } catch (error) {
      errorHandler(error, 'Settings Service - getRoleByLevel');
      return null;
    }
  },

  /**
   * Set role ID for a specific level.
   * @param {Number} level - The user level.
   * @param {String} roleId - The Discord role ID.
   * @returns {Promise<Object>}
   */
  async setRoleForLevel(level, roleId) {
    try {
      const doc = await Settings.findOneAndUpdate(
        { key: `levelRole_${level}` },
        { value: roleId },
        { upsert: true, new: true }
      ).exec();
      await cache.set(`setting:levelRole_${level}`, JSON.stringify(doc.value));
      return doc;
    } catch (error) {
      errorHandler(error, 'Settings Service - setRoleForLevel');
      throw error;
    }
  },

  /**
   * Get all role mappings.
   * @returns {Promise<Object>}
   */
  async getAllRoleMappings() {
    try {
      const cacheKey = 'roleMappings';
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached);
      const mappings = await Settings.find({ key: /^levelRole_/ }).exec();
      const roleMap = {};
      mappings.forEach(mapping => {
        const level = mapping.key.replace('levelRole_', '');
        roleMap[level] = mapping.value;
      });
      await cache.set(cacheKey, JSON.stringify(roleMap));
      return roleMap;
    } catch (error) {
      errorHandler(error, 'Settings Service - getAllRoleMappings');
      return {};
    }
  },
};
