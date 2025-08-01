import { IsString, IsOptional, IsObject } from 'class-validator';

export class GetDataDto {
  @IsString()
  path: string;

  @IsObject()
  @IsOptional()
  queryParams?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  headers?: Record<string, unknown>;
}

export class HttpResponseDto {
  @IsString()
  operation: string;

  @IsString()
  url: string;

  @IsOptional()
  data?: unknown;

  @IsString()
  message: string;

  @IsString()
  timestamp: string;
}
