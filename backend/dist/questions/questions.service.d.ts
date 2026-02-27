import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class QuestionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createQuestionDto: CreateQuestionDto): import(".prisma/client").Prisma.Prisma__QuestionClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.QuestionType;
        sessionId: string;
        title: string;
        order: number;
        options: import("@prisma/client/runtime/library").JsonValue;
        timeLimit: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        session: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            pin: string;
            type: import(".prisma/client").$Enums.SessionType;
            status: import(".prisma/client").$Enums.SessionStatus;
            hostId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.QuestionType;
        sessionId: string;
        title: string;
        order: number;
        options: import("@prisma/client/runtime/library").JsonValue;
        timeLimit: number | null;
    })[]>;
    findOne(id: string): Promise<{
        tags: {
            name: string;
            id: string;
        }[];
        responses: {
            id: string;
            createdAt: Date;
            participantId: string;
            questionId: string;
            answer: import("@prisma/client/runtime/library").JsonValue;
            score: number | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.QuestionType;
        sessionId: string;
        title: string;
        order: number;
        options: import("@prisma/client/runtime/library").JsonValue;
        timeLimit: number | null;
    }>;
    update(id: string, updateQuestionDto: UpdateQuestionDto): import(".prisma/client").Prisma.Prisma__QuestionClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.QuestionType;
        sessionId: string;
        title: string;
        order: number;
        options: import("@prisma/client/runtime/library").JsonValue;
        timeLimit: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__QuestionClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.QuestionType;
        sessionId: string;
        title: string;
        order: number;
        options: import("@prisma/client/runtime/library").JsonValue;
        timeLimit: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
