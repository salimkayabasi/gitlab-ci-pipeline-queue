FROM node:alpine

ENV NODE_ENV production
ENV APP /app/
WORKDIR $APP

ADD ./package*.json $APP
RUN npm i --production
ADD ./index.js $APP
