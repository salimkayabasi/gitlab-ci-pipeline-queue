FROM node:alpine

ENV NODE_ENV production
ENV APP /app/
WORKDIR $APP

ADD ./package*.json $APP
ADD ./index.js $APP

RUN npm i --production && npm link
