// services/lobbyService.js
const Lobby = require('../models/Lobby');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  /**
   * Fetch a lobby by ID (returns a document or null).
   * @param {String} id - The lobby ID (message ID).
   * @returns {Promise<Object|null>}
   */
  async getLobby(id) {
    try {
      return await Lobby.findById(id).exec();
    } catch (error) {
      errorHandler(error, 'Lobby Service - getLobby');
      return null;
    }
  },

  /**
   * Upsert a lobby document based on the ID.
   * @param {String} id - The lobby ID (message ID).
   * @param {Object} data - The lobby data to update.
   * @returns {Promise<Object>}
   */
  async setLobby(id, data) {
    try {
      return await Lobby.findByIdAndUpdate(
        id,
        { _id: id, ...data },
        { upsert: true, new: true }
      ).exec();
    } catch (error) {
      errorHandler(error, 'Lobby Service - setLobby');
      throw error;
    }
  },

  /**
   * Delete a lobby by ID.
   * @param {String} id - The lobby ID (message ID).
   * @returns {Promise<Object|null>}
   */
  async deleteLobby(id) {
    try {
      return await Lobby.findByIdAndDelete(id).exec();
    } catch (error) {
      errorHandler(error, 'Lobby Service - deleteLobby');
      throw error;
    }
  },

  async getActiveLobbyCount() {
    try {
      return await Lobby.countDocuments({ started: false }).exec();
    } catch (error) {
      errorHandler(error, 'Lobby Service - getActiveLobbyCount');
      return 0;
    }
  },
};
