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
