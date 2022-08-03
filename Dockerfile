FROM node:16

ARG version
ENV VERSION=${version:-0.0.0}
ENV NODE_ENV="production"

WORKDIR '/app'

COPY . /app
RUN npm i

ENV APP_PORT=80
EXPOSE $APP_PORT

ENV ADMIN_KEY=testing
EXPOSE $ADMIN_KEY

CMD ["node", "bin/www"]