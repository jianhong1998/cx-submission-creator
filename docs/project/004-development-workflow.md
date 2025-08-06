# 004 - Development Workflow

## Standard Development Process

1. Use `make up/build` for initial setup or when dependencies change
2. Use `make up` for subsequent starts
3. Application runs on http://localhost:3002 (default APP_PORT for local development)
4. Swagger documentation available at http://localhost:3002/docs
5. MCP SSE endpoints available for AI agent integration:
   - `GET http://localhost:3002/sse` - Establish MCP connection
   - `POST http://localhost:3002/sse/messages` - Send JSON-RPC messages
6. Code changes in `cx-mcp-server/src` trigger automatic reload
7. Run `make lint` and `make format` before committing changes

## MCP Tool Development Workflow

1. **Specification Review**: Start with docs/specifications/ for requirements
2. **Service Implementation**: Create services in external-services/services/
3. **DTO Creation**: Define DTOs in configs/mcp/dto/
4. **Tool Registration**: Add tools in configs/mcp/tools/
5. **Testing**: Write comprehensive unit and integration tests
6. **Documentation**: Update CLAUDE.md with new tool information

## Environment Setup for Development

- Ensure `BACKEND_HOSTNAME` is configured (defaults to localhost:8000)
- Verify external service endpoints are accessible
- Test authentication workflows in different environments