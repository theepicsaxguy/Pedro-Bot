// utils/threadManager.js
const errorHandler = require('./errorHandler');

module.exports = {
  async createThread(message, name, options = {}) {
    try {
      const thread = await message.startThread({
        name,
        autoArchiveDuration: options.autoArchiveDuration || 60,
        reason: options.reason || 'Matchmaking thread',
      });
      return thread;
    } catch (error) {
      errorHandler(error, 'Thread Manager - createThread');
      throw error;
    }
  },

  async addMemberToThread(thread, userId) {
    try {
      await thread.members.add(userId);
    } catch (error) {
      errorHandler(error, 'Thread Manager - addMemberToThread');
    }
  },

  async removeMemberFromThread(thread, userId) {
    try {
      await thread.members.remove(userId);
    } catch (error) {
      errorHandler(error, 'Thread Manager - removeMemberFromThread');
    }
  },

  async sendMessageToThread(thread, content) {
    try {
      await thread.send(content);
    } catch (error) {
      errorHandler(error, 'Thread Manager - sendMessageToThread');
    }
  },
};
