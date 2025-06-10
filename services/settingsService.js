// services/settingsService.js
const Settings = require('../models/Settings');
const errorHandler = require('../utils/errorHandler');
const redis = require('../utils/redisClient');

module.exports = {
  /**
   * Get a setting by key.
   * @param {String} key - The setting key.
   * @returns {Promise<Any>}
   */
  async getSetting(key) {
    try {
      const cacheKey = `setting:${key}`;
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const setting = await Settings.findOne({ key }).exec();
      if (setting) await redis.set(cacheKey, JSON.stringify(setting.value));
      return setting ? setting.value : null;
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
      const updated = await Settings.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      ).exec();
      await redis.set(`setting:${key}`, JSON.stringify(value));
      if (key.startsWith('levelRole_')) {
        const level = key.replace('levelRole_', '');
        await redis.set(`levelRole:${level}`, value);
        const mappings = await redis.get('roleMappings');
        if (mappings) {
          const mapObj = JSON.parse(mappings);
          mapObj[level] = value;
          await redis.set('roleMappings', JSON.stringify(mapObj));
        }
      }
      return updated;
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
      const cacheKey = `levelRole:${level}`;
      const cached = await redis.get(cacheKey);
      if (cached) return cached;

      const setting = await Settings.findOne({ key: `levelRole_${level}` }).exec();
      if (setting) await redis.set(cacheKey, setting.value);
      return setting ? setting.value : null;
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
      const updated = await Settings.findOneAndUpdate(
        { key: `levelRole_${level}` },
        { value: roleId },
        { upsert: true, new: true }
      ).exec();
      await redis.set(`levelRole:${level}`, roleId);
      const mappings = await redis.get('roleMappings');
      if (mappings) {
        const mapObj = JSON.parse(mappings);
        mapObj[level] = roleId;
        await redis.set('roleMappings', JSON.stringify(mapObj));
      }
      return updated;
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
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const mappings = await Settings.find({ key: /^levelRole_/ }).exec();
      const roleMap = {};
      mappings.forEach(mapping => {
        const level = mapping.key.replace('levelRole_', '');
        roleMap[level] = mapping.value;
      });
      await redis.set(cacheKey, JSON.stringify(roleMap));
      return roleMap;
    } catch (error) {
      errorHandler(error, 'Settings Service - getAllRoleMappings');
      return {};
    }
  },
};
