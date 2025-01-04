const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ButtonManager {
    constructor() {
        this.buttons = new Map();
        this.createDefaultButtons();
        console.log(`[INFO] Default buttons created.`);
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

        // === REMOVED START AND STOP BUTTONS ===

        this.buttons.set('join', joinButton);
        this.buttons.set('leave', leaveButton);
    }

    getButton(buttonName) {
        console.log(`[INFO] Getting button: ${buttonName}`);
        return this.buttons.get(buttonName);
    }

    createButtonRow(buttonNames) {
        console.log(`[INFO] Creating button row: ${buttonNames.join(', ')}`);
        const row = new ActionRowBuilder();
        buttonNames.forEach(buttonName => {
            const button = this.getButton(buttonName);
            if (button) row.addComponents(ButtonBuilder.from(button));
        });
        return row;
    }
}

module.exports = new ButtonManager();
