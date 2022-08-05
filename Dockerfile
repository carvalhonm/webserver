FROM node:16

ARG version
ENV VERSION=${version:-0.0.0}
ENV NODE_ENV="production"

WORKDIR '/app'

COPY . /app
RUN npm i

CMD ["node", "bin/www"]