const channels = new Map();
const guilds = new Map();
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
    const key = `${guild.id}:${id}`;
    if (roles.has(key)) return roles.get(key);
    const role = await guild.roles.fetch(id);
    roles.set(key, role);
    return role;
  },
};
