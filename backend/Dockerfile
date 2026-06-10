FROM node:22-alpine

WORKDIR /app

# Install deps first for layer caching
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Source + seed
COPY tsconfig.json ./
COPY src ./src
COPY db.seed.json ./

RUN mkdir -p /data

EXPOSE 3001

CMD ["npm", "run", "start"]
