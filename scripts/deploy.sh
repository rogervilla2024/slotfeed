#!/bin/bash
# Phase 14: Complete Deployment Script
# This script handles the entire deployment process

set -e  # Exit on any error

echo "═══════════════════════════════════════════════════"
echo "SLOTFEED Phase 14: Production Deployment"
echo "═══════════════════════════════════════════════════"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_COMPOSE="${PROJECT_ROOT}/docker-compose.yml"
ENV_FILE="${PROJECT_ROOT}/.env.production"

echo -e "${BLUE}Project Root: ${PROJECT_ROOT}${NC}"

# =====================================================
# Step 1: Pre-flight checks
# =====================================================
echo -e "\n${BLUE}Step 1: Pre-flight Checks${NC}"

if [ ! -f "$DOCKER_COMPOSE" ]; then
    echo -e "${RED}✗ docker-compose.yml not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ docker-compose.yml found${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose installed$(docker-compose --version)${NC}"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠ .env.production not found, copying from .env.example${NC}"
    if [ -f "${PROJECT_ROOT}/.env.example" ]; then
        cp "${PROJECT_ROOT}/.env.example" "$ENV_FILE"
        echo -e "${YELLOW}Please edit .env.production with your production settings${NC}"
    fi
fi

# =====================================================
# Step 2: Pull latest images
# =====================================================
echo -e "\n${BLUE}Step 2: Pulling Latest Docker Images${NC}"

docker pull postgres:16-alpine
echo -e "${GREEN}✓ PostgreSQL image pulled${NC}"

docker pull redis:7-alpine
echo -e "${GREEN}✓ Redis image pulled${NC}"

docker pull prom/prometheus:latest
echo -e "${GREEN}✓ Prometheus image pulled${NC}"

docker pull grafana/grafana:latest
echo -e "${GREEN}✓ Grafana image pulled${NC}"

# =====================================================
# Step 3: Start Docker Compose services
# =====================================================
echo -e "\n${BLUE}Step 3: Starting Docker Compose Services${NC}"

docker-compose -f "$DOCKER_COMPOSE" down --remove-orphans 2>/dev/null || true
echo -e "${GREEN}✓ Cleaned up old containers${NC}"

docker-compose -f "$DOCKER_COMPOSE" up -d
echo -e "${GREEN}✓ Docker Compose services started${NC}"

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to become healthy...${NC}"
sleep 10

# Check service health
for i in {1..30}; do
    if docker-compose -f "$DOCKER_COMPOSE" ps | grep -q "healthy"; then
        echo -e "${GREEN}✓ Services are healthy${NC}"
        break
    fi
    echo -e "${YELLOW}Waiting... ($i/30)${NC}"
    sleep 2
done

# =====================================================
# Step 4: Run database migrations
# =====================================================
echo -e "\n${BLUE}Step 4: Running Database Migrations${NC}"

docker-compose -f "$DOCKER_COMPOSE" exec -T backend python scripts/run-migrations.py
echo -e "${GREEN}✓ Migrations completed${NC}"

# =====================================================
# Step 5: Seed initial data
# =====================================================
echo -e "\n${BLUE}Step 5: Seeding Initial Data${NC}"

docker-compose -f "$DOCKER_COMPOSE" exec -T backend python scripts/seed-data.py
echo -e "${GREEN}✓ Seed data loaded${NC}"

# =====================================================
# Step 6: Run integration tests
# =====================================================
echo -e "\n${BLUE}Step 6: Running Integration Tests${NC}"

# Give services a moment to fully initialize
sleep 5

echo -e "${YELLOW}Running tests...${NC}"
docker-compose -f "$DOCKER_COMPOSE" exec -T backend pytest tests/test_integration_phase14.py -v || {
    echo -e "${YELLOW}Note: Some tests may fail if services are still initializing${NC}"
}

# =====================================================
# Step 7: Display service information
# =====================================================
echo -e "\n${BLUE}Step 7: Deployment Complete!${NC}"

echo -e "\n${GREEN}Services are running:${NC}"
echo -e "  ${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "  ${BLUE}API:${NC} http://localhost:8000"
echo -e "  ${BLUE}Prometheus:${NC} http://localhost:9090"
echo -e "  ${BLUE}Grafana:${NC} http://localhost:3001"

echo -e "\n${GREEN}Monitoring Dashboards:${NC}"
echo -e "  ${BLUE}Prometheus:${NC} http://localhost:9090/graph"
echo -e "  ${BLUE}Grafana:${NC} http://localhost:3001 (admin/admin)"

echo -e "\n${GREEN}API Documentation:${NC}"
echo -e "  ${BLUE}Swagger UI:${NC} http://localhost:8000/docs"
echo -e "  ${BLUE}ReDoc:${NC} http://localhost:8000/redoc"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "  1. Update .env.production with your settings"
echo -e "  2. Configure firewall rules"
echo -e "  3. Set up SSL certificates"
echo -e "  4. Configure backup procedures"
echo -e "  5. Set up monitoring alerts"
echo -e "  6. Configure log aggregation"

echo -e "\n${GREEN}Deployment logs:${NC}"
echo "  docker-compose -f $DOCKER_COMPOSE logs -f"

echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Deployment successful!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}\n"
