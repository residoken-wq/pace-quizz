import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  @Post()
  create(@Body() createSessionDto: CreateSessionDto, @Req() req: any) {
    createSessionDto.hostId = req.user.userId;
    return this.sessionsService.create(createSessionDto);
  }

  @Get('my')
  findMySessions(@Req() req: any) {
    return this.sessionsService.findByHost(req.user.userId);
  }

  @Get()
  findAll() {
    return this.sessionsService.findAll();
  }

  @Get('pin/:pin')
  findByPin(@Param('pin') pin: string) {
    return this.sessionsService.findByPin(pin);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
    return this.sessionsService.update(id, updateSessionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }

  // ─── Session Lifecycle ─── 

  @Post(':id/start')
  startSession(@Param('id') id: string) {
    return this.sessionsService.startSession(id);
  }

  @Post(':id/end')
  endSession(@Param('id') id: string) {
    return this.sessionsService.endSession(id);
  }

  @Post(':id/reset')
  resetResults(@Param('id') id: string) {
    return this.sessionsService.resetResults(id);
  }

  @Get(':id/logs')
  getActivityLogs(@Param('id') id: string) {
    return this.sessionsService.getActivityLogs(id);
  }

  @Get(':id/results')
  getResults(@Param('id') id: string) {
    return this.sessionsService.getResults(id);
  }
}
