const AdminLog = require('../models/AdminLog');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  async logAction(userId, action, details = {}) {
    try {
      await AdminLog.create({ userId, action, details });
    } catch (error) {
      errorHandler(error, 'AdminLog Service - logAction');
    }
  },
};
