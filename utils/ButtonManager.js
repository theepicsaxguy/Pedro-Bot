// utils/ButtonManager.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/constants');

class ButtonManager {
  constructor() {
    this.buttons = new Map();
    this.createDefaultButtons();
  }

  createDefaultButtons() {
    const joinButton = new ButtonBuilder()
      .setCustomId(config.BUTTON_IDS.JOIN)
      .setLabel('Join')
      .setStyle(ButtonStyle.Success);

    const leaveButton = new ButtonBuilder()
      .setCustomId(config.BUTTON_IDS.LEAVE)
      .setLabel('Leave')
      .setStyle(ButtonStyle.Danger);

    this.buttons.set(config.BUTTON_IDS.JOIN, joinButton);
    this.buttons.set(config.BUTTON_IDS.LEAVE, leaveButton);
  }

  getButton(buttonName) {
    return this.buttons.get(buttonName);
  }

  createButtonRow(buttonNames) {
    const row = new ActionRowBuilder();
    buttonNames.forEach(buttonName => {
      const button = this.getButton(buttonName);
      if (button) row.addComponents(ButtonBuilder.from(button));
    });
    return row;
  }
}

module.exports = new ButtonManager();
