import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class SessionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createSessionDto: CreateSessionDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pin: string;
        type: import(".prisma/client").$Enums.SessionType;
        status: import(".prisma/client").$Enums.SessionStatus;
        hostId: string;
    }>;
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
            sessionId: string;
            title: string;
            order: number;
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
            sessionId: string;
            title: string;
            order: number;
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
    findByPin(pin: string): Promise<{
        questions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.QuestionType;
            sessionId: string;
            title: string;
            order: number;
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
}
