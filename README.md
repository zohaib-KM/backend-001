# backend-001

A Node.js/Express API with MongoDB, Redis caching, and real-time features.

## Features

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **CRUD Operations**: Complete CRUD for users, posts, and comments
- **Real-time**: Socket.IO integration for live updates
- **Caching**: Redis-based caching for improved performance
- **Rate Limiting**: Redis-backed rate limiting to prevent abuse
- **API Documentation**: Swagger/OpenAPI documentation
- **Docker Support**: Full Docker and Docker Compose setup

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Start the services:
   ```bash
   docker-compose up -d
   ```

The API will be available at `http://localhost:5000`

### Manual Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Redis (required):
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

3. Start the application:
   ```bash
   npm run serve
   ```

## API Endpoints

- **Authentication**
  - `POST /api/auth/register` - Register new user
  - `POST /api/auth/login` - Login user

- **Users** (Protected)
  - `GET /api/users` - Get all users (cached)
  - `GET /api/users/:id` - Get user by ID (cached)
  - `PUT /api/users/:id` - Update user
  - `DELETE /api/users/:id` - Delete user

- **Posts**
  - `GET /api/posts` - Get all posts (cached)
  - `GET /api/posts/:id` - Get post by ID (cached)
  - `POST /api/posts` - Create new post

- **Comments**
  - `GET /api/comments/post/:postId` - Get comments for post (cached)
  - `POST /api/comments` - Create new comment

- **Documentation**
  - `GET /api-docs` - Swagger API documentation
  - `GET /health` - Health check endpoint

## Environment Variables

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret_key
REDIS_URL=redis://redis:6379
```

## Redis Integration

This application uses Redis for:

- **Caching**: API responses are cached to improve performance
- **Rate Limiting**: Prevents API abuse with configurable limits
- **Session Storage**: Future enhancement for session management

### Cache Configuration

- **Posts**: 5 minutes cache duration
- **Users**: 5 minutes cache duration  
- **Individual Items**: 10 minutes cache duration
- **Comments**: 5 minutes cache duration

Cache is automatically invalidated when data is modified.

## Deployment

### GitHub Actions (Automated)

The project includes GitHub Actions workflows for automated deployment:

- **Development**: Triggers on push to `main` branch
- **Production**: Triggers on version tags or manual dispatch

Required GitHub Secrets:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
REDIS_PASSWORD=your_redis_password (for production)
```

### Manual Deployment

```bash
# Development deployment
./scripts/deploy.sh testapp-stack 2828 development

# Production deployment  
./scripts/deploy.sh testapp-prod 80 production

# Monitor services
./scripts/monitor.sh testapp-stack 2828
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start with custom port
HOST_PORT=2828 docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run serve

# The server will restart automatically on file changes
```
