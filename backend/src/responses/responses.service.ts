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

        // Upsert the response so a participant cannot vote twice for the same question
        const existingResponse = await this.prisma.response.findFirst({
            where: { participantId, questionId }
        });

        if (existingResponse) {
            return this.prisma.response.update({
                where: { id: existingResponse.id },
                data: {
                    answer,
                    timeTaken: timeTaken || 0
                }
            });
        }

        return this.prisma.response.create({
            data: {
                participantId,
                questionId,
                answer,
                timeTaken: timeTaken || 0,
            },
        });
    }
}
