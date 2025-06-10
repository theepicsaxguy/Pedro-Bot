// services/historyService.js
const LobbyHistory = require('../models/LobbyHistory');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  async recordLobby(data) {
    try {
      const history = new LobbyHistory(data);
      await history.save();
      return history;
    } catch (error) {
      errorHandler(error, 'History Service - recordLobby');
      throw error;
    }
  },

  async getLobbyStats() {
    try {
      const total = await LobbyHistory.countDocuments().exec();
      return { total };
    } catch (error) {
      errorHandler(error, 'History Service - getLobbyStats');
      return { total: 0 };
    }
  },
};
