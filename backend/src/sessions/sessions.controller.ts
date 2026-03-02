import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createSessionDto: CreateSessionDto, @Req() req: any) {
    createSessionDto.hostId = req.user.userId;
    return this.sessionsService.create(createSessionDto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMySessions(@Req() req: any) {
    return this.sessionsService.findByHost(req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.sessionsService.findAll();
  }

  // Public endpoint for participants
  @Get('pin/:pin')
  findByPin(@Param('pin') pin: string) {
    return this.sessionsService.findByPin(pin);
  }

  // Public endpoint for participants to join and set nickname/mascot
  @Post('pin/:pin/join')
  joinSession(@Param('pin') pin: string, @Body() body: { nickname: string; mascot: string }) {
    return this.sessionsService.joinSession(pin, body.nickname, body.mascot);
  }

  // Public endpoint for leaderboard
  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string) {
    return this.sessionsService.getLeaderboard(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
    return this.sessionsService.update(id, updateSessionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }

  // ─── Session Lifecycle ─── 

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  startSession(@Param('id') id: string) {
    return this.sessionsService.startSession(id);
  }

  @Post(':id/end')
  @UseGuards(JwtAuthGuard)
  endSession(@Param('id') id: string) {
    return this.sessionsService.endSession(id);
  }

  @Post(':id/reset')
  @UseGuards(JwtAuthGuard)
  resetResults(@Param('id') id: string) {
    return this.sessionsService.resetResults(id);
  }

  @Get(':id/logs')
  @UseGuards(JwtAuthGuard)
  getActivityLogs(@Param('id') id: string) {
    return this.sessionsService.getActivityLogs(id);
  }

  @Get(':id/results')
  @UseGuards(JwtAuthGuard)
  getResults(@Param('id') id: string) {
    return this.sessionsService.getResults(id);
  }
}
