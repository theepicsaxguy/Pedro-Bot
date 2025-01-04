// utils/lobbyManager.js

const lobbyMap = new Map();

module.exports = {
    getLobby: (id) => lobbyMap.get(id),
    setLobby: (id, data) => lobbyMap.set(id, data),
    deleteLobby: (id) => lobbyMap.delete(id),
    // Additional helper functions as needed
};
