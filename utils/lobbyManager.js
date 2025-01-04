const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, 'lobbyData.json');
let lobbyMap = new Map();

// Load existing lobby data from file on startup
if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath);
    const parsedData = JSON.parse(fileData);
    lobbyMap = new Map(Object.entries(parsedData));
    console.log(`[INFO] Loaded lobby data from file:`, parsedData);
}

function saveLobbiesToFile() {
    const data = Object.fromEntries(lobbyMap);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`[INFO] Lobby data saved to file.`);
}

module.exports = {
    getLobby: (id) => {
        console.log(`[INFO] Retrieving lobby for id: ${id}`);
        return lobbyMap.get(id);
    },
    setLobby: (id, data) => {
        console.log(`[INFO] Setting lobby for id: ${id}`);
        lobbyMap.set(id, data);
        saveLobbiesToFile();
    },
    deleteLobby: (id) => {
        console.log(`[INFO] Deleting lobby for id: ${id}`);
        lobbyMap.delete(id);
        saveLobbiesToFile();
    },
};
