Below is a detailed README.md for your repository. It explains the overall project structure, how to configure and run the bot, and what each folder or file does. It’s designed for developers who may want to maintain or extend this codebase.


---

Pedro-Bot

Pedro-Bot is a Discord bot focused on two core features:

1. Matchmaking: Creating and managing lobbies for missions or games.


2. Leveling System: Awarding XP to users based on their messages, assigning roles and announcing level-ups.



It uses MongoDB for data persistence (via Mongoose) and supports Docker-based deployment.


---

Table of Contents

1. Project Structure


2. Setup & Configuration


3. Running Locally


4. Docker & Docker Compose


5. Environment Variables


6. Commands Overview


7. Matchmaking Features


8. Leveling Features


9. Adding New Commands


10. Contributing




---

Project Structure

A brief description of key files and directories:

.
├── commands/
│   ├── matchmaking/
│   │   ├── helpers.js
│   │   ├── lobbyManager.js
│   │   └── lobbyData.json  (optional if still used, but replaced by Mongo)
│   ├── levels/
│   │   ├── level.js            // /level command
│   │   ├── levelUtils.js       // XP formulas, threshold logic
│   │   └── levelsManager.js    // Logic for awarding XP, leveling up, role assignment
│   ├── matchmaking.js          // /matchmaking slash command
│   └── (possibly other commands)
├── models/
│   ├── Lobby.js                // Mongoose model for matchmaking lobbies
│   └── UserXP.js               // Mongoose model for user XP/levels
├── utils/
│   ├── database.js             // MongoDB connection setup
│   ├── ButtonManager.js        // Reusable button logic
│   └── (other generic utilities)
├── index.js                    // Main entry point (loads commands, sets up events)
├── Dockerfile                  // Used to build a container for the bot
├── docker-compose.yml          // Defines services for the bot + Mongo
├── .env                        // Holds environment variables
└── README.md                   // This file

Key Highlights

1. index.js:

Registers slash commands on startup (clears old commands, then registers new ones).

Listens for interactionCreate events (slash commands, buttons, etc.).

Listens for messageCreate events (awards XP for leveling).

Sets up scheduling for matchmaking lobbies.



2. commands/:

Each slash command gets its own file (e.g., matchmaking.js, level.js).

Subfolders like matchmaking/ and levels/ group code that’s specific to that feature.



3. models/:

Lobby.js: Mongoose schema for storing matchmaking lobby data (game code, times, participants, etc.).

UserXP.js: Mongoose schema for storing each user’s XP, level, last message time, etc.



4. utils/:

database.js: Sets up the Mongoose connection (reads from MONGO_URI).

ButtonManager.js: A small class that manages button creation across commands.

You can add more truly “generic” utilities here.





---

Setup & Configuration

1. Install Node.js (>= v16 recommended) and npm.


2. Clone this repository:

git clone https://github.com/theepicsaxguy/Pedro-Bot.git
cd Pedro-Bot


3. Install dependencies:

npm install


4. Create a .env file in the root directory (or set environment variables via Docker Compose). At minimum, you need:

DISCORD_TOKEN="your_discord_bot_token"
CLIENT_ID="your_discord_application_client_id"
GUILD_ID="the_discord_server_id_for_commands"
MONGO_URI="mongodb://localhost:27017/pedro-bot"

Optional for leveling:

LEVEL_ROLE_MAP='{"1":"ROLE_ID_FOR_LEVEL1","2":"ROLE_ID_FOR_LEVEL2"}'




---

Running Locally

1. Make sure you have a MongoDB instance running locally, or you’ve pointed MONGO_URI to a remote/hosted database.


2. Run:

npm start


3. The bot will log “Bot is started and ready!” once connected.


4. You should see slash commands created on the specified GUILD (server) within a few seconds/minutes.



> Note: By default, the code clears old global/guild commands, then registers only these GUILD commands. If you want global commands, you can tweak the index.js logic (but they can take up to 1 hour to show up).




---

Docker & Docker Compose

The repository also includes a docker-compose.yml so you can run both the bot and a MongoDB service easily:

version: '3.9'

services:
  pedro-bot:
    container_name: pedro-bot
    build: https://github.com/theepicsaxguy/Pedro-Bot.git#main
    volumes:
      - type: bind
        source: /var/log/pedro-bot
        target: /app/logs
      - type: bind
        source: /etc/pedro-bot
        target: /app/data
    restart: always
    pull_policy: build
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - CLIENT_ID=${CLIENT_ID}
      - GUILD_ID=${GUILD_ID}
      - MONGO_URI=mongodb://mongodb:27017/pedro-bot
    depends_on:
      - mongodb

  mongodb:
    container_name: pedro-bot-mongo
    image: mongo:4.4
    restart: always
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:

Usage

docker compose up --build -d will build the bot image and spin up containers in the background.

The mongo_data volume ensures your MongoDB data persists across restarts.



---

Environment Variables

Here are the main environment variables:

DISCORD_TOKEN: Your bot’s secret token, from the Discord developer portal.

CLIENT_ID: The application ID of your Discord app.

GUILD_ID: The server ID where you want slash commands registered.

MONGO_URI: The connection string for MongoDB (e.g., mongodb://mongodb:27017/pedro-bot).

LEVEL_ROLE_MAP (optional for leveling): A JSON object mapping levels to Discord role IDs (e.g., {"1":"SOME_ROLE_ID","2":"ANOTHER_ROLE_ID"}).



---

Commands Overview

/matchmaking

Creates a new lobby post in the #matchmaking channel.

Provides join/leave buttons, starts a thread, schedules a start time, and tags a role if configured.


/level

Shows your current level and XP, plus how much XP needed for the next level.


> You can add more commands the same way (SlashCommandBuilder, etc.).




---

Matchmaking Features

1. Lobby Creation (/matchmaking):

Requires user inputs: time choice, tags, game code, description.

Schedules a “start” edit to the lobby embed.



2. Lobby Embed:

Lists joined users, total slots, time, etc.

Has a small footer (MATAC) The Mature Tactical Circkle.



3. Join/Leave Buttons:

/join adds you to the lobby, optionally adds you to the thread.

/leave removes you from it.



4. Data Stored in Mongo using the Lobby model.




---

Leveling Features

1. XP on Message:

Each user gets a fixed XP amount for each message (5 by default).

This is handled in index.js → messageCreate event, which calls incrementXP(...).



2. Level Formula:

In levelUtils.js, we have a function calculateLevelFromXP(xp) that decides what level your XP corresponds to.

Another function xpRequiredForLevel(level) so you can tweak or scale it.



3. Role Assignment:

If a user’s new level is found in LEVEL_ROLE_MAP, that role is assigned automatically, and a message is posted to the same channel.



4. /level Command:

Allows a user to see their current XP, level, and how much XP until the next level.





---

Adding New Commands

1. Create a new file in commands/. For example: commands/coolfeature.js.


2. Export an object with .data (a SlashCommandBuilder) and .execute(interaction).


3. The index.js file automatically loads any .js command in the commands/ folder on startup.


4. If you need persistent data, create a new Mongoose model in models/ and a manager file in your commands/ subfolder.




---

Contributing

Branches: Use feature branches for your new functionalities.

Pull Requests: Open a PR against the main branch so others can review.

Lint & Style: Follow the existing code style.

Tests: If you add complex logic, consider basic tests (e.g., using Jest) to ensure it works as expected.


Feel free to reach out or open issues if you have any questions, suggestions, or run into bugs. Thanks for helping improve Pedro-Bot!

