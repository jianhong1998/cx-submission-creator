# CX Submission Creator

A Customer Experience (CX) submission creator project featuring a NestJS-based MCP (Model Context Protocol) server with enhanced SSE transport for AI agent integration, external services integration, and comprehensive customer experience data management.

## Project Structure

```
cx-submission-creator/
├── cx-mcp-server/           # NestJS application (main API server)
│   ├── src/                 # Source code
│   │   ├── external-services/  # External services integration module
│   │   │   └── services/    # Service implementations for external integrations
│   │   ├── configs/         # Configuration modules and services
│   │   │   └── mcp/         # MCP-specific configurations
│   │   ├── interfaces/      # TypeScript interfaces and types
│   │   └── sse/             # Server-Sent Events implementation for MCP transport
│   ├── test/                # Test files
│   ├── package.json         # Node.js dependencies
│   ├── tsconfig.json        # TypeScript configuration
│   ├── .env                 # Environment variables
│   └── Dockerfile           # Docker configuration for development
├── docker/
│   └── local/               # Local development Docker configurations
├── docs/                    # Project documentation
│   ├── specifications/      # Technical specifications and requirements
│   └── CHANGE_LOG.md        # Development history and changes
├── docker-compose.yml       # Docker Compose orchestration
├── Makefile                 # Development commands
├── CLAUDE.md               # Claude Code instructions
└── README.md               # This file
```

## Features

### CX MCP Server (NestJS)

- **Framework**: NestJS v11 with TypeScript
- **API Documentation**: Swagger UI available at `/docs`
- **Validation**: Global DTO validation with class-validator and class-transformer
- **Development**: Hot reload and watch mode support
- **Runtime**: Node.js 22
- **MCP Integration**: Enhanced Model Context Protocol server with SSE transport
- **MCP Endpoints**: 
  - `GET /sse` - Establish MCP SSE connection with proper transport handling
  - `POST /sse/messages` - Handle JSON-RPC messages via SSE transport
- **MCP Tools**: User account tools, HTTP tools, and external services integration
- **External Services Module**: Modular architecture for integrating with multiple external APIs and user account management
  - **Services Directory**: `external-services/services/` contains organized service implementations for external integrations
  - **User Account Service**: Located in `external-services/services/user-account.service.ts` for user account data and license management

### Key Dependencies

- `@nestjs/swagger` - API documentation
- `class-validator` & `class-transformer` - DTO validation and transformation
- `swagger-ui-express` - Swagger UI integration
- `@modelcontextprotocol/sdk` - Model Context Protocol server implementation
- SSE transport support for real-time AI agent communication

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 22 (if running locally)

### Environment Configuration

The application uses environment variables defined in `cx-mcp-server/.env`:

```env
NODE_ENV=development
APP_PORT=3001
```

### Running with Docker (Recommended)

1. **Start the development environment**:

```bash
docker-compose up --build
```

2. **Access the application**:

- API Server: http://localhost:3002 (configurable via APP_PORT)
- Swagger Documentation: http://localhost:3002/docs
- MCP SSE Endpoint: http://localhost:3002/sse (for AI agent connections)

3. **Development features**:

- File watching: Changes in `cx-mcp-server/src` automatically sync to container
- Auto-restart: Application restarts when `package.json` changes
- Hot reload: NestJS watch mode for instant code updates

### Running Locally

1. **Navigate to the NestJS app**:

```bash
cd cx-mcp-server
```

2. **Install dependencies**:

```bash
npm install
```

3. **Start development server**:

```bash
npm run start:dev
```

## Available Scripts (NestJS App)

```bash
npm run build         # Build the application
npm run start         # Start the application
npm run start:dev     # Start in development mode with watch
npm run start:debug   # Start in debug mode
npm run start:prod    # Start in production mode
npm run lint          # Run ESLint
npm run test          # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:cov      # Run tests with coverage
npm run test:e2e      # Run end-to-end tests
```

## Docker Configuration

### Development Dockerfile

- **Base Image**: `node:22-alpine`
- **Features**: Optimized for development with npm ci and hot reload
- **Port**: 3000 (mapped to host port via APP_PORT)

### Docker Compose

- **Service**: `cx-mcp-server`
- **Build Context**: `./cx-mcp-server`
- **Environment**: Configured via `.env` file
- **Volumes**: Source code sync for development
- **Watch Mode**: Automatic restart and sync on file changes

## API Documentation

Once the server is running, visit `/docs` for the complete Swagger API documentation. The API includes:

- Automatic request/response validation
- Interactive API testing
- Schema definitions for all DTOs

## MCP Integration

The server provides Model Context Protocol integration for AI agents:

### Available MCP Tools

- **list_users**: Retrieve all users and their account licenses from external services via the User Account Service
  - Returns comprehensive user information including professional licenses, roles, and account details
  - Utilizes the external-services module with services organized in dedicated subdirectories for scalable integration with multiple external APIs
  - No parameters required - fetches all available data

### MCP Connection

AI agents can connect to the MCP server via:
- **SSE Connection**: `GET /sse` - Establishes MCP SSE transport connection
- **Message Handling**: `POST /sse/messages` - Processes JSON-RPC messages via SSE transport

## TypeScript Configuration

- **Target**: ES2023
- **Module**: CommonJS
- **Features**: Decorators, strict null checks, incremental compilation
- **Source Maps**: Enabled for debugging
