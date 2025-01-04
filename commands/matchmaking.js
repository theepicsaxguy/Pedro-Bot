const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ButtonManager = require('../utils/ButtonManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('matchmaking')
        .setDescription('Create a matchmaking lobby')
        .addStringOption(option => 
            option.setName('time')
                .setDescription('Enter the match time (YYYY-MM-DD HH:MM format)')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('tags')
                .setDescription('Select match tags')
                .setRequired(true)
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
        const timeInput = interaction.options.getString('time');
        const tags = interaction.options.getString('tags');
        const gameCode = interaction.options.getString('game_code');
        const description = interaction.options.getString('description') || 'No description provided';

        // Convert time input to a UNIX timestamp
        const matchTime = new Date(timeInput);
        const unixTime = Math.floor(matchTime.getTime() / 1000); // Convert to seconds for Discord's timestamp

        // Create initial embed
        const embed = new EmbedBuilder()
            .setTitle('Matchmaking Lobby')
            .setDescription(
                `🎮 **Created by ${interaction.user.username}!**\n` +
                `📅 **Date/Time:** <t:${unixTime}:F>\n` +
                `🏷 **Tags:** ${tags}\n` +
                `🔑 **Game Code:** ${gameCode}\n` +
                `📜 **Description:** ${description}\n` +
                `👥 **Slots Available:** 0/6`
            )
            .setColor(0x00AE86);

        // Create buttons
        const row = ButtonManager.createButtonRow(['join', 'start']);

        // Send the initial embed with buttons
        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        // Store lobby data in the message for future updates
        message.lobbyData = {
            joinedUsers: [],
            started: false,
            totalSlots: 6
        };
    }
};
