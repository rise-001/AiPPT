# Docker image publishing

This project ships best as an all-in-one image: nginx serves the built frontend
and proxies `/api`, `/files`, and `/health` to the Flask backend inside the same
container.

## Pure Docker deployment, no Compose

Use this section when the server only uses `docker` commands and does not use
`docker compose`.

This deployment does not require `.env`. Start the container first, then open
the web UI and enter only the Lingyun API Key on the Settings page. API Base URL
defaults to `https://yunai.chat`, the text model defaults to
`gemini-3-flash-preview`, the image model defaults to `gpt-image-2` with OpenAI
format, and the image caption model defaults to `gemini-3-flash-preview`. These
settings are stored in the mounted SQLite database under `backend/instance`.

### Recommended all-in-one image

Pull the published image:

```bash
docker pull ghcr.io/rise-001/aippt:latest
```

Create persistent data directories:

```bash
mkdir -p backend/instance uploads
```

Run the application:

```bash
docker run -d \
  --name aippt \
  -p 3000:80 \
  -v "$PWD/backend/instance:/app/backend/instance" \
  -v "$PWD/uploads:/app/uploads" \
  --restart unless-stopped \
  ghcr.io/rise-001/aippt:latest
```

Open `http://SERVER_IP:3000`.

Check status and logs:

```bash
docker ps
docker logs -f aippt
docker exec aippt curl -f http://localhost/health
```

Restart:

```bash
docker restart aippt
```

Update to the latest image:

```bash
docker pull ghcr.io/rise-001/aippt:latest
docker stop aippt
docker rm aippt
docker run -d \
  --name aippt \
  -p 3000:80 \
  -v "$PWD/backend/instance:/app/backend/instance" \
  -v "$PWD/uploads:/app/uploads" \
  --restart unless-stopped \
  ghcr.io/rise-001/aippt:latest
```

Stop and remove the container:

```bash
docker stop aippt
docker rm aippt
```

### Split frontend and backend images

Use this only when you explicitly want two containers.

```bash
docker network create aippt-network
docker pull ghcr.io/rise-001/aippt-backend:latest
docker pull ghcr.io/rise-001/aippt-frontend:latest
mkdir -p backend/instance uploads
```

Run the backend:

```bash
docker run -d \
  --name backend \
  --network aippt-network \
  -p 5000:5000 \
  -p 1455:1455 \
  -v "$PWD/backend/instance:/app/backend/instance" \
  -v "$PWD/uploads:/app/uploads" \
  --restart unless-stopped \
  ghcr.io/rise-001/aippt-backend:latest
```

Run the frontend:

```bash
docker run -d \
  --name aippt-frontend \
  --network aippt-network \
  -p 3000:80 \
  --restart unless-stopped \
  ghcr.io/rise-001/aippt-frontend:latest
```

Check logs:

```bash
docker logs -f backend
docker logs -f aippt-frontend
```

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

You can run without `.env` and configure model provider settings in the web UI.
Use `--env-file .env` only when you intentionally want environment variable
defaults.

```bash
docker run -d \
  --name banana-slides \
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
