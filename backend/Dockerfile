# Travel_X backend — production container
FROM node:20-slim

# Prisma needs openssl
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Generate Prisma client + build TypeScript
RUN npx prisma generate
RUN npm run build

# Railway provides PORT at runtime; our app reads process.env.PORT
EXPOSE 4000

# On start: apply any pending migrations, then run the compiled server
CMD npx prisma migrate deploy && node dist/server.js
