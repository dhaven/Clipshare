FROM node:15

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 2020
CMD [ "node", "script.js" ]
