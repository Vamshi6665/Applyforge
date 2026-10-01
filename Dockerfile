# --- build the client -----------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci
COPY . .
RUN npm run build

# --- runtime: API + static client ---------------------------------------
FROM node:22-alpine
ENV NODE_ENV=production PORT=8787
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev -w server && npm cache clean --force
COPY server/src server/src
COPY --from=build /app/client/dist client/dist
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8787/api/health || exit 1
CMD ["node", "server/src/index.js"]
