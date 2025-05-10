FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --no-cache
COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/build /app/build
CMD ["npm", "run", "serve"]