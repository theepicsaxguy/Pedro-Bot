const { EmbedBuilder } = require('discord.js');
const ButtonManager = require('./ButtonManager');

async function updateLobbyEmbed(interaction, lobbyData, components = []) {
    const embed = EmbedBuilder.from(lobbyData.embed);
    embed.setDescription(
        `🎮 **Created by <@${lobbyData.creator}>!**\n` +
        `📅 **Date/Time:** <t:${lobbyData.unixTime}:F>\n` +
        `🏷 **Tags:** ${lobbyData.tags}\n` +
        `🔑 **Game Code:** ${lobbyData.gameCode}\n` +
        `📜 **Description:** ${lobbyData.description}\n` +
        `👥 **Slots Available:** ${lobbyData.joinedUsers.length}/${lobbyData.totalSlots}\n` +
        `✅ **Joined:** ${lobbyData.joinedUsers.join(', ')}`
    );
    lobbyData.embed = embed;

    const finalComponents = components.length > 0 ? components : interaction.message.components;

    if (interaction.message) {
        await interaction.message.edit({ embeds: [embed], components: finalComponents });
    }
}

async function updateLobbyStatus(interaction, lobbyData, title) {
    const embed = EmbedBuilder.from(lobbyData.embed);
    embed.setTitle(title);
    lobbyData.embed = embed;

    const components = [
        ButtonManager.createButtonRow(['join', 'leave']),
    ];

    await interaction.message.edit({ embeds: [embed], components });
}

module.exports = {
    updateLobbyEmbed,
    updateLobbyStatus,
};
