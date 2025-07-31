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
cd cx-mcp-server && npm run test -- --testPathPattern=filename  # Single test file
```

## Architecture Overview

### Project Structure

- **cx-mcp-server/**: NestJS application (main API server)
  - **src/**: Source code directory
    - **external-services/**: External services integration module
      - **services/**: Service implementations for external integrations
    - **configs/**: Configuration modules and services
    - **interfaces/**: TypeScript interfaces and types
    - **sse/**: Server-Sent Events implementation for MCP transport
- **docker/local/**: Development Docker configurations
- **docs/**: Project documentation
  - **specifications/**: Technical specifications and requirements
- **docker-compose.yml**: Orchestrates development environment

### NestJS Application (cx-mcp-server)

- **Framework**: NestJS v11 with TypeScript
- **Port**: 3002 (default for local development, configurable via APP_PORT environment variable)
- **API Documentation**: Swagger UI available at `/docs`
- **Validation**: Global DTO validation using class-validator and class-transformer
- **Development**: Hot reload enabled with file watching
- **MCP Integration**: Model Context Protocol server with enhanced SSE transport
- **MCP Endpoints**:
  - `GET /sse` - Establish MCP SSE connection with proper transport handling
  - `POST /sse/messages` - Handle JSON-RPC messages via SSE transport
- **MCP Tools**:
  - HTTP tools for external API interactions
  - Account license tools for user management
  - `list_users` tool for retrieving user account data and professional credentials from external services
  - CRUD operations for customer experience data
- **Database Support**: Configurable database types (memory, file, MongoDB, PostgreSQL)
- **External Services Module**: Modular architecture for integrating with multiple external APIs and systems
  - **Services Directory**: Contains all external service implementations organized by functionality
  - **User Account Service**: Located in `external-services/services/` - manages user account data, licenses, and professional credentials from external services

### Key Configuration

- **TypeScript**: ES2023 target, CommonJS modules, decorators enabled
- **Validation**: Global ValidationPipe with transform, whitelist, and forbidNonWhitelisted
- **Swagger**: Configured with DocumentBuilder for API documentation
- **Environment**: Uses .env file in cx-mcp-server directory
- **MCP Configuration**: Configurable via McpConfig class with database options and tool definitions

### Docker Development Setup

- **Base Image**: node:22-alpine
- **File Watching**: Source code in `cx-mcp-server/src` syncs automatically
- **Auto-restart**: Application restarts when package.json changes
- **Port Mapping**: Host port configured via APP_PORT environment variable

## Development Workflow

1. Use `make up/build` for initial setup or when dependencies change
2. Use `make up` for subsequent starts
3. Application runs on http://localhost:3002 (default APP_PORT for local development)
4. Swagger documentation available at http://localhost:3002/docs
5. MCP SSE endpoints available for AI agent integration:
   - `GET http://localhost:3002/sse` - Establish MCP connection
   - `POST http://localhost:3002/sse/messages` - Send JSON-RPC messages
6. Code changes in `cx-mcp-server/src` trigger automatic reload
7. Run `make lint` and `make format` before committing changes

## MCP Tools Available

### User Account Tools

- **list_users**: Retrieve all users and their account licenses from external services via the User Account Service
  - Returns comprehensive user information including professional licenses, roles, and account details
  - Utilizes the external-services module for scalable integration with multiple external APIs
  - No parameters required - fetches all available data

### HTTP Tools

- Generic HTTP request capabilities for external API interactions
- Support for various HTTP methods and data formats

## Development Best Practices

- Always format code with prettier or command `make format`

## Commit Message Guidelines
- **STRICTLY NO Claude attribution**: Never include "Generated with Claude", "Claude Code", or "Co-Authored-By: Claude" in commit messages
- **Clean commit messages only**: Commit messages should contain only the actual change description without AI tool attribution
- **Follow conventional commit format**: Use feat:, fix:, refactor:, docs:, etc. prefixes where appropriate
- **Focus on the change, not the tool**: Describe what was changed and why, not how it was created
