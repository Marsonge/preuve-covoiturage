FROM node:20.2 as builder

RUN mkdir -p /app/shared
RUN mkdir -p /app/api

COPY ./shared /app/shared
COPY ./api /app/api

WORKDIR /app/api
RUN sh rebuild.sh production

FROM node:20.2-alpine3.16
RUN apk add p7zip
RUN mkdir /app && chown -R node:node /app
COPY --chown=node:node --from=builder /app /app

USER node
WORKDIR /app/api
CMD ["npm", "run", "start"]
