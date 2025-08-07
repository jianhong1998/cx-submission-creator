import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP tool for authenticating as a specific user using their account UUID
 * This tool enables AI agents to perform user-specific operations by logging in as that user
 */
export const loginAsUserTool: Tool = {
  name: 'login_as_user',
  description:
    'Authenticate as a specific user using their account UUID. This enables the AI agent to perform operations on behalf of that user by establishing an authenticated session.',
  inputSchema: {
    type: 'object',
    properties: {
      accountUuid: {
        type: 'string',
        description:
          'Unique identifier for the user account to authenticate as (use UUID from list_users tool)',
        pattern:
          '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
      },
    },
    required: ['accountUuid'],
  },
};

/**
 * Get all authentication related tools
 * @returns Array of tools for authentication operations
 */
export const getAllAuthenticationTools = (): Tool[] => [loginAsUserTool];
