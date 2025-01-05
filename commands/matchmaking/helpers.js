// commands/matchmaking/helpers.js
const { EmbedBuilder } = require('discord.js');
const ButtonManager = require('../../utils/ButtonManager');

const MATCHMAKING_ROLE_ID = process.env.MATCHMAKING_ROLE_ID || null;


function buildLobbyEmbed(lobbyData) {
    return new EmbedBuilder()
        // CHANGE: new embed title = "Lobby created 123"
        .setTitle(`Lobby created ${lobbyData.gameCode}`)
        .setDescription(`
**Host:** <@${lobbyData.creator}>
**Time:** <t:${lobbyData.unixTime}:t>
**Tags:** ${lobbyData.tags}
**Slots Available:** ${lobbyData.joinedUsers.length}/${lobbyData.totalSlots}
**Joined:** ${lobbyData.joinedUsers.join(', ')}
**Description:** ${lobbyData.description}

Notes: Missions start at designated time (auto-converts to your time).
All discussion is in the thread. Please click Join/Leave as needed.

`)
        .setColor(0x00AE86);
}

async function updateLobbyEmbed(interaction, lobbyData) {
    const embed = buildLobbyEmbed(lobbyData);
    lobbyData.embed = embed;

    const finalComponents = interaction.message.components;
    await interaction.message.edit({
        embeds: [embed],
        components: finalComponents,
        allowedMentions: { parse: ['roles'] },
    });
}

module.exports = {
    buildLobbyEmbed,
    updateLobbyEmbed,
};
