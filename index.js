// index.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const scheduler = require('./utils/scheduler');
const errorHandler = require('./utils/errorHandler');
const config = require('./config/constants');

// Load Mongo connection
require('./utils/database');

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
});
client.commands = new Collection();

// Load Commands Recursively, Only Loading Files Ending with .command.js
const loadCommands = (dir = './commands') => {
  const commandFiles = fs.readdirSync(dir, { withFileTypes: true });
  let loadedCount = 0;
  let failedCount = 0;

  for (const file of commandFiles) {
    const filePath = path.resolve(__dirname, dir, file.name);

    if (file.isDirectory()) {
      const { loaded, failed } = loadCommands(filePath); // Recursively load subdirectories
      loadedCount += loaded;
      failedCount += failed;
    } else if (file.isFile() && file.name.endsWith('.command.js')) {
      try {
        const command = require(filePath);

        // Validate command structure
        if (!command?.data?.name) {
          console.warn(`[⚠️] Skipping invalid command file: ${filePath}`);
          failedCount++;
          continue;
        }

        client.commands.set(command.data.name, command);
        console.log(`[✅] Command loaded: ${command.data.name}`);
        loadedCount++;
      } catch (error) {
        console.error(`[❌] Failed to load command from ${filePath}:`, error);
        failedCount++;
      }
    }
  }

  return { loaded: loadedCount, failed: failedCount };
};

loadCommands();
const { loaded: commandsLoaded, failed: commandsFailed } = loadCommands();
console.log(`[ℹ️] Total Commands Loaded: ${commandsLoaded}, Failed: ${commandsFailed}`);

// Load Events
const loadEvents = () => {
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  let loaded = 0;
  let failed = 0;

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    try {
      const event = require(filePath);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      console.log(`[✅] Event loaded: ${event.name}`);
      loaded++;
    } catch (error) {
      console.error(`[❌] Failed to load event from ${filePath}:`, error);
      failed++;
    }
  }

  console.log(`[ℹ️] Total Events Loaded: ${loaded}, Failed: ${failed}`);
};
loadEvents();

// Register Commands with Discord
const registerCommands = async () => {
  const TOKEN = process.env.DISCORD_TOKEN;
  const CLIENT_ID = process.env.CLIENT_ID;
  const GUILD_ID = process.env.GUILD_ID;
  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    console.log('[ℹ️] Registering commands with Discord...');
    // // Clear existing global commands
    // await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    // console.log('[✅] Global commands cleared.');

    // Register guild-specific commands
    const commandsData = client.commands.map(cmd => cmd.data.toJSON());
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commandsData });
    console.log('[✅] Guild commands registered successfully.');
  } catch (error) {
    errorHandler(error, 'Command Registration');
  }
};
registerCommands();

// Login the Bot
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log('[✅] Bot login successful.');
  })
  .catch(err => {
    errorHandler(err, 'Bot Login');
  });
