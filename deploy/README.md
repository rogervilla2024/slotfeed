# SLOTFEED Deployment Guide

## Server Setup

Server: 91.244.197.205 (liveslotdata.com)

### 1. Copy Files to Server

From your local machine, sync the project:

```bash
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '__pycache__' --exclude 'venv' \
  ./stream/ root@91.244.197.205:/opt/slotfeed/
```

### 2. Install Dependencies

SSH into server and install:

```bash
ssh root@91.244.197.205

# Backend dependencies
cd /opt/slotfeed/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install cloudscraper paddlepaddle paddleocr streamlink opencv-python-headless

# Frontend dependencies
cd /opt/slotfeed/frontend
npm install
npm run build
```

### 3. Set Up Systemd Services

```bash
# Copy service files
cp /opt/slotfeed/deploy/systemd/*.service /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Enable services
systemctl enable slotfeed-backend
systemctl enable slotfeed-kick-sync

# Start services
systemctl start slotfeed-backend
systemctl start slotfeed-kick-sync
```

### 4. Verify Services

```bash
# Check status
systemctl status slotfeed-backend
systemctl status slotfeed-kick-sync

# View logs
journalctl -u slotfeed-backend -f
journalctl -u slotfeed-kick-sync -f
```

## Services Overview

### slotfeed-backend
- FastAPI application
- Port: 8000
- Handles API requests

### slotfeed-kick-sync
- Kick Live Stream Sync Worker
- Monitors 15 Tier 1 streamers
- Creates sessions in database when streamers go live
- Updates viewer counts in real-time

### slotfeed-ocr-daemon (Optional)
- OCR processing daemon
- Captures stream frames and extracts balance/bet/win data
- Requires FFmpeg and Streamlink

## Monitoring

### Health Check Endpoints

```bash
# Backend health
curl https://liveslotdata.com/health

# Kick API status
curl https://liveslotdata.com/api/v1/kick/status

# Live streams
curl https://liveslotdata.com/api/v1/kick/live
```

### Manual Sync

```bash
# Sync all streamers
curl -X POST https://liveslotdata.com/api/v1/kick/sync-all

# Sync single streamer
curl https://liveslotdata.com/api/v1/kick/sync/roshtein
```

## Troubleshooting

### Service won't start

```bash
# Check logs
journalctl -u slotfeed-kick-sync -n 100

# Check Python path
/opt/slotfeed/backend/venv/bin/python -c "import app.main"
```

### Database connection issues

```bash
# Test database
cd /opt/slotfeed/backend
source venv/bin/activate
python -c "from app.core.config import settings; print(settings.DATABASE_URL)"
```

### Kick API rate limiting

The Kick API has undocumented rate limits. If you see 429 errors:
- Increase `batch_delay` in kick_sync_worker.py
- Reduce sync frequency

## Data Flow

1. **Kick Sync Worker** monitors Kick API every 60 seconds
2. When a streamer goes live, it creates a Session record
3. Session data is available via `/api/v1/live/streams`
4. Frontend polls `/api/v1/live/streams` every 30 seconds

## OCR Pipeline (Parallel Processing)

The OCR system processes 10+ concurrent streams using a distributed worker architecture.

### Architecture
```
Stream Coordinator → Redis Queue → 6x OCR Workers → Result Publisher → Database
                                                                    → WebSocket
```

### Prerequisites

```bash
# Install system dependencies
apt install ffmpeg redis-server

# Install Python packages
pip install paddlepaddle paddleocr opencv-python-headless redis cloudscraper
```

### Setup OCR System

```bash
# Install service files
chmod +x /opt/slotfeed/deploy/manage_ocr.sh
/opt/slotfeed/deploy/manage_ocr.sh install

# Start OCR system (6 workers)
/opt/slotfeed/deploy/manage_ocr.sh start

# Or start with worker manager (alternative)
/opt/slotfeed/deploy/manage_ocr.sh start managed

# Enable for auto-start on boot
/opt/slotfeed/deploy/manage_ocr.sh enable
```

### OCR Services

| Service | Description | Resource Usage |
|---------|-------------|----------------|
| slotfeed-coordinator | Monitors Kick API, creates jobs | ~200MB RAM |
| slotfeed-publisher | Batches results to DB, WebSocket | ~200MB RAM |
| slotfeed-ocr-worker@{1-6} | OCR processing (6 instances) | ~500MB each |

### Monitoring OCR System

```bash
# View status of all OCR services
/opt/slotfeed/deploy/manage_ocr.sh status

# View coordinator logs
/opt/slotfeed/deploy/manage_ocr.sh logs coordinator

# View specific worker logs
/opt/slotfeed/deploy/manage_ocr.sh logs worker 2

# Health check endpoints
curl https://liveslotdata.com/api/v1/health/workers
curl https://liveslotdata.com/api/v1/health/queue
curl https://liveslotdata.com/api/v1/health/ocr
curl https://liveslotdata.com/api/v1/health/full

# OCR status with real-time data
curl https://liveslotdata.com/api/v1/live/ocr-status
```

### Managing Workers

```bash
# Stop all OCR services
/opt/slotfeed/deploy/manage_ocr.sh stop

# Restart specific worker
/opt/slotfeed/deploy/manage_ocr.sh restart-worker 3

# Change worker count (restart required)
NUM_WORKERS=4 /opt/slotfeed/deploy/manage_ocr.sh restart
```

### Redis Queue Inspection

```bash
# View queue depths
redis-cli LLEN ocr:jobs:high      # High priority queue
redis-cli LLEN ocr:jobs:normal    # Normal priority queue

# View active streams
redis-cli SMEMBERS ocr:active

# View worker heartbeats
redis-cli HGETALL ocr:workers:heartbeat

# View processing stats
redis-cli HGETALL ocr:stats
```

### Troubleshooting OCR

```bash
# PaddleOCR memory issues
# Reduce OMP_NUM_THREADS in service file (default: 2)

# Worker keeps crashing
journalctl -u slotfeed-ocr-worker@1 -n 200

# Queue backing up
# Check if workers are healthy, increase NUM_WORKERS if needed

# No results being published
journalctl -u slotfeed-publisher -f
```
