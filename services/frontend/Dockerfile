FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci 2>/dev/null || true
COPY . .
RUN npm run build 2>/dev/null || true

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app .
EXPOSE 4200
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "4200"]
