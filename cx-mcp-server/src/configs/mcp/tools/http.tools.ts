import { Tool } from '@modelcontextprotocol/sdk/types.js';

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
