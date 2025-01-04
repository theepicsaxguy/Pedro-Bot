const { Client, GatewayIntentBits, Collection, InteractionType, EmbedBuilder } = require('discord.js');
const { REST, Routes } = require('discord.js');
const ButtonManager = require('./utils/ButtonManager');
require('dotenv').config();
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

const commands = client.commands.map(command => command.data.toJSON());
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error refreshing application (/) commands:', error);
    }
})();

global.lobbyMap = new Map();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.type === InteractionType.ApplicationCommand) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Error executing command:', error);
            await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
        }
    } else if (interaction.type === InteractionType.MessageComponent) {
        const messageId = interaction.message.id;
        const lobbyData = global.lobbyMap.get(messageId);

        if (!lobbyData) {
            await interaction.reply({ content: 'Lobby data not found.', ephemeral: true });
            return;
        }

        if (interaction.customId === 'join') {
            if (!lobbyData.joinedUsers.includes(interaction.user.username)) {
                lobbyData.joinedUsers.push(interaction.user.username);
                const embed = EmbedBuilder.from(interaction.message.embeds[0]);
                embed.setDescription(
                    embed.data.description.replace(
                        /👥 \*\*Slots Available:\*\* \d+\/\d+/,
                        `👥 **Slots Available:** ${lobbyData.joinedUsers.length}/${lobbyData.totalSlots}`
                    ) +
                    `\n✅ **Joined:** ${lobbyData.joinedUsers.join(', ')}`
                );
                await interaction.update({ embeds: [embed] });
            } else {
                await interaction.reply({ content: 'You are already in the match!', ephemeral: true });
            }
        } else if (interaction.customId === 'start') {
            if (!lobbyData.started) {
                lobbyData.started = true;
                const embed = EmbedBuilder.from(interaction.message.embeds[0]);
                embed.setTitle('Matchmaking Lobby (Started)');
                await interaction.update({ embeds: [embed] });
            } else {
                await interaction.reply({ content: 'The match is already started!', ephemeral: true });
            }
        }
    }
});

client.login(TOKEN);
