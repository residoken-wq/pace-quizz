import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { SessionsModule } from './sessions/sessions.module';
import { QuestionsModule } from './questions/questions.module';
import { EventsGateway } from './events/events.gateway';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { ResponsesModule } from './responses/responses.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    SessionsModule,
    QuestionsModule,
    AuthModule,
    UploadModule,
    ResponsesModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    })
  ],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule { }
