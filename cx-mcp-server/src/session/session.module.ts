import { Module } from '@nestjs/common';
import { SessionManager } from './session.service';

@Module({
  providers: [SessionManager],
  exports: [SessionManager],
})
export class SessionModule {}
