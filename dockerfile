FROM node:20

WORKDIR /bot

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Start the bot
CMD ["node", "index.js"]
