# Docker image publishing

This project ships best as an all-in-one image: nginx serves the built frontend
and proxies `/api`, `/files`, and `/health` to the Flask backend inside the same
container.

## Build locally

```bash
docker build -t banana-slides:local .
```

If your network needs mirrors:

```bash
docker build \
  --build-arg NPM_REGISTRY=https://registry.npmmirror.com/ \
  --build-arg PYPI_INDEX_URL=https://mirrors.cloud.tencent.com/pypi/simple \
  --build-arg APT_MIRROR=mirrors.aliyun.com \
  -t banana-slides:local .
```

## Run locally

Create `.env` from `.env.example` and set at least your model provider API key
and `SECRET_KEY`.

```bash
docker run -d \
  --name banana-slides \
  --env-file .env \
  -p 3000:80 \
  -v "${PWD}/backend/instance:/app/backend/instance" \
  -v "${PWD}/uploads:/app/uploads" \
  banana-slides:local
```

Open `http://localhost:3000`. Health check:

```bash
curl http://localhost:3000/health
```

With Compose:

```bash
docker compose -f docker-compose.allinone.yml up -d --build
```

## Publish to Docker Hub

Replace `YOUR_DOCKERHUB_USER` and the version tag.

```bash
docker login
docker buildx create --use --name banana-builder
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t YOUR_DOCKERHUB_USER/banana-slides:0.3.0 \
  -t YOUR_DOCKERHUB_USER/banana-slides:latest \
  --push .
```

Users can then run:

```bash
docker run -d \
  --name banana-slides \
  --env-file .env \
  -p 3000:80 \
  -v "${PWD}/backend/instance:/app/backend/instance" \
  -v "${PWD}/uploads:/app/uploads" \
  YOUR_DOCKERHUB_USER/banana-slides:latest
```

## Publish to GHCR

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/YOUR_GITHUB_USER/banana-slides:0.3.0 \
  -t ghcr.io/YOUR_GITHUB_USER/banana-slides:latest \
  --push .
```

This repository also has GitHub Actions workflows for publishing images:

- `.github/workflows/ghcr-publish.yml` publishes the all-in-one image to GHCR.
- `.github/workflows/build-sha-image.yml` can publish SHA-tagged Docker Hub
  images.

## Runtime data

Persist these paths when running the container:

- `/app/backend/instance` for the SQLite database.
- `/app/uploads` for uploaded and generated files.

The container listens on port `80`; map it to any host port with `-p HOST:80`.
