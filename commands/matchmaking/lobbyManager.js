// commands/matchmaking/lobbyManager.js
const LobbyModel = require('../../../models/Lobby');

module.exports = {
  /**
   * Fetch a lobby by ID (returns a doc or null).
   */
  async getLobby(id) {
    return await LobbyModel.findById(id).exec();
  },

  /**
   * Upsert a lobby doc based on the ID.
   */
  async setLobby(id, data) {
    return await LobbyModel.findByIdAndUpdate(
      id,
      { _id: id, ...data },
      { upsert: true, new: true }
    ).exec();
  },

  /**
   * Delete a lobby by ID.
   */
  async deleteLobby(id) {
    return await LobbyModel.findByIdAndDelete(id).exec();
  },
};
