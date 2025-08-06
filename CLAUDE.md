# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Documentation

For detailed project information, refer to the organized documentation in `docs/project/`:

- **[001-project-overview.md](docs/project/001-project-overview.md)** - Project description, business context, and goals
- **[002-architecture.md](docs/project/002-architecture.md)** - System architecture, project structure, and NestJS application details
- **[003-development-commands.md](docs/project/003-development-commands.md)** - Docker and NestJS development commands
- **[004-development-workflow.md](docs/project/004-development-workflow.md)** - Standard development process and MCP tool development workflow
- **[005-mcp-tools.md](docs/project/005-mcp-tools.md)** - Available MCP tools and user management workflow

## Development Best Practices

### Code Quality

- Always format code with prettier or command `make format`
- Follow SOLID and DRY principles (per TypeScript best practices)
- Never use `any` type - maintain strict TypeScript typing
- Use class-validator for DTO validation following existing patterns

### MCP Tool Development

- Follow existing patterns from UserAccountService for HTTP requests
- Use standardized response formats for consistency
- Implement comprehensive error handling with appropriate log levels
- Include 5-second timeout for external service requests
- Use dependency injection for service integration

### Testing Strategy

- Unit tests for all service methods
- Integration tests for complete authentication flows
- Error scenario testing for edge cases
- Minimum 90% code coverage for new components

### Security Considerations

- Validate all inputs to prevent injection attacks
- Use secure session management practices
- Never expose sensitive authentication details in error messages
- Log authentication attempts without exposing credentials

## Commit Message Guidelines

- **STRICTLY NO Claude attribution**: Never include "Generated with Claude", "Claude Code", or "Co-Authored-By: Claude" in commit messages
- **Clean commit messages only**: Commit messages should contain only the actual change description without AI tool attribution
- **Follow conventional commit format**: Use feat:, fix:, refactor:, docs:, etc. prefixes where appropriate
- **Focus on the change, not the tool**: Describe what was changed and why, not how it was created

## Sub Agent Usage

- Always use sub agents if there are available sub agents that specialised to the task given
