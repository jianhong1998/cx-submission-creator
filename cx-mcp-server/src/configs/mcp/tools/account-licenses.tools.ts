import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP tool for retrieving account licenses and user information
 * This tool enables AI agents to fetch user data from the project team builder service
 */
export const listUsersTool: Tool = {
  name: 'list_users',
  description:
    'Retrieve a list of all users and their account licenses from the project team builder service. Returns comprehensive user information including professional licenses, available roles, and account details.',
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
