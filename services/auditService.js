const AuditLog = require('../models/AuditLog');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  async logAction(adminId, action, details = {}) {
    try {
      const log = new AuditLog({ adminId, action, details });
      await log.save();
      return log;
    } catch (error) {
      errorHandler(error, 'Audit Service - logAction');
      throw error;
    }
  },

  async getLogs(limit = 50, skip = 0) {
    try {
      return await AuditLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      errorHandler(error, 'Audit Service - getLogs');
      return [];
    }
  },
};
