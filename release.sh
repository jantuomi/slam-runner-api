#!/bin/bash

set -euxo pipefail

SERVICE=api
IMAGE=eu.gcr.io/slam-lang/slam-runner-api
COMMIT_ID=$(git rev-parse HEAD | head -c 7)
docker-compose build ${SERVICE}
docker tag ${IMAGE} "${IMAGE}:${COMMIT_ID}"
docker push "${IMAGE}:${COMMIT_ID}"

echo "${IMAGE}:${COMMIT_ID}"
