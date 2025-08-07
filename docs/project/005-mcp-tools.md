# 005 - MCP Tools Available

## User Management Workflow

The project implements a comprehensive user management workflow for AI agents:

1. **Discovery Phase**: Use `list_users` to discover available users and their account details
2. **Authentication Phase**: Use `login_as_user` to authenticate as a specific user using their accountUuid
3. **Authenticated Operations**: Use `get_data` with established session cookies for user-specific operations

## Complete Workflow Example

```typescript
// Step 1: Discover available users
const users = await mcp.callTool('list_users', {});
console.log('Available users:', users.content);

// Step 2: Authenticate as a specific user
const selectedUser = users.content[0]; // Select first user
const authResult = await mcp.callTool('login_as_user', {
  accountUuid: selectedUser.accountUuid
});

if (authResult.success) {
  console.log('Authentication successful');
  console.log('Session token:', authResult.data.sessionToken);
  console.log('Session cookies:', authResult.data.sessionCookies);
  
  // Step 3: Make authenticated requests using session
  const authenticatedData = await mcp.callTool('get_data', {
    path: '/services/uat/project-team-builder/account-licenses',
    // Session cookies automatically managed by backend
  });
}
```

## Available Tools

### `list_users` (Implemented)

**Purpose**: Retrieve all users and their account licenses from external services

**Functionality**:
- Returns comprehensive user information including professional licenses, roles, and account details
- Utilizes the external-services module for scalable integration with multiple external APIs
- No parameters required - fetches all available data
- Endpoint: `/services/uat/project-team-builder/account-licenses`

**Response Structure**:
```typescript
interface AccountLicense {
  accountUuid: string;           // Used for subsequent authentication
  accountName: string;
  identificationNumber: string;
  accountCompanyUEN?: string;    // Optional company field
  professionalLicenses: ProfessionalLicense[];
  availableRolesForAccountLicenses: AvailableRole[];
}
```

**Usage Context**: AI agents use this to discover available users before authentication

### `login_as_user` (Implemented ✅)

**Purpose**: Enable AI agents to authenticate as specific users for subsequent operations

**Functionality**:
- Accepts `accountUuid` parameter from `list_users` response
- Performs authentication with external service using GET `/services/uat/login?uuid={accountUuid}`
- Manages cookie-based session state with automatic expiration (30 minutes)
- Returns authentication status and session information including cookies
- Supports concurrent sessions (50+ tested)
- 5-second timeout with comprehensive error handling

**Input Schema**:
```typescript
{
  accountUuid: string // UUID format validation with regex pattern
}
```

**Success Response**:
```typescript
{
  success: true,
  data: {
    accountUuid: string,
    sessionToken: string,        // Internal session token for management
    sessionCookies: {
      cnx: string,              // Main session cookie value
      cnxExpires: string        // Session expiration timestamp
    },
    redirectLocation: string,    // Backend redirect URL
    message: string
  },
  operation: "login_as_user",
  timestamp: string
}
```

**Error Response**:
```typescript
{
  success: false,
  error: {
    type: "CLIENT_ERROR" | "SERVER_ERROR" | "NETWORK_ERROR" | "TIMEOUT_ERROR",
    statusCode: number,
    message: string,
    details?: unknown
  },
  operation: "login_as_user",
  timestamp: string
}
```

**Usage Context**: AI agents use this after user discovery to perform operations in user context

**Implementation Features**:
- Cookie-based session management with HttpOnly, SameSite=Strict security
- Automatic session cleanup every 5 minutes
- Session validation using protected endpoint testing
- UUID validation preventing injection attacks
- Comprehensive logging without credential exposure
- Performance tested with 50+ concurrent sessions

### HTTP Tools

- **Generic HTTP capabilities**: Support for external API interactions
- **Methods supported**: Various HTTP methods and data formats
- **Integration pattern**: Used by other tools for external service communication