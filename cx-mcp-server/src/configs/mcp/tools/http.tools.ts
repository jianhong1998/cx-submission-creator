import { Tool } from '@modelcontextprotocol/sdk/types.js';
// Import account license tools
import { getAllAccountLicenseTools } from './account-licenses.tools';
// Import authentication tools
import { getAllAuthenticationTools } from './authentication.tools';

export const getDataToolExample: Tool = {
  name: 'get_data',
  description: 'Get data from a HTTP endpoint',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The API path to request (e.g., "/api/users")',
      },
      queryParams: {
        type: 'object',
        description: 'Optional: query parameters to include in the request',
      },
      headers: {
        type: 'object',
        description: 'Optional: additional headers to include in the request',
      },
    },
    required: ['path'],
  },
};

export const getAllHttpTools = (): Tool[] => [getDataToolExample];

/**
 * Get all available tools (HTTP tools + Account License tools + Authentication tools)
 * @returns Array of all available MCP tools
 */
export const getAllTools = (): Tool[] => [
  ...getAllHttpTools(),
  ...getAllAccountLicenseTools(),
  ...getAllAuthenticationTools(),
];
