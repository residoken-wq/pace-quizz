import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<{
        id: string;
        email: string;
        name: string | null;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        email: string;
        name: string | null;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }[]>;
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        password: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        password: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
        sessions: {
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
        }[];
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        name: string | null;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        name: string | null;
        password: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
