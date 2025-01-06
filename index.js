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

  for (const file of commandFiles) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      loadCommands(filePath); // Recursively load subdirectories
    } else if (file.isFile() && file.name.endsWith('.command.js')) {
      try {
        const command = require(filePath);

        // Validate command structure
        if (!command?.data?.name) {
          console.warn(`[⚠️] Skipping invalid command file: ${filePath}`);
          continue;
        }

        client.commands.set(command.data.name, command);
        console.log(`[✅] Command loaded: ${command.data.name}`);
      } catch (error) {
        console.error(`[❌] Failed to load command from ${filePath}:`, error);
      }
    }
  }
};
loadCommands();

// Load Events
const loadEvents = () => {
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`[✅] Event loaded: ${event.name}`);
  }
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
    // Clear existing global commands
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    console.log('[✅] Global commands cleared.');

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
