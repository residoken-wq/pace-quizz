import { PrismaService } from '../prisma/prisma.service';
export declare class ResponsesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<{
        id: string;
        createdAt: Date;
        participantId: string;
        questionId: string;
        answer: import("@prisma/client/runtime/library").JsonValue;
        score: number | null;
        timeTaken: number | null;
    }>;
}
