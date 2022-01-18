FROM node:12.18.3

WORKDIR /usr/src/app

COPY package*.json ./

ENV MONGO_URL "mongodb://mongo:27017"
ENV DB_NAME points
ENV COL_NAME dataPoints
ENV COL_POLL polls

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "run", "dev"]
