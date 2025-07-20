import { IsString, IsOptional, IsObject } from 'class-validator';

export class GetDataDto {
  @IsString()
  path: string;

  @IsObject()
  @IsOptional()
  queryParams?: Record<string, any>;

  @IsObject()
  @IsOptional()
  headers?: Record<string, any>;
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
