# Business Requirements Document (BRD)

## User Listing Tool for CX-MCP-Server

### Document Information

- **Document Version**: 1.0
- **Date**: July 26, 2025
- **Project**: CX-MCP-Server AI Agent Tool Development
- **Prepared By**: Development Team

---

## 1. Executive Summary

This document outlines the business requirements for implementing a new MCP (Model Context Protocol) tool within the cx-mcp-server that enables AI agents to retrieve and list user information from an external service endpoint.

### 1.1 Purpose

To provide AI agents with the capability to fetch user data from external services via the User Account Service, enabling user management and discovery functionalities within the CX ecosystem.

### 1.2 Scope

This requirement covers the development of a single MCP tool that:

- Connects to an external user service endpoint via configurable hostname
- Retrieves user/account license information
- Returns structured data to the AI agent
- Handles error scenarios appropriately

---

## 2. Business Objectives

### 2.1 Primary Objectives

- **User Discovery**: Enable AI agents to discover and list available users in the system
- **Integration**: Seamlessly integrate with external services through the external-services module
- **Environment Flexibility**: Support different environments through configuration
- **Error Resilience**: Provide robust error handling for service reliability

### 2.2 Success Criteria

- AI agents can successfully retrieve user listings
- Tool handles both successful and error responses appropriately
- Tool works across different environments via configuration
- Response time is within acceptable limits (< 5 seconds)
- Tool integrates seamlessly with existing MCP framework

---

## 3. Functional Requirements

### 3.1 Core Functionality

#### FR-001: User Listing Retrieval

**Description**: The tool must be able to fetch user data from external services via the User Account Service

- **Endpoint Path**: `/services/uat/project-team-builder/account-licenses` (accessed through UserAccountService)
- **Hostname**: Configurable via environment variable (see FR-005)
- **Method**: GET
- **Response**: Return complete JSON response to the caller
- **Authentication**: Handle any required authentication (if applicable)
- **Service**: Utilizes the external-services module for scalable integration

#### FR-002: Response Processing

**Description**: Process and return the endpoint response

- **Success Response**: Return the complete JSON response as received
- **Data Format**: Maintain original data structure and format
- **No Transformation**: Pass through response without modification

#### FR-003: Error Handling

**Description**: Handle various error scenarios appropriately

- **4XX Errors**: Client-side errors (bad request, unauthorized, etc.)
- **5XX Errors**: Server-side errors (internal server error, service unavailable)
- **Network Errors**: Connection timeouts, DNS resolution failures
- **Error Response**: Provide meaningful error messages to the AI agent

#### FR-004: Tool Integration

**Description**: Implement as a proper MCP tool within the cx-mcp-server using the external-services module

- **Tool Name**: `list_users` or similar descriptive name
- **Tool Description**: Clear description for AI agent understanding
- **Parameter Validation**: Validate any input parameters (if required)
- **Service Integration**: Uses UserAccountService from the external-services module

#### FR-005: Environment Configuration

**Description**: Support configurable hostname through environment variables

- **Environment Variable**: Define hostname via environment variable (e.g., `BACKEND_HOSTNAME`)
- **Default Value**: Provide sensible default for local development
- **Validation**: Validate hostname format and accessibility
- **Documentation**: Clear documentation on required environment setup

### 3.2 Configuration Requirements

#### FR-006: Environment Variable Management

**Description**: Proper handling of environment-based configuration

- **Variable Name**: `BACKEND_HOSTNAME` (or similar)
- **Example Values**:
  - Local: `http://localhost:8000`
  - UAT: `https://uat-team-builder.company.com`
  - Production: `https://team-builder.company.com`
- **Fallback**: Graceful handling when environment variable is not set
- **Validation**: URL format validation

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

- **Response Time**: Maximum 5 seconds for user listing retrieval
- **Timeout Handling**: Implement appropriate timeout mechanisms
- **Concurrent Requests**: Support multiple concurrent requests

### 4.2 Reliability Requirements

- **Error Recovery**: Graceful handling of service unavailability
- **Logging**: Comprehensive logging for debugging and monitoring
- **Retry Logic**: Consider implementing retry mechanism for transient failures

### 4.3 Security Requirements

- **Data Protection**: Ensure user data is handled securely
- **Authentication**: Support required authentication mechanisms
- **Input Validation**: Validate all inputs to prevent security vulnerabilities
- **Environment Security**: Secure handling of environment variables

---

## 5. Technical Specifications

### 5.1 Implementation Framework

- **Technology**: NestJS with TypeScript
- **MCP Integration**: Utilize existing MCP framework in cx-mcp-server
- **HTTP Client**: Use appropriate HTTP client library (axios, fetch, etc.) through UserAccountService
- **Configuration**: Use NestJS ConfigService for environment variable management
- **Module Architecture**: Leverage the external-services module for scalable external API integration

### 5.2 Data Flow

1. AI agent requests user listing through MCP tool
2. Tool validates request parameters (if any)
3. Tool calls UserAccountService.getUserAccountLicenses() method
4. UserAccountService constructs endpoint URL using configured hostname
5. UserAccountService makes HTTP GET request to external endpoint
6. UserAccountService processes response or error
7. Tool returns formatted response to AI agent

### 5.3 Response Schema Specifications

**✅ INVESTIGATION COMPLETED**: The endpoint response schema has been investigated and documented.

**Investigation Results**:

1. **Endpoint Response**: `GET localhost:8000/services/uat/project-team-builder/account-licenses`
2. **HTTP Status**: 200 OK
3. **Content-Type**: application/json; charset=utf-8
4. **Response Time**: ~0.025 seconds
5. **Rate Limiting**: 1000 requests per minute
6. **Authentication**: No authentication required for this endpoint

**Response Structure**: The endpoint returns an array of account license objects with the following schema:

```typescript
interface AccountLicense {
  accountUuid: string;
  accountName: string;
  identificationNumber: string;
  accountCompanyUEN?: string; // Optional field, only present for some accounts
  professionalLicenses: ProfessionalLicense[];
  availableRolesForAccountLicenses: AvailableRole[];
}

interface ProfessionalLicense {
  uuid: string;
  registrar: string; // e.g., "PEB", "BOA"
  regNumber: string;
  valid: string; // ISO date string
  specialty: string | null; // e.g., "Mechanical" or null
}

interface AvailableRole {
  roleKey: string; // e.g., "developer", "transportConsultant", "professionalEngineerMechanical", "registeredArchitect"
  regNumber: string | null;
}
```

**Sample Response Data**:
```json
[
  {
    "accountUuid": "6daa218b-cce4-4495-ae74-877692a6fd63",
    "accountName": "PE 5",
    "identificationNumber": "S7018005E",
    "professionalLicenses": [
      {
        "uuid": "e04d0090-ec9a-47d4-9eef-9184bf6f1522",
        "registrar": "PEB",
        "regNumber": "8003",
        "valid": "2028-07-23T16:00:00.000Z",
        "specialty": "Mechanical"
      }
    ],
    "availableRolesForAccountLicenses": [
      {
        "roleKey": "developer",
        "regNumber": null
      },
      {
        "roleKey": "transportConsultant", 
        "regNumber": null
      },
      {
        "roleKey": "professionalEngineerMechanical",
        "regNumber": "8003"
      }
    ]
  }
]
```

**Response Headers**: 
- Rate limiting headers: `X-RateLimit-Limit-Minute: 1000`, `X-RateLimit-Remaining-Minute`
- Security headers: CSP, CORS, XSS protection
- Correlation ID: `x-correlation-id` for request tracking
- ETag support for caching
- Kong proxy headers

**Error Response Structure**:

```typescript
// 403 Forbidden (when authentication fails)
{
  timestamp: string; // ISO date string
  success: false;
  status: 403;
  message: "NOT_LOGGED_IN";
  errorCode: "NOT_LOGGED_IN";
  stack: string; // Full error stack trace
}

// General Error Response Structure
{
  success: false,
  error: {
    type: "CLIENT_ERROR" | "SERVER_ERROR" | "NETWORK_ERROR",
    statusCode: number,
    message: string,
    details?: any
  }
}

// Success Response Structure
{
  success: true,
  data: AccountLicense[] // Array of account license objects
}
```

**Key Findings**:
- No pagination implemented - returns all records in single response
- Response size: ~3.6KB for current dataset
- No authentication required for the specific endpoint tested
- Error responses include detailed stack traces in development environment
- Service uses Kong API gateway with rate limiting
- Response includes both individual and company accounts

---

## 6. Integration Requirements

### 6.1 External Service Integration

- **Service Path**: `/services/uat/project-team-builder/account-licenses` (accessed via UserAccountService)
- **Hostname**: Configurable via environment variable
- **Environment**: Multiple environments supported (local, UAT, production)
- **Dependencies**: External service availability
- **Module**: external-services module provides scalable architecture for multiple external API integrations

### 6.2 Internal Integration

- **MCP Framework**: Integrate with existing MCP tool infrastructure
- **Configuration**: Use existing NestJS configuration management
- **Environment Variables**: Follow existing environment variable patterns
- **Logging**: Integrate with existing logging framework
- **External Services Module**: Leverage the modular external-services architecture for scalable integration

---

## 7. Environment Configuration

### 7.1 Required Environment Variables

```bash
# Backend Service Configuration
BACKEND_HOSTNAME=http://localhost:8000  # Local development
# BACKEND_HOSTNAME=https://uat-team-builder.company.com  # UAT
# BACKEND_HOSTNAME=https://team-builder.company.com  # Production
```

### 7.2 Configuration Validation

- Validate URL format on application startup
- Log configuration values (without sensitive data)
- Provide clear error messages for missing configuration

---

## 8. Acceptance Criteria

### 8.1 Functional Acceptance

- [ ] Tool successfully retrieves user data from configurable endpoint
- [ ] Tool works with different hostnames via environment variable
- [ ] Tool returns complete JSON response without modification
- [ ] Tool handles 4XX errors appropriately with descriptive messages
- [ ] Tool handles 5XX errors appropriately with descriptive messages
- [ ] Tool handles network/timeout errors gracefully
- [ ] Tool integrates properly with MCP framework
- [ ] Environment variable configuration works correctly

### 8.2 Technical Acceptance

- [ ] Code follows project TypeScript standards
- [ ] Proper error handling and logging implemented
- [ ] Configuration management follows NestJS patterns
- [ ] Tool documentation is complete and accurate
- [ ] Unit tests cover all scenarios including configuration
- [ ] Integration tests validate end-to-end functionality
- [x] **Response schema investigation completed and documented**

---

## 9. Investigation Tasks

### 9.1 Pre-Implementation Investigation

**Priority: HIGH** - Must be completed before implementation begins

1. **Endpoint Response Analysis**

   - Make test calls to the endpoint
   - Document complete response structure
   - Identify all fields and their types
   - Test error scenarios (404, 500, network issues)

2. **Authentication Requirements**

   - Determine if authentication is required
   - Document authentication method (if any)
   - Test authentication scenarios

3. **Response Format Validation**
   - Confirm JSON response format
   - Check for pagination or limiting
   - Validate data consistency

### 9.2 Investigation Deliverables

- Complete response schema documentation
- Sample response examples
- Error response examples
- Authentication requirements (if any)
- Updated technical specifications

---

## 10. Assumptions and Constraints

### 10.1 Assumptions

- External service endpoint is available and accessible
- Service responds with JSON format
- Environment variable configuration is acceptable approach
- Local development environment setup is consistent

### 10.2 Constraints

- Must work within existing cx-mcp-server architecture
- Limited to GET requests for this requirement
- Must maintain compatibility with current MCP framework version
- Must follow existing environment variable patterns

---

## 11. Risks and Mitigation

### 11.1 Technical Risks

- **External Service Dependency**: Service unavailability could impact functionality
  - _Mitigation_: Implement proper error handling and retry logic
- **Configuration Errors**: Incorrect hostname configuration could cause failures
  - _Mitigation_: Implement configuration validation and clear error messages
- **Unknown Response Format**: Lack of endpoint documentation creates implementation risk
  - _Mitigation_: Complete thorough investigation before implementation

### 11.2 Operational Risks

- **Service Changes**: External service API changes could break functionality
  - _Mitigation_: Implement monitoring and alerting for service health
- **Environment Differences**: Different environments may have different response formats
  - _Mitigation_: Test across all target environments

---

## 12. Deliverables

1. **Pre-Implementation Investigation**: Complete endpoint analysis and documentation
2. **MCP Tool Implementation**: Complete tool implementation in cx-mcp-server
3. **Configuration Management**: Environment variable handling implementation
4. **Unit Tests**: Comprehensive test coverage for all scenarios
5. **Integration Tests**: End-to-end testing with actual endpoint across environments
6. **Documentation**: Tool usage documentation for AI agents
7. **Error Handling**: Complete error handling implementation

---

## 13. Timeline and Dependencies

### 13.1 Estimated Timeline

- **Investigation Phase**: 0.5-1 days
- **Development**: 1-2 days
- **Testing**: 1 day
- **Documentation**: 0.5 days
- **Total**: 3-4.5 days

### 13.2 Dependencies

- External service availability for investigation and testing
- Access to different environments (local, UAT, production)
- Existing MCP framework stability
- Environment variable configuration access

---

_This document serves as the foundation for implementing the user listing tool within the cx-mcp-server project. The investigation phase must be completed before implementation begins._
