# Matchmaking Discord Bot Setup Guide

## Overview
This guide will walk you through setting up and running the Matchmaking Discord Bot. The bot is designed to help users create matchmaking lobbies using slash commands in a Discord server. Follow the steps below to set up the bot on your local machine and deploy it to your Discord server.

---

## Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (version 16 or higher)
- A Discord account
- Access to the [Discord Developer Portal](https://discord.com/developers/applications)

---

## Folder Structure
```
project-root/
├── commands/
│   └── matchmaking.js
├── .env
├── index.js
├── package.json
└── README.md
```

---

## Step 1: Clone the Repository
Clone the bot's repository to your local machine:
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

---

## Step 2: Install Dependencies
Run the following command to install the required packages:
```bash
npm install
```

---

## Step 3: Create the `.env` File
Create a `.env` file in the root directory of your project and add your bot's credentials:
```
DISCORD_TOKEN=your-discord-bot-token
CLIENT_ID=your-client-id
GUILD_ID=your-guild-id
```
- **DISCORD_TOKEN**: The bot token from the Discord Developer Portal.
- **CLIENT_ID**: The client ID of your bot application.
- **GUILD_ID**: The ID of the Discord server (guild) where the bot will be used.

---

## Step 4: Create the `commands` Folder and Add Commands
Create a `commands` folder in the root directory and add a `matchmaking.js` file with your matchmaking command logic.

Example command file (`commands/matchmaking.js`):
```javascript
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
```

---

## Step 5: Run the Bot
Start the bot using the following command:
```bash
node index.js
```

The bot will log in and register the `/matchmaking` command with your Discord server.

---

## Step 6: Invite the Bot to Your Server
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and select your bot application.
2. Navigate to the **OAuth2** tab.
3. Under **OAuth2 URL Generator**, select the following scopes:
   - `bot`
   - `applications.commands`
4. Under **Bot Permissions**, select the necessary permissions (e.g., `Send Messages`, `Use Slash Commands`).
5. Copy the generated URL and open it in your browser.
6. Select the server where you want to add the bot.

---

## Step 7: Test the Bot
In your Discord server, type:
```
/matchmaking
```
Follow the prompts to create a matchmaking lobby.

---

## Adding New Commands
To add new commands:
1. Create a new `.js` file in the `commands` folder.
2. Define the command using the `SlashCommandBuilder`.
3. Implement the `execute` function to handle the interaction.
4. Restart the bot to register the new command.

Example new command (`commands/ping.js`):
```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
};
```

---

## Notes
- Ensure the bot has the required permissions in your server.
- Use logging and monitoring tools to keep track of the bot's performance and errors.
- Regularly update your bot's dependencies and commands to keep it running smoothly.
