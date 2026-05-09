FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --prefer-offline

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
