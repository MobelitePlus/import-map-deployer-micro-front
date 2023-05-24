FROM nexus.sifast.com:8087/node:14-alpine as build
WORKDIR /www
COPY package.json yarn.lock ./
RUN yarn install  --production
COPY . /www/

FROM nexus.sifast.com:8087/node:14-alpine as release
RUN apk --no-cache add tini
ENTRYPOINT ["tini", "--"]
ENV NODE_ENV=production
EXPOSE 5000
WORKDIR /www
COPY --from=build --chown=root:root /www /www
CMD ["node", "src/web-server.js"]
