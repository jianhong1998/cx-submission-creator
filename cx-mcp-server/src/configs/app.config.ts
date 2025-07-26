import { IsString, IsUrl, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class AppConfig {
  @IsString()
  @IsUrl({ require_tld: false, allow_protocol_relative_urls: true })
  @Transform(({ value }) => {
    // Remove trailing slash if present
    if (typeof value === 'string') {
      return value.replace(/\/$/, '');
    }
    return value as string;
  })
  BACKEND_HOSTNAME: string;

  @IsString()
  @IsOptional()
  NODE_ENV?: string = 'development';

  @IsString()
  @IsOptional()
  APP_PORT?: string = '3002';
}
