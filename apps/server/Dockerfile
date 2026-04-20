# Cloud Run compatible Dockerfile for OMEGA Server
FROM node:20-alpine

WORKDIR /app

# Copy package definitions and server code from repo context
COPY apps/server/package.json apps/server/package-lock.json apps/server/tsconfig.json ./
COPY apps/server/server.js apps/server/consoleManager.js ./
COPY packages/codex ./packages/codex

# Install production dependencies only
RUN npm install --production

EXPOSE 8080
CMD ["node", "server.js"]
