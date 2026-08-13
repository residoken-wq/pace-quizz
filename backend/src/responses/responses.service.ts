import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResponsesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: any) {
        const { participantId, questionId, answer, timeTaken } = data;

        if (!participantId || !questionId || !answer) {
            throw new BadRequestException('Missing required fields for response');
        }

        const [participant, question] = await Promise.all([
            this.prisma.participant.findUnique({ where: { id: participantId }, select: { sessionId: true } }),
            this.prisma.question.findUnique({ where: { id: questionId }, select: { sessionId: true, timeLimit: true } }),
        ]);

        if (!participant || !question || participant.sessionId !== question.sessionId) {
            throw new BadRequestException('Participant and question do not belong to the same session');
        }

        // The client measures from the synchronized question start. Keep a small
        // allowance for network/interval latency, but reject clearly late answers.
        if (question.timeLimit && Number(timeTaken) > question.timeLimit * 1000 + 1500) {
            throw new BadRequestException('Time limit for this question has expired');
        }

        // Single atomic upsert — uses the @@unique([participantId, questionId]) index
        return this.prisma.response.upsert({
            where: {
                participantId_questionId: { participantId, questionId }
            },
            update: {
                answer,
                timeTaken: timeTaken || 0,
            },
            create: {
                participantId,
                questionId,
                answer,
                timeTaken: timeTaken || 0,
            },
        });
    }
}
