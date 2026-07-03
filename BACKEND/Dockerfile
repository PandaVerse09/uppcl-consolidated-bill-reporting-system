# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

# Secure environment by running under non-root node user
RUN chown -R node:node /usr/src/app
USER node

# Expose API and Health server ports
EXPOSE 80
EXPOSE 801

CMD ["node", "server.js"]
