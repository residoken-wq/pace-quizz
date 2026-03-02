import { PartialType } from '@nestjs/mapped-types';
import { CreateSessionDto } from './create-session.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSessionDto extends PartialType(CreateSessionDto) {
    @IsOptional()
    @IsString()
    bannerUrl?: string;

    @IsOptional()
    @IsString()
    thankYouMessage?: string;
}
