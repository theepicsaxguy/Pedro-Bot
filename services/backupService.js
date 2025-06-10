const fs = require('fs/promises');
const path = require('path');
const Settings = require('../models/Settings');
const ReactionRole = require('../models/ReactionRole');
const Lobby = require('../models/Lobby');
const Schedule = require('../models/Schedule');
const UserXP = require('../models/UserXP');
const errorHandler = require('../utils/errorHandler');

module.exports = {
  async createBackup() {
    try {
      const backup = {
        settings: await Settings.find().lean(),
        reactionRoles: await ReactionRole.find().lean(),
        lobbies: await Lobby.find().lean(),
        schedules: await Schedule.find().lean(),
        userXP: await UserXP.find().lean(),
      };
      await fs.mkdir('backups', { recursive: true });
      const filePath = path.join('backups', `backup-${Date.now()}.json`);
      await fs.writeFile(filePath, JSON.stringify(backup, null, 2));
      return filePath;
    } catch (error) {
      errorHandler(error, 'Backup Service - createBackup');
      throw error;
    }
  },

  async restoreBackup(file) {
    try {
      const data = JSON.parse(await fs.readFile(file, 'utf8'));
      await Promise.all([
        Settings.deleteMany({}),
        ReactionRole.deleteMany({}),
        Lobby.deleteMany({}),
        Schedule.deleteMany({}),
        UserXP.deleteMany({}),
      ]);
      if (data.settings) await Settings.insertMany(data.settings);
      if (data.reactionRoles) await ReactionRole.insertMany(data.reactionRoles);
      if (data.lobbies) await Lobby.insertMany(data.lobbies);
      if (data.schedules) await Schedule.insertMany(data.schedules);
      if (data.userXP) await UserXP.insertMany(data.userXP);
    } catch (error) {
      errorHandler(error, 'Backup Service - restoreBackup');
      throw error;
    }
  },
};
