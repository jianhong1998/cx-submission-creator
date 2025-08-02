# 005 - MCP Tools Available

## User Management Workflow

The project implements a two-phase user management workflow for AI agents:

1. **Discovery Phase**: Use `list_users` to discover available users
2. **Authentication Phase**: Use `login_as_user` to authenticate as a specific user

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

### `login_as_user` (Planned - See SPEC-002)

**Purpose**: Enable AI agents to authenticate as specific users for subsequent operations

**Functionality**:
- Accepts `accountUuid` parameter from `list_users` response
- Performs authentication with external service
- Manages session state for subsequent authenticated requests
- Returns authentication status and session information

**Input Schema**:
```typescript
{
  accountUuid: string // From list_users response
}
```

**Usage Context**: AI agents use this after user discovery to perform operations in user context

### HTTP Tools

- **Generic HTTP capabilities**: Support for external API interactions
- **Methods supported**: Various HTTP methods and data formats
- **Integration pattern**: Used by other tools for external service communication