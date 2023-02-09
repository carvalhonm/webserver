FROM node:16-alpine

ARG version
ENV VERSION=${version:-0.0.0}
ENV NODE_ENV="production"

RUN apk update
RUN apk add
RUN apk add ffmpeg

WORKDIR '/app'

COPY . /app
RUN npm i

CMD ["node", "bin/www"]