import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum DatabaseType {
  MEMORY = 'memory',
  FILE = 'file',
  MONGODB = 'mongodb',
  POSTGRESQL = 'postgresql',
}

export class McpCapabilities {
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value ?? true) as boolean)
  tools?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value ?? true) as boolean)
  resources?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value ?? false) as boolean)
  prompts?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value ?? true) as boolean)
  logging?: boolean = true;
}

export class McpTool {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsObject()
  inputSchema: Record<string, unknown>;
}

export class McpDatabase {
  @IsEnum(DatabaseType)
  @IsOptional()
  @Transform(({ value }) => (value ?? DatabaseType.MEMORY) as DatabaseType)
  type?: DatabaseType = DatabaseType.MEMORY;

  @IsString()
  @IsOptional()
  connectionString?: string;

  @IsObject()
  @IsOptional()
  @Transform(({ value }) => (value ?? {}) as Record<string, unknown>)
  options?: Record<string, unknown> = {};
}

export class McpConfig {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ?? 'cx-mcp-server') as string)
  name?: string = 'cx-mcp-server';

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ?? '1.0.0') as string)
  version?: string = '1.0.0';

  @IsString()
  @IsOptional()
  @Transform(
    ({ value }) =>
      (value ?? 'Customer Experience MCP Server for CRUD operations') as string,
  )
  description?: string = 'Customer Experience MCP Server for CRUD operations';

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ?? 'CX Team') as string)
  author?: string = 'CX Team';

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ?? 'MIT') as string)
  license?: string = 'MIT';

  @ValidateNested()
  @Type(() => McpCapabilities)
  @IsOptional()
  capabilities?: McpCapabilities = new McpCapabilities();

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => McpTool)
  @IsOptional()
  @Transform(({ value }) => (value ?? []) as McpTool[])
  tools?: McpTool[] = [];

  @ValidateNested()
  @Type(() => McpDatabase)
  @IsOptional()
  database?: McpDatabase = new McpDatabase();
}

export const defaultMcpConfig: McpConfig = {
  name: 'cx-mcp-server',
  version: '1.0.0',
  description: 'Customer Experience MCP Server for CRUD operations',
  author: 'CX Team',
  license: 'MIT',
  capabilities: new McpCapabilities(),
  tools: [],
  database: new McpDatabase(),
};
