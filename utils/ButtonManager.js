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

        const leaveButton = new ButtonBuilder()
            .setCustomId('leave')
            .setLabel('Leave')
            .setStyle(ButtonStyle.Danger);

        const startButton = new ButtonBuilder()
            .setCustomId('start')
            .setLabel('Start')
            .setStyle(ButtonStyle.Primary);

        const stopButton = new ButtonBuilder()
            .setCustomId('stop')
            .setLabel('Stop')
            .setStyle(ButtonStyle.Secondary);

        this.buttons.set('join', joinButton);
        this.buttons.set('leave', leaveButton);
        this.buttons.set('start', startButton);
        this.buttons.set('stop', stopButton);
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
            if (button) row.addComponents(ButtonBuilder.from(button));
        });
        return row;
    }
    
}

module.exports = new ButtonManager();
