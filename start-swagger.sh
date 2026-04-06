#!/usr/bin/env bash

docker run -p 8080:8080 \
  -e SWAGGER_JSON=/app/documentacion/swagger.yml \
  -v "$PWD:/app" \
  swaggerapi/swagger-ui