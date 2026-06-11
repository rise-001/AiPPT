#!/bin/sh
set -e

cd /app
cd /app/backend
/app/.venv/bin/alembic upgrade head
exec /app/.venv/bin/python app.py
