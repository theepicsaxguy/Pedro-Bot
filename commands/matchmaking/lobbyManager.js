// commands/matchmaking/lobbyManager.js
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, 'lobbyData.json');
let lobbyMap = new Map();

if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath);
    const parsedData = JSON.parse(fileData);
    lobbyMap = new Map(Object.entries(parsedData));
}

function saveLobbiesToFile() {
    const data = Object.fromEntries(lobbyMap);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
    getLobby: (id) => {
        return lobbyMap.get(id);
    },
    setLobby: (id, data) => {
        lobbyMap.set(id, data);
        saveLobbiesToFile();
    },
    deleteLobby: (id) => {
        lobbyMap.delete(id);
        saveLobbiesToFile();
    },
};
