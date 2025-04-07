# Use an official Node.js runtime as a base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy dependency files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Install PM2 globally
RUN npm install -g pm2

# Copy the rest of the application
COPY . .

# Install dotenv just in case (safe even if you're not using it)
RUN npm install dotenv

# Expose the port the app runs on
EXPOSE 3000

# Start the application with PM2
CMD ["pm2-runtime", "start", "app.js"]
