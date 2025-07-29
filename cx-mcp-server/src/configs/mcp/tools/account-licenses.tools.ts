import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP tool for retrieving user account licenses and professional credentials
 * This tool enables AI agents to fetch comprehensive user data including licenses and roles
 */
export const listUsersTool: Tool = {
  name: 'list_users',
  description:
    'Retrieve a list of all users and their account licenses from external services. Returns comprehensive user information including professional licenses, available roles, and account details.',
  inputSchema: {
    type: 'object',
    properties: {
      // No parameters required - this tool fetches all available data
    },
    required: [],
  },
};

/**
 * Get all account license related tools
 * @returns Array of tools for account license operations
 */
export const getAllAccountLicenseTools = (): Tool[] => [listUsersTool];
