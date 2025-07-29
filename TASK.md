# Task Breakdown for CX-MCP-Server User Listing Tool

## Overview
Based on the completed investigation and SPEC.md documentation, this document breaks down the implementation into specific, actionable tasks for AI agents to work on independently.

---

## Phase 1: Foundation Setup

### Task 1.1: Environment Configuration Setup
**Agent Type**: Backend Configuration Specialist
**Estimated Time**: 30 minutes
**Dependencies**: None

**Description**: Set up environment variable handling for external services hostname configuration.

**Specific Actions**:
1. Add `BACKEND_HOSTNAME` environment variable to the NestJS configuration
2. Update the `.env.example` file in `cx-mcp-server` directory with:
   ```
   BACKEND_HOSTNAME=http://localhost:8000
   ```
3. Create or update ConfigService configuration to include this variable
4. Add environment variable validation to ensure URL format is correct
5. Set default fallback value for local development

**Acceptance Criteria**:
- Environment variable is properly loaded via ConfigService
- URL format validation is implemented
- Default value works for local development
- Configuration follows existing NestJS patterns in the codebase

**Files to Modify**:
- `cx-mcp-server/.env.example`
- `cx-mcp-server/src/config/` (configuration files)
- Any existing environment validation files

---

### Task 1.2: TypeScript Interface Definitions
**Agent Type**: TypeScript Interface Specialist
**Estimated Time**: 30 minutes
**Dependencies**: Task 1.1

**Description**: Create TypeScript interfaces based on the investigated API response structure.

**Specific Actions**:
1. Create interfaces for the account licenses endpoint response:
   - `AccountLicense` interface
   - `ProfessionalLicense` interface  
   - `AvailableRole` interface
2. Create response wrapper interfaces:
   - `AccountLicensesSuccessResponse` interface
   - `AccountLicensesErrorResponse` interface
3. Add JSDoc comments explaining each field
4. Export interfaces from appropriate module

**Response Structure Reference**:
```typescript
interface AccountLicense {
  accountUuid: string;
  accountName: string;
  identificationNumber: string;
  accountCompanyUEN?: string;
  professionalLicenses: ProfessionalLicense[];
  availableRolesForAccountLicenses: AvailableRole[];
}

interface ProfessionalLicense {
  uuid: string;
  registrar: string;
  regNumber: string;
  valid: string; // ISO date string
  specialty: string | null;
}

interface AvailableRole {
  roleKey: string;
  regNumber: string | null;
}
```

**Acceptance Criteria**:
- All interfaces match the investigated API response exactly
- Proper TypeScript types (no `any` types)
- JSDoc documentation for each interface and field
- Interfaces are properly exported and importable

**Files to Create**:
- `cx-mcp-server/src/interfaces/account-license.interface.ts` (or similar location)

---

## Phase 2: HTTP Service Implementation

### Task 2.1: HTTP Client Service
**Agent Type**: API Integration Specialist
**Estimated Time**: 45 minutes
**Dependencies**: Tasks 1.1, 1.2

**Description**: Create a UserAccountService class within the external-services module to handle HTTP requests to external user account services.

**Specific Actions**:
1. Create `UserAccountService` class within the external-services module using NestJS patterns
2. Inject ConfigService to get the hostname from environment variables
3. Implement HTTP client using axios or similar library (check existing patterns in codebase)
4. Add method `getUserAccountLicenses()` that:
   - Constructs the full URL using configured hostname
   - Makes GET request to `/services/uat/project-team-builder/account-licenses`
   - Returns properly typed response
   - Handles timeout (5 seconds as per requirements)
5. Implement proper error handling for different HTTP status codes
6. Add logging for debugging and monitoring

**Technical Requirements**:
- Use dependency injection for ConfigService
- Follow existing HTTP client patterns in the codebase
- Implement timeout handling (5 seconds max)
- Return properly typed responses using the interfaces from Task 1.2
- Handle rate limiting headers appropriately

**Acceptance Criteria**:
- UserAccountService follows NestJS dependency injection patterns within external-services module
- HTTP requests use configured hostname from environment variables
- Proper error handling for 4XX, 5XX, and network errors
- Response timeout set to 5 seconds
- getUserAccountLicenses() method returns properly typed data
- Comprehensive logging for debugging

**Files to Create**:
- `cx-mcp-server/src/external-services/user-account.service.ts`

---

### Task 2.2: Error Handling and Response Transformation
**Agent Type**: Error Handling Specialist
**Estimated Time**: 30 minutes
**Dependencies**: Task 2.1

**Description**: Implement comprehensive error handling and response transformation logic.

**Specific Actions**:
1. Create error transformation logic to convert HTTP errors into standardized format
2. Handle specific error scenarios:
   - 403 Forbidden (NOT_LOGGED_IN errors)
   - 404 Not Found
   - 500 Server errors
   - Network timeouts
   - Connection failures
3. Transform successful responses into the standardized format:
   ```typescript
   {
     success: true,
     data: AccountLicense[]
   }
   ```
4. Transform error responses into standardized format:
   ```typescript
   {
     success: false,
     error: {
       type: "CLIENT_ERROR" | "SERVER_ERROR" | "NETWORK_ERROR",
       statusCode: number,
       message: string,
       details?: any
     }
   }
   ```
5. Add appropriate logging for each error type

**Acceptance Criteria**:
- All error types are properly caught and transformed
- Standardized response format is consistently used
- Error messages are descriptive and helpful for debugging
- Logging includes correlation IDs when available
- No sensitive information is exposed in error messages

**Files to Modify**:
- `cx-mcp-server/src/external-services/user-account.service.ts`

---

## Phase 3: MCP Tool Implementation

### Task 3.1: MCP Tool Registration
**Agent Type**: MCP Integration Specialist  
**Estimated Time**: 45 minutes
**Dependencies**: Tasks 2.1, 2.2

**Description**: Create and register the MCP tool for listing users within the existing MCP framework.

**Specific Actions**:
1. Study existing MCP tool implementations in the codebase to understand patterns
2. Create a new MCP tool with the name `list_users` or `get_account_licenses`
3. Define tool metadata:
   - Name: descriptive and clear for AI agents
   - Description: explain what the tool does and what data it returns
   - Parameters: none required for this tool
4. Implement the tool handler that:
   - Calls the UserAccountService.getUserAccountLicenses() method
   - Returns the response in MCP-compatible format
   - Handles errors appropriately
5. Register the tool in the MCP framework
6. Ensure the tool appears in MCP tool listings

**Technical Requirements**:
- Follow existing MCP tool patterns in the codebase
- Use dependency injection to get UserAccountService from external-services module
- Return data in format expected by MCP framework
- Tool should be discoverable by AI agents

**Acceptance Criteria**:
- Tool is properly registered and discoverable
- Tool handler calls the HTTP service correctly
- Responses are formatted for MCP framework
- Error handling works within MCP context
- Tool appears in MCP tool listings
- Tool description is clear for AI agent usage

**Files to Create/Modify**:
- New MCP tool file (location based on existing patterns)
- MCP tool registration files (update existing registries)

---

### Task 3.2: MCP Tool Testing and Integration
**Agent Type**: Integration Testing Specialist
**Estimated Time**: 30 minutes  
**Dependencies**: Task 3.1

**Description**: Test the MCP tool integration and ensure it works properly within the MCP framework.

**Specific Actions**:
1. Test the tool through the MCP interface (SSE endpoint at `/sse`)
2. Verify tool appears in available tools list
3. Test successful data retrieval scenarios
4. Test error scenarios (service unavailable, timeouts, etc.)
5. Verify response format matches MCP expectations
6. Test with different environment configurations
7. Validate that AI agents can discover and use the tool

**Testing Scenarios**:
- Tool discovery via MCP
- Successful data retrieval
- Service unavailable error
- Network timeout error
- Invalid hostname configuration
- Rate limiting scenarios

**Acceptance Criteria**:
- Tool is discoverable via MCP SSE endpoint
- Successful requests return properly formatted data
- Error scenarios are handled gracefully
- Tool works with different environment configurations
- Response times are within acceptable limits (< 5 seconds)
- Tool can be used by AI agents without issues

**Files to Modify**:
- Integration test files (if they exist)
- Documentation for the new tool

---

## Phase 4: Testing and Documentation

### Task 4.1: Unit Tests Implementation
**Agent Type**: Unit Testing Specialist
**Estimated Time**: 60 minutes
**Dependencies**: Tasks 2.1, 2.2, 3.1

**Description**: Create comprehensive unit tests for all implemented components.

**Specific Actions**:
1. Study existing test patterns in the codebase (check for Jest, testing utilities)
2. Create unit tests for UserAccountService:
   - Test successful API calls with getUserAccountLicenses() method
   - Test error handling for different HTTP status codes
   - Test timeout scenarios
   - Test configuration loading
   - Mock HTTP client for isolated testing
3. Create unit tests for MCP tool:
   - Test tool registration
   - Test tool handler execution
   - Test error propagation
   - Mock service dependencies
4. Add test utilities for mocking external dependencies
5. Ensure tests follow existing patterns and conventions

**Testing Coverage Requirements**:
- 100% coverage for service methods
- All error scenarios covered
- Configuration loading tested
- MCP tool handler tested
- Edge cases covered (empty responses, malformed data)

**Acceptance Criteria**:
- All tests pass consistently
- High test coverage (>90%)
- Tests follow existing project patterns
- Tests are isolated and don't require external services
- Proper mocking of HTTP calls and dependencies
- Tests can be run with existing test commands

**Files to Create**:
- `cx-mcp-server/src/external-services/user-account.service.spec.ts`
- MCP tool test files (location based on existing patterns)
- Any required test utility files

---

### Task 4.2: Integration Tests
**Agent Type**: E2E Testing Specialist
**Estimated Time**: 45 minutes
**Dependencies**: Tasks 3.1, 3.2

**Description**: Create end-to-end integration tests that verify the complete workflow.

**Specific Actions**:
1. Check existing integration test setup in the codebase
2. Create integration tests that:
   - Start the application with test configuration
   - Test the MCP tool through the SSE endpoint
   - Verify complete request/response cycle
   - Test with real HTTP calls to localhost:8000 (if available)
   - Test error scenarios with unavailable endpoints
3. Add test configuration for integration environment
4. Ensure tests can run in CI/CD pipeline
5. Add test documentation explaining how to run integration tests

**Test Scenarios**:
- Complete MCP tool workflow with real HTTP calls
- Error handling with unavailable external service
- Configuration changes and their impact
- Performance testing (response times)

**Acceptance Criteria**:
- Integration tests can run independently
- Tests verify complete end-to-end functionality
- Tests work with and without external service availability
- Tests can be included in CI/CD pipeline
- Clear documentation on running integration tests

**Files to Create**:
- `cx-mcp-server/test/integration/` (or similar location)
- Integration test configuration files

---

### Task 4.3: Documentation and Code Cleanup
**Agent Type**: Documentation Specialist
**Estimated Time**: 30 minutes
**Dependencies**: All previous tasks

**Description**: Create comprehensive documentation and perform final code cleanup.

**Specific Actions**:
1. Add JSDoc comments to all public methods and classes
2. Create or update README sections explaining the new tool
3. Document environment variable setup requirements
4. Create usage examples for AI agents
5. Document error scenarios and troubleshooting
6. Run linting and formatting tools (`make lint/fix`, `make format`)
7. Perform final code review for consistency with project standards
8. Update any relevant API documentation (Swagger docs if applicable)

**Documentation Requirements**:
- Clear setup instructions for environment variables
- Examples of using the MCP tool
- Troubleshooting guide for common issues
- API documentation updates
- Code comments for complex logic

**Acceptance Criteria**:
- All code follows project formatting standards
- Comprehensive JSDoc comments
- Clear documentation for setup and usage
- Examples are tested and working
- No linting errors
- Documentation is accessible to both developers and AI agents

**Files to Create/Modify**:
- Update relevant README sections
- API documentation updates
- Code comment improvements
- Any troubleshooting documentation

---

## Quality Assurance Checklist

Before considering the implementation complete, verify:

### Functional Requirements
- [ ] Tool successfully retrieves user data from configurable endpoint
- [ ] Tool works with different hostnames via environment variable  
- [ ] Tool returns complete JSON response without modification
- [ ] Tool handles 4XX errors appropriately with descriptive messages
- [ ] Tool handles 5XX errors appropriately with descriptive messages
- [ ] Tool handles network/timeout errors gracefully
- [ ] Tool integrates properly with MCP framework
- [ ] Environment variable configuration works correctly

### Technical Requirements  
- [ ] Code follows project TypeScript standards (no `any` types)
- [ ] Proper error handling and logging implemented
- [ ] Configuration management follows NestJS patterns
- [ ] Tool documentation is complete and accurate
- [ ] Unit tests cover all scenarios including configuration
- [ ] Integration tests validate end-to-end functionality
- [ ] Response schema investigation completed and documented
- [ ] All linting and formatting checks pass
- [ ] Performance requirements met (< 5 seconds response time)

### Code Quality
- [ ] SOLID principles followed
- [ ] DRY code principle applied
- [ ] Descriptive variable names used
- [ ] No duplicated code
- [ ] Proper separation of concerns
- [ ] Consistent with existing codebase patterns

---

## Notes for AI Agents

### Working with This Codebase
- Always run `make format` before committing changes
- Follow existing NestJS patterns in the `cx-mcp-server` directory
- Use TypeScript with strict typing (avoid `any` types)
- Check existing environment variable patterns before adding new ones
- Study existing MCP tool implementations before creating new ones

### Testing Commands
- Unit tests: `cd cx-mcp-server && npm run test`
- E2E tests: `cd cx-mcp-server && npm run test:e2e`
- Test coverage: `cd cx-mcp-server && npm run test:cov`
- Linting: `make lint` and `make lint/fix`
- Formatting: `make format`

### Development Commands
- Start development: `make up/build` (first time) or `make up`
- Application runs on: `http://localhost:3002`
- Swagger docs: `http://localhost:3002/docs`
- MCP SSE endpoint: `http://localhost:3002/sse`

### Key Files to Reference
- `SPEC.md`: Complete business requirements and API investigation
- `CLAUDE.md`: Development guidelines and commands
- Existing MCP tools in the codebase for implementation patterns
- Existing services for HTTP client patterns
- Existing configuration files for environment variable patterns