FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

# Cloud Run injects PORT and expects the container to listen on it (defaults to 8080)
EXPOSE 8080
CMD ["node", "dist/main.js"]
