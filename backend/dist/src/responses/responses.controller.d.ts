import { ResponsesService } from './responses.service';
export declare class ResponsesController {
    private readonly responsesService;
    constructor(responsesService: ResponsesService);
    create(createResponseDto: any): Promise<{
        id: string;
        createdAt: Date;
        participantId: string;
        questionId: string;
        answer: import("@prisma/client/runtime/library").JsonValue;
        score: number | null;
        timeTaken: number | null;
    }>;
}
