# 002 - Architecture Overview

## Project Structure

- **cx-mcp-server/**: NestJS application (main API server)
  - **src/**: Source code directory
    - **configs/**: Configuration modules and services
      - **mcp/**: MCP-specific configuration, DTOs, and tools
        - **dto/**: Data Transfer Objects for MCP operations (includes authentication.dto.ts)
        - **tools/**: MCP tool definitions (account-licenses, HTTP tools, authentication.tools.ts)
    - **external-services/**: External services integration module
      - **services/**: Service implementations for external integrations
        - **user-account.service.ts**: User listing and account management
        - **authentication.service.ts**: User authentication service (planned)
    - **interfaces/**: TypeScript interfaces and types
      - **authentication.interface.ts**: Authentication-related interfaces (planned)
    - **sse/**: Server-Sent Events implementation for MCP transport
    - **session/**: Session management for authenticated users (planned)
- **docker/local/**: Development Docker configurations
- **docs/**: Project documentation
  - **specifications/**: Technical specifications and requirements
    - **spec-001-init-project/**: User listing tool specification (implemented)
    - **spec-002-login-tool/**: User authentication tool specification (planned)
- **docker-compose.yml**: Orchestrates development environment

## NestJS Application (cx-mcp-server)

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
  - **HTTP tools**: Generic HTTP request capabilities for external API interactions
  - **User Account tools**: Account license management and user discovery
  - **`list_users` tool**: Retrieves comprehensive user account data and professional credentials from external services
  - **`login_as_user` tool**: (Planned) Enables AI agents to authenticate as specific users for subsequent operations
  - **Customer Experience tools**: CRUD operations for customer experience data
- **Database Support**: Configurable database types (memory, file, MongoDB, PostgreSQL)
- **External Services Module**: Modular architecture for integrating with multiple external APIs and systems
  - **Services Directory**: Contains all external service implementations organized by functionality
  - **User Account Service**: Located in `external-services/services/` - manages user account data, licenses, and professional credentials from external services

## Key Configuration

- **TypeScript**: ES2023 target, CommonJS modules, decorators enabled, strictNullChecks enabled
- **Validation**: Global ValidationPipe with transform, whitelist, and forbidNonWhitelisted
- **Swagger**: Configured with DocumentBuilder for API documentation
- **Environment**: Uses .env file in cx-mcp-server directory
  - **Required Environment Variables**:
    - `BACKEND_HOSTNAME`: Backend service URL (required for external service integration)
    - `APP_PORT`: Application port (defaults to 3002)
    - `NODE_ENV`: Environment mode (defaults to 'development')
- **MCP Configuration**: Configurable via McpConfig class with database options and tool definitions