import { IsString, IsUUID } from 'class-validator';

export class LoginAsUserDto {
  @IsUUID(4, { message: 'accountUuid must be a valid UUID' })
  @IsString()
  accountUuid: string;
}
