FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 5173

CMD ["sh", "-c", "npm run dev -- --host ${HOST:-0.0.0.0} --port ${PORT:-5173}"]
