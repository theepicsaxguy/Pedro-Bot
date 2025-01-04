const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { REST, Routes } = require('discord.js');
const ButtonManager = require('./utils/ButtonManager');


require('dotenv').config();
const fs = require('fs');

// Initialize Discord Client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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
    if (interaction.isCommand()) {
        // Command handling logic
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Error executing command:', error);
            await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        // Button handling logic
        const customId = interaction.customId;
        const message = await interaction.message.fetch(); // Fetch the original message
        const lobbyData = message.lobbyData;

        if (!lobbyData) {
            await interaction.reply({ content: 'Lobby data not found.', ephemeral: true });
            return;
        }

        if (customId === 'join') {
            if (!lobbyData.joinedUsers.includes(interaction.user.username)) {
                lobbyData.joinedUsers.push(interaction.user.username);
                const embed = message.embeds[0];
                embed.setDescription(
                    embed.description.replace(
                        /👥 \*\*Slots Available:\*\* \d+\/\d+/,
                        `👥 **Slots Available:** ${lobbyData.joinedUsers.length}/${lobbyData.totalSlots}`
                    ) +
                    `\n✅ **Joined:** ${lobbyData.joinedUsers.join(', ')}`
                );
                await message.edit({ embeds: [embed] });
                await interaction.reply({ content: 'You have joined the match!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'You are already in the match!', ephemeral: true });
            }
        } else if (customId === 'start') {
            if (!lobbyData.started) {
                lobbyData.started = true;
                const embed = message.embeds[0];
                embed.setTitle('Matchmaking Lobby (Started)');
                await message.edit({ embeds: [embed] });
                await interaction.reply({ content: 'The match has started!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'The match is already started!', ephemeral: true });
            }
        }
    }
});



// Login to Discord
client.login(TOKEN);
