const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID', 'MONGO_URI'];
module.exports = () => {
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`[❌] Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
};
