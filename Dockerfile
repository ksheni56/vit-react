FROM node:8.7

# Set DOCKER_BUILD so that jest will run all the tests (see scripts/test.js)
ENV DOCKER_BUILD yes

WORKDIR /var/app
RUN mkdir -p /var/app
#RUN yarn install --non-interactive --frozen-lockfile
ADD package.json package-lock.json /var/app/
RUN npm install

COPY . /var/app

# FIXME TODO: fix eslint warnings

#RUN mkdir tmp && \
#  npm test && \
#  ./node_modules/.bin/eslint . && \
#  npm run build

RUN mkdir tmp && \
    npm test && npm run build

ENV PORT 8080
ENV NODE_ENV production

EXPOSE 8080

# uncomment the lines below to run it in development mode
# ENV NODE_ENV development
CMD [ "npm", "run", "start" ]
