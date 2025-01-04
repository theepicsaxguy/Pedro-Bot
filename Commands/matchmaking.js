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
