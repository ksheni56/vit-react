FROM node:8.11.4 as Base

# Set DOCKER_BUILD so that jest will run all the tests (see scripts/test.js)
ENV DOCKER_BUILD yes

ARG DMCA_CONTENT_ENDPOINT
ARG DMCA_USER_ENDPOINT
ARG LIQUID_TOKEN
ENV REACT_APP_DMCA_CONTENT_ENDPOINT $DMCA_CONTENT_ENDPOINT
ENV REACT_APP_DMCA_USER_ENDPOINT $DMCA_USER_ENDPOINT
ENV REACT_APP_LIQUID_TOKEN $ARG LIQUID_TOKEN

WORKDIR /var/app
RUN mkdir -p /var/app
COPY . /var/app
RUN env
RUN npm install
RUN npm run build

#RUN mkdir tmp && \
#    npm test && npm run build

FROM Base as Development

ENV PORT 8080
ENV NODE_ENV production

EXPOSE 8080

# uncomment the lines below to run it in development mode
# ENV NODE_ENV development
CMD [ "npm", "run", "start" ]

FROM nginx:alpine as Production

COPY --from=Base /var/app/build /usr/share/nginx/html
