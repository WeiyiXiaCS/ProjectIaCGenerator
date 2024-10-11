# Use the official Node.js image
FROM node:14

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifest files to the container image.
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy local code to the container image.
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run the web service on container startup.
CMD [ "node", "server.js" ]

