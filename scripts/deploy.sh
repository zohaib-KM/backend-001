#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME=${1:-testapp-stack}
HOST_PORT=${2:-2828}
ENVIRONMENT=${3:-development}

echo -e "${BLUE}=== Deploying $PROJECT_NAME ($ENVIRONMENT) ===${NC}"
echo "Host Port: $HOST_PORT"
echo "Timestamp: $(date)"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please update .env with your actual values before continuing.${NC}"
        exit 1
    else
        echo -e "${RED}❌ No .env.example found. Please create .env manually.${NC}"
        exit 1
    fi
fi

# Stop existing services
echo -e "${BLUE}=== Stopping existing services ===${NC}"
docker-compose -p $PROJECT_NAME down 2>/dev/null || true

# Remove old images
echo -e "${BLUE}=== Cleaning up old images ===${NC}"
docker image prune -f
docker rmi $(docker images "${PROJECT_NAME}_*" -q) 2>/dev/null || true

# Set HOST_PORT environment variable
export HOST_PORT=$HOST_PORT

# Build and start services
echo -e "${BLUE}=== Building and starting services ===${NC}"
if [ "$ENVIRONMENT" == "production" ]; then
    docker-compose -f docker-compose.prod.yml -p $PROJECT_NAME up -d --build
else
    docker-compose -p $PROJECT_NAME up -d --build
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start services${NC}"
    exit 1
fi

# Wait for services
echo -e "${BLUE}=== Waiting for services to be ready ===${NC}"
sleep 30

# Health check
echo -e "${BLUE}=== Running health check ===${NC}"
for i in {1..10}; do
    if curl -f -s http://localhost:$HOST_PORT/health > /dev/null; then
        echo -e "${GREEN}✅ Application is healthy!${NC}"
        break
    else
        echo -e "${YELLOW}⏳ Waiting for application... (attempt $i/10)${NC}"
        if [ $i -eq 10 ]; then
            echo -e "${RED}❌ Application failed to start properly${NC}"
            echo -e "${BLUE}=== Application Logs ===${NC}"
            docker-compose -p $PROJECT_NAME logs app
            exit 1
        fi
        sleep 10
    fi
done

# Show status
echo -e "${BLUE}=== Deployment Status ===${NC}"
docker-compose -p $PROJECT_NAME ps

echo ""
echo -e "${BLUE}=== Health Check Results ===${NC}"
curl -s http://localhost:$HOST_PORT/health | jq '.' || echo "Health check response not in JSON format"

echo ""
echo -e "${GREEN}🚀 Deployment completed successfully!${NC}"
echo -e "${GREEN}Application is running at: http://localhost:$HOST_PORT${NC}"
echo -e "${GREEN}API Documentation: http://localhost:$HOST_PORT/api-docs${NC}"
echo -e "${GREEN}Health Check: http://localhost:$HOST_PORT/health${NC}"

echo ""
echo -e "${BLUE}=== Useful Commands ===${NC}"
echo "Monitor services: ./scripts/monitor.sh $PROJECT_NAME $HOST_PORT"
echo "View logs: docker-compose -p $PROJECT_NAME logs -f"
echo "Stop services: docker-compose -p $PROJECT_NAME down"
echo "Restart services: docker-compose -p $PROJECT_NAME restart"