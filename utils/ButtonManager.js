const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ButtonManager {
    constructor() {
        this.buttons = new Map();
        this.createDefaultButtons();
    }

    // Create reusable buttons and store them
    createDefaultButtons() {
        const joinButton = new ButtonBuilder()
            .setCustomId('join')
            .setLabel('Join')
            .setStyle(ButtonStyle.Success);

        const startButton = new ButtonBuilder()
            .setCustomId('start')
            .setLabel('Start')
            .setStyle(ButtonStyle.Primary);

        this.buttons.set('join', joinButton);
        this.buttons.set('start', startButton);
    }

    // Get a button by its name
    getButton(buttonName) {
        return this.buttons.get(buttonName);
    }

    // Create a row with multiple buttons
    createButtonRow(buttonNames) {
        const row = new ActionRowBuilder();
        buttonNames.forEach(buttonName => {
            const button = this.getButton(buttonName);
            if (button) row.addComponents(button);
        });
        return row;
    }
}

module.exports = new ButtonManager();
