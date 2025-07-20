# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Docker Development (Recommended)
```bash
# Start development environment with auto-rebuild
make up/build
# or
docker-compose up --build

# Start without rebuild
make up

# Stop services and clean images
make down

# Complete cleanup (services, volumes, images)
make down/clean
```

### NestJS Development (cx-mcp-server)
```bash
# Install dependencies
cd cx-mcp-server && npm ci
# or from root
make install

# Development with hot reload
cd cx-mcp-server && npm run start:dev

# Build application
cd cx-mcp-server && npm run build

# Linting and formatting
make lint          # Check lint issues
make lint/fix      # Fix lint issues automatically  
make format        # Format code with Prettier

# Testing
cd cx-mcp-server && npm run test           # Unit tests
cd cx-mcp-server && npm run test:watch     # Watch mode
cd cx-mcp-server && npm run test:cov       # With coverage
cd cx-mcp-server && npm run test:e2e       # End-to-end tests
```

## Architecture Overview

### Project Structure
- **cx-mcp-server/**: NestJS application (main API server)
- **docker/local/**: Development Docker configurations
- **docker-compose.yml**: Orchestrates development environment

### NestJS Application (cx-mcp-server)
- **Framework**: NestJS v11 with TypeScript
- **Port**: 3000 (configurable via APP_PORT environment variable)
- **API Documentation**: Swagger UI available at `/docs`
- **Validation**: Global DTO validation using class-validator and class-transformer
- **Development**: Hot reload enabled with file watching

### Key Configuration
- **TypeScript**: ES2023 target, CommonJS modules, decorators enabled
- **Validation**: Global ValidationPipe with transform, whitelist, and forbidNonWhitelisted
- **Swagger**: Configured with DocumentBuilder for API documentation
- **Environment**: Uses .env file in cx-mcp-server directory

### Docker Development Setup
- **Base Image**: node:22-alpine
- **File Watching**: Source code in `cx-mcp-server/src` syncs automatically
- **Auto-restart**: Application restarts when package.json changes
- **Port Mapping**: Host port configured via APP_PORT environment variable

## Development Workflow

1. Use `make up/build` for initial setup or when dependencies change
2. Use `make up` for subsequent starts
3. Application runs on http://localhost:3001 (default APP_PORT)
4. Swagger documentation available at http://localhost:3001/docs
5. Code changes in `cx-mcp-server/src` trigger automatic reload
6. Run `make lint` before committing changes