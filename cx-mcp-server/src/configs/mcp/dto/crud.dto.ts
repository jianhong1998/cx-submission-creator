import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateEntityDto {
  @IsString()
  entity: string;

  @IsObject()
  data: Record<string, unknown>;
}

export class ReadEntityDto {
  @IsString()
  entity: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsObject()
  @IsOptional()
  filter?: Record<string, unknown>;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string) : undefined))
  limit?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string) : undefined))
  offset?: number;
}

export class UpdateEntityDto {
  @IsString()
  entity: string;

  @IsString()
  id: string;

  @IsObject()
  data: Record<string, unknown>;
}

export class DeleteEntityDto {
  @IsString()
  entity: string;

  @IsString()
  id: string;
}

export class ListEntitiesDto {
  @IsString()
  @IsOptional()
  pattern?: string;
}

export class EntityResponseDto {
  @IsString()
  id: string;

  @IsString()
  entity: string;

  @IsObject()
  data: Record<string, unknown>;

  @IsString()
  createdAt: string;

  @IsString()
  updatedAt: string;
}

export class CrudResponseDto {
  @IsString()
  operation: string;

  @IsString()
  entity: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityResponseDto)
  @IsOptional()
  results?: EntityResponseDto[];

  @IsString()
  message: string;

  @IsString()
  timestamp: string;
}
