FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-cache
COPY . .
RUN npm run build

# Use a minimal base image to copy build files
FROM alpine:latest
WORKDIR /build
COPY --from=builder /app/build /build
CMD ["sh", "-c", "cp -r /build/* /app/build/"]