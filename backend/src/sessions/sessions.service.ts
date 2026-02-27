import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createSessionDto: CreateSessionDto) {
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
    return this.prisma.session.create({
      data: {
        name: createSessionDto.name,
        hostId: createSessionDto.hostId as string,
        type: createSessionDto.type || 'LIVE',
        pin: generatedPin,
      },
    });
  }

  findAll() {
    return this.prisma.session.findMany({
      include: { host: true, questions: true },
    });
  }

  findByHost(hostId: string) {
    return this.prisma.session.findMany({
      where: { hostId },
      include: { questions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { host: true, questions: { orderBy: { order: 'asc' } }, participants: true },
    });
    if (!session) throw new NotFoundException(`Session with ID ${id} not found`);
    return session;
  }

  async findByPin(pin: string) {
    const session = await this.prisma.session.findUnique({
      where: { pin },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!session) throw new NotFoundException(`Session with PIN ${pin} not found`);
    return session;
  }

  update(id: string, updateSessionDto: UpdateSessionDto) {
    return this.prisma.session.update({ where: { id }, data: updateSessionDto });
  }

  remove(id: string) {
    return this.prisma.session.delete({ where: { id } });
  }

  // ─── Session Lifecycle ───

  async startSession(id: string) {
    const session = await this.prisma.session.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
    await this.prisma.activityLog.create({
      data: { sessionId: id, action: 'SESSION_STARTED' },
    });
    return session;
  }

  async endSession(id: string) {
    const session = await this.prisma.session.update({
      where: { id },
      data: { status: 'FINISHED' },
    });
    await this.prisma.activityLog.create({
      data: { sessionId: id, action: 'SESSION_ENDED' },
    });
    return session;
  }

  async resetResults(id: string) {
    // Delete all responses for this session's questions
    const questions = await this.prisma.question.findMany({
      where: { sessionId: id },
      select: { id: true },
    });
    const questionIds = questions.map(q => q.id);

    await this.prisma.response.deleteMany({
      where: { questionId: { in: questionIds } },
    });

    // Delete all participants
    await this.prisma.participant.deleteMany({
      where: { sessionId: id },
    });

    // Reset session status
    await this.prisma.session.update({
      where: { id },
      data: { status: 'CREATED' },
    });

    await this.prisma.activityLog.create({
      data: {
        sessionId: id,
        action: 'RESULTS_RESET',
        details: { questionsReset: questionIds.length },
      },
    });

    return { message: 'Results reset successfully', questionsReset: questionIds.length };
  }

  getActivityLogs(id: string) {
    return this.prisma.activityLog.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getResults(id: string) {
    const questions = await this.prisma.question.findMany({
      where: { sessionId: id },
      orderBy: { order: 'asc' },
      include: {
        responses: true,
      },
    });

    return questions.map(q => {
      const options = (q.options as any[]) || [];
      const voteCounts: Record<string, number> = {};
      options.forEach((opt: any) => { voteCounts[opt.id] = 0; });
      q.responses.forEach(r => {
        const answer = r.answer as any;
        if (answer?.optionId && voteCounts[answer.optionId] !== undefined) {
          voteCounts[answer.optionId]++;
        }
      });

      return {
        id: q.id,
        title: q.title,
        type: q.type,
        order: q.order,
        options,
        totalResponses: q.responses.length,
        voteCounts,
      };
    });
  }
}

