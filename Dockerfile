# Use the official Node.js LTS image as the base image
FROM node:lts-iron

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the app directory
COPY package*.json ./

# Install app dependencies
RUN npm clean-install

# Install ffmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    ca-certificates \
    fontconfig \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxi6 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    --no-install-recommends

# Copy the rest of the application code to the app directory
COPY . .

# Expose the application port (e.g., 3000)
EXPOSE 1234

# Command to start the Node.js application
CMD ["node", "index.js"]