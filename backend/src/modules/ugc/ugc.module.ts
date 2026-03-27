import { Module } from '@nestjs/common';
import { UgcController } from './ugc.controller';
import { UgcService } from './ugc.service';

@Module({
  controllers: [UgcController],
  providers: [UgcService]
})
export class UgcModule {}
