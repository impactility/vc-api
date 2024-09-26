import { Module, Global } from '@nestjs/common';
import { CredoService } from './credo.service';

@Global()
@Module({
  providers: [CredoService],
  exports: [CredoService]
})
export class CredoModule {}
