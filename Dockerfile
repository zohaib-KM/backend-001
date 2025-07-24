FROM node:20

# Set working directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy app source code
COPY . .

# Expose the port (default 3000, can be overridden)
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
