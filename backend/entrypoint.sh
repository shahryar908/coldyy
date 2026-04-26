#!/bin/sh
set -e

echo "Running prisma db push..."
prisma db push --skip-generate

echo "Starting server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
