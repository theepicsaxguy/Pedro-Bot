const guildCache = new Map();
const channelCache = new Map();
const roleCache = new Map();
const memberCache = new Map();

module.exports = {
  async getGuild(client, id) {
    if (guildCache.has(id)) return guildCache.get(id);
    const guild = await client.guilds.fetch(id);
    guildCache.set(id, guild);
    return guild;
  },

  async getChannel(guild, id) {
    const key = `${guild.id}:${id}`;
    if (channelCache.has(key)) return channelCache.get(key);
    const channel = await guild.channels.fetch(id);
    channelCache.set(key, channel);
    return channel;
  },

  async getRole(guild, id) {
    const key = `${guild.id}:${id}`;
    if (roleCache.has(key)) return roleCache.get(key);
    const role = await guild.roles.fetch(id);
    roleCache.set(key, role);
    return role;
  },

  async getMember(guild, id) {
    const key = `${guild.id}:${id}`;
    if (memberCache.has(key)) return memberCache.get(key);
    const member = await guild.members.fetch(id);
    memberCache.set(key, member);
    return member;
  },
};
