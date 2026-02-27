import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    create(createSessionDto: CreateSessionDto, req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        hostId: string;
    }>;
    findMySessions(req: any): import(".prisma/client").Prisma.PrismaPromise<({
        questions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.QuestionType;
            order: number;
            sessionId: string;
            title: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            timeLimit: number | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        hostId: string;
    })[]>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        host: {
            email: string;
            name: string | null;
            password: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
        questions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.QuestionType;
            order: number;
            sessionId: string;
            title: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            timeLimit: number | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        hostId: string;
    })[]>;
    findByPin(pin: string): Promise<{
        questions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.QuestionType;
            order: number;
            sessionId: string;
            title: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            timeLimit: number | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        hostId: string;
    }>;
    findOne(id: string): Promise<{
        host: {
            email: string;
            name: string | null;
            password: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
        questions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.QuestionType;
            order: number;
            sessionId: string;
            title: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            timeLimit: number | null;
        }[];
        participants: {
            id: string;
            createdAt: Date;
            sessionId: string;
            nickname: string | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        hostId: string;
    }>;
    update(id: string, updateSessionDto: UpdateSessionDto): import(".prisma/client").Prisma.Prisma__SessionClient<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        hostId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__SessionClient<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        hostId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    startSession(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        hostId: string;
    }>;
    endSession(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        hostId: string;
    }>;
    resetResults(id: string): Promise<{
        message: string;
        questionsReset: number;
    }>;
    getActivityLogs(id: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        action: import(".prisma/client").$Enums.ActivityAction;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        sessionId: string;
    }[]>;
    getResults(id: string): Promise<{
        id: string;
        title: string;
        type: import(".prisma/client").$Enums.QuestionType;
        order: number;
        options: any[];
        totalResponses: number;
        voteCounts: Record<string, number>;
    }[]>;
}
