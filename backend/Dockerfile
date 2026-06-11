FROM node:22-alpine

# Pull in any apk security patches that haven't yet landed in the upstream
# node:22-alpine tag (the trivy/grype scan in delivery.yml fails the build on
# fixable CRITICALs, so we can't wait for Docker Hub to rebuild the base).
RUN apk -U --no-cache upgrade

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
