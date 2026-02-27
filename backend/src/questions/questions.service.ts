import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) { }

  create(createQuestionDto: CreateQuestionDto) {
    return this.prisma.question.create({
      data: {
        sessionId: createQuestionDto.sessionId,
        title: createQuestionDto.title,
        order: createQuestionDto.order,
        type: createQuestionDto.type || 'MULTIPLE_CHOICE',
        options: createQuestionDto.options,
        timeLimit: createQuestionDto.timeLimit,
      },
    });
  }

  findAll() {
    return this.prisma.question.findMany({
      include: { session: true },
    });
  }

  findBySession(sessionId: string) {
    return this.prisma.question.findMany({
      where: { sessionId },
      orderBy: { order: 'asc' },
      include: { tags: true },
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { tags: true, responses: true },
    });
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  update(id: string, updateQuestionDto: UpdateQuestionDto) {
    return this.prisma.question.update({
      where: { id },
      data: updateQuestionDto,
    });
  }

  remove(id: string) {
    return this.prisma.question.delete({
      where: { id },
    });
  }
}
