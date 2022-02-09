FROM fossa/haskell-static-alpine:ghc-8.10.4 AS build

ARG SLAM_GIT_REPO=https://github.com/jantuomi/slam-interpreter.git
ARG SLAM_GIT_CHECKOUT=main

RUN cabal update
RUN git clone $SLAM_GIT_REPO /slam
WORKDIR /slam
RUN git checkout $SLAM_GIT_CHECKOUT
RUN cabal build --enable-executable-static \
    && mv $(cabal list-bin slam-interpreter) ./interpreter \
    && strip ./interpreter

FROM node:16-alpine AS serve

ENV NODE_ENV production
ENV PORT 8080

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only-prod
COPY --from=build /slam/interpreter ./
COPY newrelic.js ./newrelic.js
COPY src ./src
CMD ["npm", "start"]
