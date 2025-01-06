// services/settingsService.js
const Settings = require('../models/Settings');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  /**
   * Get a setting by key.
   * @param {String} key - The setting key.
   * @returns {Promise<Any>}
   */
  async getSetting(key) {
    try {
      const setting = await Settings.findOne({ key }).exec();
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
      return await Settings.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      ).exec();
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
      const setting = await Settings.findOne({ key: `levelRole_${level}` }).exec();
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
      return await Settings.findOneAndUpdate(
        { key: `levelRole_${level}` },
        { value: roleId },
        { upsert: true, new: true }
      ).exec();
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
      const mappings = await Settings.find({ key: /^levelRole_/ }).exec();
      const roleMap = {};
      mappings.forEach(mapping => {
        const level = mapping.key.replace('levelRole_', '');
        roleMap[level] = mapping.value;
      });
      return roleMap;
    } catch (error) {
      errorHandler(error, 'Settings Service - getAllRoleMappings');
      return {};
    }
  },
};
