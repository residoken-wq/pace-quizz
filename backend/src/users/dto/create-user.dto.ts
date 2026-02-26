export class CreateUserDto {
    email: string;
    name?: string;
    password: string;
    role?: 'ADMIN' | 'HOST';
}
