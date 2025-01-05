const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ButtonManager {
    constructor() {
        this.buttons = new Map();
        this.createDefaultButtons();
    }

    createDefaultButtons() {
        const joinButton = new ButtonBuilder()
            .setCustomId('join')
            .setLabel('Join')
            .setStyle(ButtonStyle.Success);

        const leaveButton = new ButtonBuilder()
            .setCustomId('leave')
            .setLabel('Leave')
            .setStyle(ButtonStyle.Danger);

        this.buttons.set('join', joinButton);
        this.buttons.set('leave', leaveButton);
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
