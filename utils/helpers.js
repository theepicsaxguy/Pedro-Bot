// utils/helpers.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const ButtonManager = require('./ButtonManager');

async function updateLobbyEmbed(interaction, lobbyData) {
    const embed = EmbedBuilder.from(lobbyData.embed);
    embed.setDescription(
        `🎮 **Created by <@${lobbyData.creator}>!**\n` +
        `📅 **Date/Time:** <t:${Math.floor(lobbyData.matchTime.getTime() / 1000)}:F>\n` +
        `🏷 **Tags:** ${lobbyData.tags}\n` +
        `🔑 **Game Code:** ${lobbyData.gameCode}\n` +
        `📜 **Description:** ${lobbyData.description}\n` +
        `👥 **Slots Available:** ${lobbyData.joinedUsers.length}/${lobbyData.totalSlots}\n` +
        `✅ **Joined:** ${lobbyData.joinedUsers.join(', ')}`
    );
    lobbyData.embed = embed;
    await interaction.message.edit({ embeds: [embed] });
}

async function updateLobbyStatus(interaction, lobbyData, title) {
    const embed = EmbedBuilder.from(lobbyData.embed);
    embed.setTitle(title);
    lobbyData.embed = embed;

    const components = [
        ButtonManager.createButtonRow(['join', 'leave']),
    ];

    if (lobbyData.creator === interaction.user.id) {
        const additionalButtons = lobbyData.started ? ['stop'] : ['start', 'stop'];
        components.push(ButtonManager.createButtonRow(additionalButtons));
    }

    try {
        await interaction.message.edit({ embeds: [embed], components });
    } catch (error) {
        console.error('Failed to edit message:', error);
    }
}

module.exports = {
    updateLobbyEmbed,
    updateLobbyStatus,
};
