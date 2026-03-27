import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlayerModule } from './modules/player/player.module';
import { MissionModule } from './modules/mission/mission.module';
import { EventModule } from './modules/event/event.module';
import { UgcModule } from './modules/ugc/ugc.module';

@Module({
  imports: [PlayerModule, MissionModule, EventModule, UgcModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
