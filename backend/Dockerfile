FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libatomic1 && rm -rf /var/lib/apt/lists/*

# Install Python deps — cached layer as long as requirements.txt unchanged
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the schema first — prisma generate re-runs only if schema changes
COPY prisma/ ./prisma/
RUN prisma generate --no-engine

# Copy rest of app
COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
