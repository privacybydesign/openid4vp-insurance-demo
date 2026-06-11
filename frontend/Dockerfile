FROM node:22-alpine

# Pull in any apk security patches that haven't yet landed in the upstream
# node:22-alpine tag (the trivy/grype scan in delivery.yml fails the build on
# fixable CRITICALs, so we can't wait for Docker Hub to rebuild the base).
RUN apk -U --no-cache upgrade

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 5173

CMD ["sh", "-c", "npm run dev -- --host ${HOST:-0.0.0.0} --port ${PORT:-5173}"]
