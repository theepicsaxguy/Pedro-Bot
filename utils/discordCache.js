const guilds = new Map();
const channels = new Map();
const roles = new Map();

module.exports = {
  async getGuild(client, id) {
    if (guilds.has(id)) return guilds.get(id);
    const guild = await client.guilds.fetch(id);
    guilds.set(id, guild);
    return guild;
  },

  async getChannel(client, id) {
    if (channels.has(id)) return channels.get(id);
    const channel = await client.channels.fetch(id);
    channels.set(id, channel);
    return channel;
  },

  async getRole(guild, id) {
    if (roles.has(id)) return roles.get(id);
    const role = await guild.roles.fetch(id);
    roles.set(id, role);
    return role;
  },
};
