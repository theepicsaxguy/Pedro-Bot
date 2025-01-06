// utils/scheduler.js
const schedule = require('node-schedule');
const lobbyService = require('../services/lobbyService');
const { updateLobbyEmbed } = require('../utils/matchmakingHelpers.js');
const ButtonManager = require('./ButtonManager');
const errorHandler = require('./errorHandler');

class Scheduler {
  constructor() {
    this.jobs = new Map();
  }

  scheduleLobbyStart(lobbyId, matchTime, message) {
    const job = schedule.scheduleJob(matchTime, async () => {
      try {
        const lobbyData = await lobbyService.getLobby(lobbyId);
        if (lobbyData && !lobbyData.started) {
          lobbyData.started = true;
          lobbyData.embed.title = 'Matchmaking Lobby (Started)';
          await lobbyService.setLobby(lobbyId, lobbyData);

          await message.edit({
            embeds: [lobbyData.embed],
            components: [ButtonManager.createButtonRow(['join', 'leave'])],
            allowedMentions: { parse: ['roles'] },
          });
          console.log(`[✅] Lobby ${lobbyId} has started.`);
          this.jobs.delete(lobbyId);
        }
      } catch (error) {
        errorHandler(error, 'Scheduler - scheduleLobbyStart');
      }
    });

    this.jobs.set(lobbyId, job);
  }

  cancelLobbyStart(lobbyId) {
    const job = this.jobs.get(lobbyId);
    if (job) {
      job.cancel();
      this.jobs.delete(lobbyId);
      console.log(`[ℹ️] Scheduled job for Lobby ${lobbyId} has been canceled.`);
    }
  }
}

module.exports = new Scheduler();