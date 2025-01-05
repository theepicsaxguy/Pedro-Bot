# Use the official Node.js 20 image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching purposes)
COPY app/package.json app/package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY app/ ./

# Command to run the application
CMD ["npm", "start"]
