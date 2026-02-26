import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { SessionsModule } from './sessions/sessions.module';
import { QuestionsModule } from './questions/questions.module';
import { EventsGateway } from './events/events.gateway';

@Module({
  imports: [PrismaModule, UsersModule, SessionsModule, QuestionsModule],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule { }
