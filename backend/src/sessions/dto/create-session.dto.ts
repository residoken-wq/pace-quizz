import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateSessionDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    hostId?: string; // Will be auto-filled from JWT if not provided

    @IsOptional()
    @IsEnum(['LIVE', 'SURVEY'])
    type?: 'LIVE' | 'SURVEY';

    @IsOptional()
    @IsString()
    bannerUrl?: string;

    @IsOptional()
    @IsString()
    thankYouMessage?: string;
}
