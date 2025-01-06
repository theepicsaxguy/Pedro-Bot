// commands/matchmaking/helpers.js
const { EmbedBuilder } = require('discord.js');
const config = require('../../config/constants');

function buildLobbyEmbed(lobbyData) {
  return new EmbedBuilder()
    .setTitle(`Lobby created ${lobbyData.gameCode}`)
    .setDescription(`
**Host:** <@${lobbyData.creator}>
**Time:** <t:${lobbyData.unixTime}:t>
**Tags:** ${lobbyData.tags}
**Slots Available:** ${lobbyData.joinedUsers.length}/${lobbyData.totalSlots}
**Joined:** ${lobbyData.joinedUsers.join(', ') || 'None'}
**Description:** ${lobbyData.description}

Notes: Missions start at designated time (auto-converts to your time).
All discussion is in the thread. Please click Join/Leave as needed.
`)
    .setColor(0x00AE86)
    .setFooter({ text: '(MATAC) The Mature Tactical Circle' });
}

async function updateLobbyEmbed(interaction, lobbyData) {
  try {
    const embed = buildLobbyEmbed(lobbyData);
    lobbyData.embed = embed;

    await interaction.message.edit({
      embeds: [embed],
      components: interaction.message.components,
      allowedMentions: { parse: ['roles'] },
    });
  } catch (error) {
    require('../..//utils/errorHandler')(error, 'Matchmaking Helpers - updateLobbyEmbed');
  }
}

module.exports = {
  buildLobbyEmbed,
  updateLobbyEmbed,
};
