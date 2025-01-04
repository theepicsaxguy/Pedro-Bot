# Matchmaking Discord Bot

## File: index.js
```javascript
const { Client, Intents, REST, Routes, Collection } = require('discord.js');
require('dotenv').config();
const fs = require('fs');

// Initialize Discord Client
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Load environment variables
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// Command collection to dynamically load commands
client.commands = new Collection();

// Load command files
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Register slash commands
const commands = client.commands.map(command => command.data.toJSON());
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error refreshing application (/) commands:', error);
    }
})();

// Event: Bot ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Event: Interaction create
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Error executing command:', error);
        await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
    }
});

// Login to Discord
client.login(TOKEN);
```

## File: commands/matchmaking.js
```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('matchmaking')
        .setDescription('Create a matchmaking lobby')
        .addStringOption(option => 
            option.setName('time')
                .setDescription('When is the match?')
                .setRequired(true)
                .addChoices(
                    { name: 'Now', value: 'now' },
                    { name: 'In 1 Hour', value: '1_hour' },
                    { name: 'Tomorrow', value: 'tomorrow' },
                    { name: 'Custom Time', value: 'custom' }
                )
        )
        .addStringOption(option => 
            option.setName('tags')
                .setDescription('Select match tags')
                .setRequired(true)
                .addChoices(
                    { name: 'Casual', value: 'casual' },
                    { name: 'Tactical', value: 'tactical' },
                    { name: 'Mislim', value: 'mislim' },
                    { name: 'Training', value: 'training' }
                )
        )
        .addStringOption(option => 
            option.setName('game_code')
                .setDescription('Enter a 4-digit game code')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('description')
                .setDescription('Provide a description for the match')
                .setRequired(false)
        ),
    async execute(interaction) {
        const time = interaction.options.getString('time');
        const tags = interaction.options.getString('tags');
        const gameCode = interaction.options.getString('game_code');
        const description = interaction.options.getString('description') || 'No description provided';

        await interaction.reply(
            `🎮 **Matchmaking Lobby Created by ${interaction.user.username}!** 🎮\n` +
            `📅 **Date/Time:** ${time}\n` +
            `🏷 **Tags:** ${tags}\n` +
            `🔑 **Game Code:** ${gameCode}\n` +
            `📜 **Description:** ${description}\n` +
            `👥 **Slots Available:** 1/6`
        );
    },
};
```

## File: .env (Example)
```
DISCORD_TOKEN=your-discord-bot-token
CLIENT_ID=your-client-id
GUILD_ID=your-guild-id
```
