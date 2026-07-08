FROM node:24-bookworm-slim

WORKDIR /app

COPY artifacts/cms-site/package*.json ./
RUN npm ci

COPY artifacts/cms-site/ ./
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 5000

CMD ["npm", "run", "start"]
