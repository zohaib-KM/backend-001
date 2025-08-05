#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_NAME=${1:-testapp-stack}
HOST_PORT=${2:-2828}

echo -e "${BLUE}=== Monitoring $PROJECT_NAME ===${NC}"
echo "Timestamp: $(date)"
echo ""

# Check if services are running
echo -e "${BLUE}=== Service Status ===${NC}"
if docker-compose -p $PROJECT_NAME ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running${NC}"
    docker-compose -p $PROJECT_NAME ps
else
    echo -e "${RED}❌ Services are not running${NC}"
    docker-compose -p $PROJECT_NAME ps
    exit 1
fi

echo ""

# Health check
echo -e "${BLUE}=== Application Health Check ===${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:$HOST_PORT/health 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Application is responding${NC}"
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
    
    # Check individual services
    if echo "$HEALTH_RESPONSE" | jq -e '.services.mongodb == "connected"' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MongoDB: Connected${NC}"
    else
        echo -e "${RED}❌ MongoDB: Disconnected${NC}"
    fi
    
    if echo "$HEALTH_RESPONSE" | jq -e '.services.redis == "connected"' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis: Connected${NC}"
    else
        echo -e "${YELLOW}⚠️ Redis: Disconnected${NC}"
    fi
else
    echo -e "${RED}❌ Application is not responding${NC}"
fi

echo ""

# Resource usage
echo -e "${BLUE}=== Resource Usage ===${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" $(docker-compose -p $PROJECT_NAME ps -q) 2>/dev/null

echo ""

# Recent logs
echo -e "${BLUE}=== Recent Application Logs (last 10 lines) ===${NC}"
docker-compose -p $PROJECT_NAME logs --tail=10 app 2>/dev/null

echo ""

# Redis info
echo -e "${BLUE}=== Redis Information ===${NC}"
REDIS_INFO=$(docker-compose -p $PROJECT_NAME exec -T redis redis-cli info server 2>/dev/null | grep -E "redis_version|uptime_in_seconds|connected_clients")
if [ $? -eq 0 ]; then
    echo "$REDIS_INFO"
    
    # Cache statistics
    echo -e "${BLUE}=== Cache Statistics ===${NC}"
    CACHE_KEYS=$(docker-compose -p $PROJECT_NAME exec -T redis redis-cli --scan --pattern "cache:*" 2>/dev/null | wc -l)
    echo "Cached items: $CACHE_KEYS"
else
    echo -e "${RED}❌ Cannot connect to Redis${NC}"
fi

echo ""
echo -e "${BLUE}=== Monitoring Complete ===${NC}"