import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        email: string;
        name: string | null;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
    }>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        email: string;
        name: string | null;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        email: string;
        name: string | null;
        password: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
        sessions: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            pin: string;
            type: import(".prisma/client").$Enums.SessionType;
            status: import(".prisma/client").$Enums.SessionStatus;
            hostId: string;
        }[];
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        email: string;
        name: string | null;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
    }>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        email: string;
        name: string | null;
        password: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
