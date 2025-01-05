# Use the official Node.js 20 image
FROM node:20

# Set the working directory inside the container
WORKDIR /

# Copy package.json and package-lock.json first (for caching purposes)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .


# Command to run the application
CMD ["npm", "start"]
