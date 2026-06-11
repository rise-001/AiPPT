# Default production Dockerfile.
#
# Keep this file in sync with Dockerfile.allinone. It exists so a plain
# `docker build .` creates the single-container image that most users want.

ARG DOCKER_REGISTRY=
ARG GHCR_REGISTRY=ghcr.io/
ARG NPM_REGISTRY=
ARG APT_MIRROR=
ARG PYPI_INDEX_URL=
ARG APP_VERSION_TAG=
ARG APP_COMMIT_SHA=
ARG APP_COMMIT_SHORT_SHA=
ARG APP_BUILD_DATE=

FROM ${DOCKER_REGISTRY:-}node:18-alpine AS frontend-builder

ARG NPM_REGISTRY=
ARG APP_VERSION_TAG=
ARG APP_COMMIT_SHA=
ARG APP_COMMIT_SHORT_SHA=
ARG APP_BUILD_DATE=

ENV VITE_APP_VERSION_TAG=${APP_VERSION_TAG}
ENV VITE_APP_COMMIT_SHA=${APP_COMMIT_SHA}
ENV VITE_APP_COMMIT_SHORT_SHA=${APP_COMMIT_SHORT_SHA}
ENV VITE_APP_BUILD_DATE=${APP_BUILD_DATE}

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json* ./
RUN set -eux; \
    if [ -n "$NPM_REGISTRY" ]; then npm config set registry "$NPM_REGISTRY"; fi; \
    if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY frontend/ ./
RUN npm run build

FROM ${GHCR_REGISTRY}astral-sh/uv:latest AS uv

FROM ${DOCKER_REGISTRY:-}python:3.10-slim

ARG APT_MIRROR=
ARG PYPI_INDEX_URL=
ARG APP_VERSION_TAG=
ARG APP_COMMIT_SHA=
ARG APP_COMMIT_SHORT_SHA=
ARG APP_BUILD_DATE=

WORKDIR /app

RUN set -eux; \
    if [ -n "$APT_MIRROR" ] && [ -f /etc/apt/sources.list.d/debian.sources ]; then \
        sed -i "s@deb.debian.org@$APT_MIRROR@g" /etc/apt/sources.list.d/debian.sources; \
    fi; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        curl \
        ffmpeg \
        fonts-noto-cjk \
        nginx \
        supervisor; \
    rm -rf /var/lib/apt/lists/*

COPY --from=uv /uv /usr/local/bin/uv
RUN chmod +x /usr/local/bin/uv

COPY pyproject.toml uv.lock* ./
RUN set -eux; \
    if [ -n "$PYPI_INDEX_URL" ]; then export UV_INDEX_URL="$PYPI_INDEX_URL"; fi; \
    if [ -f uv.lock ]; then \
        uv sync --frozen --no-install-project; \
    else \
        uv sync --no-install-project; \
    fi

COPY backend/ ./backend/
COPY assets/ ./assets/
COPY docker/ ./docker/

COPY --from=frontend-builder /app/dist /usr/share/nginx/html

COPY docker/nginx-allinone.conf /etc/nginx/conf.d/default.conf
RUN rm -f /etc/nginx/sites-enabled/default; \
    chmod +x /app/docker/start-backend.sh; \
    mkdir -p /app/backend/instance /app/uploads

ENV PYTHONPATH=/app
ENV FLASK_APP=backend/app.py
ENV FLASK_ENV=production
ENV IN_DOCKER=1
ENV UV_NO_SYNC=1
ENV APP_VERSION_TAG=${APP_VERSION_TAG}
ENV APP_COMMIT_SHA=${APP_COMMIT_SHA}
ENV APP_COMMIT_SHORT_SHA=${APP_COMMIT_SHORT_SHA}
ENV APP_BUILD_DATE=${APP_BUILD_DATE}
ENV DOCKERHUB_REPOSITORY=banana-slides

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

CMD ["/usr/bin/supervisord", "-c", "/app/docker/supervisord.conf"]
