// services/settingsService.js
const Settings = require('../models/Settings');
const cache = require('../utils/cache');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  /**
   * Get a setting by key.
   * @param {String} key - The setting key.
   * @returns {Promise<Any>}
   */
  async getSetting(key) {
    try {
      const cacheKey = `setting:${key}`;
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const setting = await Settings.findOne({ key }).lean().exec();
      if (setting) {
        await cache.set(cacheKey, JSON.stringify(setting.value));
        return setting.value;
      }
      return null;
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
      const setting = await Settings.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      ).lean().exec();

      await cache.set(`setting:${key}`, JSON.stringify(setting.value));
      return setting;
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
      return await this.getSetting(`levelRole_${level}`);
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
      const result = await this.setSetting(`levelRole_${level}`, roleId);
      await cache.del('setting:roleMap'); // Invalidate the aggregated cache
      return result;
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
      const cacheKey = 'setting:roleMap';
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const mappings = await Settings.find({ key: /^levelRole_/ }).lean().exec();
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
