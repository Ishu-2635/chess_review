FROM python:3.11-slim

# Install Stockfish and system dependencies
RUN apt-get update && apt-get install -y \
    stockfish \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start the server
CMD ["uvicorn", "api.routes:app", "--host", "0.0.0.0", "--port", "8000"]
