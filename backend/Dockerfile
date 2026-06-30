FROM python:3.13-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create volume mount point for persistence
RUN mkdir -p /app/data
VOLUME ["/app/data"]

# Expose API port
EXPOSE 8000

# Start FastAPI application
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
