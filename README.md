# Pedro-Bot

Pedro-Bot is a Discord bot with two core features:
1. **Matchmaking** (organizing game lobbies with threads, join/leave buttons, etc.).
2. **Leveling** (assigning XP for messages and granting roles when users level up).

Below is a detailed breakdown of the repository’s structure, how each component works, and how developers can extend it further.

---

## Table of Contents
1. [Project Structure](#project-structure)
2. [Matchmaking Feature](#matchmaking-feature)
3. [Leveling Feature](#leveling-feature)
4. [Environment Variables](#environment-variables)
5. [How to Run via Docker Compose](#how-to-run-via-docker-compose)
6. [Health Check](#health-check)
7. [Adding New Features](#adding-new-features)
8. [Reusing Functions and Avoiding Duplicates](#reusing-functions-and-avoiding-duplicates)
9. [CI/CD and Releases](#cicd-and-releases)

---

## Project Structure

Pedro-Bot/
├── buttons/
│   ├── join.js
│   ├── leave.js
├── commands/
│   ├── admin/
│   │   ├── reactionRoles.command.js
│   │   ├── schedule.command.js
│   │   └── settings.command.js
│   ├── levels/
│   │   └── level.command.js
│   ├── matchmaking/
│   │   └── matchmaking.command.js
│   └── manageChannels.command.js
├── config/
│   └── constants.js
├── events/
│   ├── interactionCreate.js
│   ├── messageCreate.js
│   ├── guildMemberAdd.js
│   ├── guildMemberRemove.js
│   ├── commandExecution.js
│   ├── ready.js
│   └── [other-events].js
├── models/
│   ├── Lobby.js
│   ├── ReactionRole.js
│   ├── Schedule.js
│   ├── Settings.js
│   └── UserXP.js
├── services/
│   ├── lobbyService.js
│   ├── scheduleService.js
│   ├── settingsService.js
│   └── userService.js
├── utils/
│   ├── ButtonManager.js
│   ├── database.js
│   ├── errorHandler.js
│   ├── levelUtils.js
│   ├── matchmakingHelpers.js
│   ├── scheduler.js
│   ├── roleManager.js
│   └── threadManager.js
├── index.js 


### Key Points
- **`index.js`**: Sets up the Discord client, registers commands, and listens for both interactions (`interactionCreate`) and standard messages (`messageCreate`) for awarding XP.
- **`utils/database.js`**: Loads environment variables for MongoDB, then runs `mongoose.connect(...)`. Exported once for the entire app.
- **`models/*.js`**: Each file defines a Mongoose schema for storing data:
  - `Lobby.js`: For matchmaking lobbies.
  - `UserXP.js`: For leveling / XP.
  - `ReactionRole.js`: For reaction roles.
- **`commands/matchmaking/`**: Self-contained logic for the matchmaking system.
- **`commands/levels/`**: Self-contained logic for leveling. Contains:
  - `levelsManager.js`: Awarding XP and checking level-ups.
  - `levelUtils.js`: XP/level threshold formulas.
  - `level.js`: The `/level` slash command.

---

## Matchmaking Feature

1. **Slash Command**: `/matchmaking` (in `commands/matchmaking.js`):
   - Prompts the user for time, game code, optional template, slot count, and description.
   - Creates a new message in the configured matchmaking channel (default `#matchmaking`) with an embed and two buttons (JOIN, LEAVE).
   - Creates a new thread under that message for discussion.
   - Stores the lobby data in MongoDB (`Lobby` model).
   - Schedules a start time with `scheduler.scheduleLobbyStart` to mark the lobby as started and update the embed.
   - Also schedules automatic cleanup six hours after the start time, archiving the lobby into `LobbyHistory`.
   - The role mentioned in the embed is configured with `/settings set-matchmaking-role` and stored in MongoDB.

2. **Join/Leave Logic**:
   - Inside `index.js` `interactionCreate` event, we handle `isButton()`.
   - If the button ID is “join” or “leave,” it updates the corresponding lobby’s data (stored in Mongo), and edits the embed to reflect the updated users.

3. **Embed Updates**:
 - `helpers.js` within matchmaking builds or rebuilds the embed (`buildLobbyEmbed`), adding a small footer `(MATAC) The Mature Tactical Circkle`.
  - `updateLobbyEmbed` re-edits the original message.
  - Full lobbies prevent additional joins based on the configured slot count.

4. **History & Recurring Lobbies**:
   - Finished lobbies are archived automatically and can be counted with `historyService.getLobbyStats()`.
   - Use `/schedule` to create recurring lobbies by scheduling the `/matchmaking` command.

By keeping all “matchmaking” references in `commands/matchmaking/` and using the `MATCHMAKING_CHANNEL` environment variable for the channel name, we avoid scattering that code throughout the project.
| `HEALTH_PORT` | Port for the health endpoint (default `3000`)

---

## Leveling Feature

1. **Mongo Model**: `UserXP.js` stores each user’s `_id` (Discord ID), their `xp` total, current `level`, etc.
2. **XP Awarding**:
   - In `index.js`, the `messageCreate` event grants XP. Each activity can use a multiplier defined in `config/constants.js`.
   - The logic of awarding XP is in `commands/levels/levelsManager.js` → `incrementXP()`.
   - We store and fetch the user doc from Mongo, apply any XP decay, add XP, check for a new level, and if so, assign a role and post a “level up” message.
3. **Level/XP Formula**:  
4. **Role Assignment**:
   - Roles for each level are stored in MongoDB using the `/settings set-role` command.
   - When a user levels up, the bot checks if a role is configured for that level and assigns it.
5. **`/level` Command** (optional, in `level.js`):
   - A user can check their current XP, level, and how much XP remains until the next level.
6. **`/leaderboard` Command**:
   - Shows the top users with pagination (`/leaderboard page:2`).
7. **`/challenge` Command**:
   - Lets users claim a daily or weekly XP bonus.
8. **XP Decay**:
   - After seven days of inactivity, XP slowly decays when the user returns.

This system is minimal, but it can be expanded easily with leaderboards, cooldowns, or advanced spam checks.

---

## Environment Variables

| Variable          | Description                                                                   |
|-------------------|-------------------------------------------------------------------------------|
| `DISCORD_TOKEN`   | Discord bot token                                                              |
| `CLIENT_ID`       | Your bot’s application client ID                                              |
| `GUILD_ID`        | The server (guild) ID where you want to register commands                     |
| `MONGO_URI`       | MongoDB connection string (e.g., `mongodb://mongodb:27017/pedro-bot`)         |
| `MATCHMAKING_CHANNEL` | Name of the channel used for matchmaking lobbies (default `matchmaking`) |
| `HEALTH_PORT` | Port for the health endpoint (default `3000`)

Note: Role mappings and the matchmaking mention role are configured with the `/settings` command and stored in MongoDB. The matchmaking channel is defined with the `MATCHMAKING_CHANNEL` environment variable.
**Usage**:  
The application exits if any of the required variables are missing at startup.
Docker secrets can be used to supply sensitive values like `DISCORD_TOKEN`.
- In Docker Compose, set these as environment variables under `pedro-bot`.  
- See `docker-compose.yml` for an example.

---

## How to Run via Docker Compose

1. **Clone** this repo.
2. **Configure** your `.env` or environment variables (token, guild ID, Mongo URI, etc.).  
3. **Ensure** your `docker-compose.yml` builds from the current directory:
   ```yaml
   services:
     pedro-bot:
       build:
         context: .
    secrets:
      - discord_token
    environment:
         - CLIENT_ID=...
         - GUILD_ID=...
         - MONGO_URI=mongodb://mongodb:27017/pedro-bot
       depends_on:
         - mongodb
     mongodb:
       image: mongo:8.0
       volumes:
         - mongo_data:/data/db
   volumes:
     mongo_data:

4. The repository includes a `.dockerignore` so your build context stays small.
5. Run `docker compose build` && `docker compose up -d` (or `docker compose up --build -d`).

6. Your bot will connect to Discord, connect to Mongo, register slash commands, and start listening for messages.



## Health Check

The bot exposes `GET /health` on the port defined by `HEALTH_PORT` (defaults to `3000`). A response of `OK` indicates the service is up.


---

Adding New Features

Create a new folder/file under commands/<featureName>/<featureManager>.js for your logic.

Define Mongoose models in models/<ModelName>.js if you need database storage.

Register a slash command by creating a file under commands/<commandName>.js that exports a SlashCommandBuilder.

The index.js automatically picks up .js files in /commands, registering them with Discord.

If your feature requires listening to raw events (like messageCreate), add it in index.js or a dedicated event file, just be mindful of the single “bot instance” approach to avoid collisions.



---

Reusing Functions and Avoiding Duplicates

This codebase follows a few guidelines to keep things clean:

1. No Hardcoding: References to specific channels (like #matchmaking) and roles are done in the command or environment variables, not scattered across utility files.


2. Helpers for Generic Logic:

ButtonManager.js provides a generic way to create buttons (no mention of matchmaking or level).

database.js is a single point for connecting to Mongo.



3. Command-Specific Folders:

commands/matchmaking/ has all the matchmaking logic in one place.

commands/levels/ has the leveling logic in one place.

This helps reduce duplication of logic across multiple commands.



4. Models:

Each domain (lobbies, user XP) has its own model file in models/.

All of them share the same mongoose instance from utils/database.js.




These practices ensure that if you rename or remove a channel, or if you want to update an XP formula, you only do it in one place.

CI/CD and Releases

GitHub Actions build and publish the Docker image whenever application code or build files change on `main` or in a pull request. When a release is published, the same workflow runs and pushes an image tagged with that version. Documentation or workflow tweaks won't trigger a new image. Each pull request gets its own `pr-N` tag so you can test before merging. `release-please` opens a pull request with the next version. After that PR merges, GitHub creates the release and the Docker workflow uploads images tagged `latest`, the short commit SHA, and the release number (for example `1.0.1`). The workflow reads the tag straight from the GitHub release so the container tag always matches. Release-please stores the current version in `.release-please-manifest.json`.

Release tags simply use `X.Y.Z`. Downstream jobs, including the Docker workflow, use that tag directly when naming images.

The repository also runs a PR Validation workflow on every branch and pull request. It installs dependencies, checks formatting with ESLint and Prettier, audits dependencies, runs the unit tests, and ensures the Docker image builds and can start.


---

Questions or Feedback?

If you run into issues or want to propose enhancements (like a spam filter for XP, or more advanced matchmaking scheduling), feel free to open a pull request or file an issue on the repository!

Enjoy using Pedro-Bot, and happy gaming!



