FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

CMD ["npx", "ts-node", "src/index.ts"]
