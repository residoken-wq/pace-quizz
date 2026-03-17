import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    create(createSessionDto: CreateSessionDto, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        bannerUrl: string | null;
        thankYouMessage: string | null;
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
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        bannerUrl: string | null;
        thankYouMessage: string | null;
        hostId: string;
    })[]>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        host: {
            id: string;
            email: string;
            name: string | null;
            password: string;
            role: import(".prisma/client").$Enums.Role;
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
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        bannerUrl: string | null;
        thankYouMessage: string | null;
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
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        bannerUrl: string | null;
        thankYouMessage: string | null;
        hostId: string;
    }>;
    joinSession(pin: string, body: {
        nickname: string;
        mascot: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        sessionId: string;
        nickname: string | null;
        mascot: string | null;
    }>;
    getLeaderboard(id: string): Promise<{
        id: string;
        nickname: string | null;
        mascot: string | null;
        correctAnswers: number;
        totalTimeTaken: number;
    }[]>;
    findOne(id: string): Promise<{
        host: {
            id: string;
            email: string;
            name: string | null;
            password: string;
            role: import(".prisma/client").$Enums.Role;
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
            mascot: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        bannerUrl: string | null;
        thankYouMessage: string | null;
        hostId: string;
    }>;
    update(id: string, updateSessionDto: UpdateSessionDto): import(".prisma/client").Prisma.Prisma__SessionClient<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        bannerUrl: string | null;
        thankYouMessage: string | null;
        hostId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__SessionClient<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        bannerUrl: string | null;
        thankYouMessage: string | null;
        hostId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    startSession(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        bannerUrl: string | null;
        thankYouMessage: string | null;
        hostId: string;
    }>;
    endSession(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        bannerUrl: string | null;
        thankYouMessage: string | null;
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
    getResults(id: string): Promise<({
        id: string;
        title: string;
        type: "WORD_CLOUD";
        order: number;
        totalResponses: number;
        wordCloudData: {
            text: string;
            value: number;
        }[];
        options?: undefined;
        voteCounts?: undefined;
    } | {
        id: string;
        title: string;
        type: "RATING_SCALE";
        order: number;
        options: import("@prisma/client/runtime/library").JsonValue;
        totalResponses: number;
        voteCounts: Record<string, number>;
        wordCloudData?: undefined;
    } | {
        id: string;
        title: string;
        type: "MULTIPLE_CHOICE" | "POLL";
        order: number;
        options: any[];
        totalResponses: number;
        voteCounts: Record<string, number>;
        wordCloudData?: undefined;
    })[]>;
}
