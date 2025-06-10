const LobbyHistory = require('../models/LobbyHistory');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  async addHistory(data) {
    try {
      const history = new LobbyHistory(data);
      await history.save();
      return history;
    } catch (error) {
      errorHandler(error, 'History Service - addHistory');
      throw error;
    }
  },
};
