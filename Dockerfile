FROM node:16

WORKDIR /app

COPY package*.json ./
COPY dist ./

RUN npm install --production

CMD ["node", "main.js"]