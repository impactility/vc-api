import { Module, Global } from '@nestjs/common';
import { AskarService } from './askar.config';

@Global()
@Module({
  providers: [AskarService],
  exports: [AskarService],
})
export class AskarConfigModule {}
