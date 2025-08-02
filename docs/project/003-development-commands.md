# 003 - Development Commands

## Docker Development (Recommended)

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

## NestJS Development (cx-mcp-server)

```bash
# Install dependencies
cd cx-mcp-server && npm ci
# or from root
make install

# Development with hot reload
cd cx-mcp-server && npm run start:dev

# Build application
cd cx-mcp-server && npm run build

# Linting and formatting (ALWAYS run before commits)
make lint          # Check lint issues
make lint/fix      # Fix lint issues automatically
make format        # Format code with Prettier

# Testing (Required for MCP tool development)
cd cx-mcp-server && npm run test           # Unit tests
cd cx-mcp-server && npm run test:watch     # Watch mode
cd cx-mcp-server && npm run test:cov       # With coverage (aim for 90%+)
cd cx-mcp-server && npm run test:debug     # Debug mode
# Note: Tests are located in src/ as .spec.ts files alongside source code

# MCP Tool Testing
# Test individual tools using MCP client or integration tests
# Verify authentication workflows end-to-end
```