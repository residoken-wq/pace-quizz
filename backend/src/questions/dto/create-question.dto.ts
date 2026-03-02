import { IsString, IsInt, IsOptional, IsEnum, IsObject, IsArray } from 'class-validator';

export class CreateQuestionDto {
    @IsString()
    sessionId: string;

    @IsString()
    title: string;

    @IsInt()
    order: number;

    @IsOptional()
    @IsEnum(['MULTIPLE_CHOICE', 'WORD_CLOUD', 'RATING_SCALE', 'POLL'])
    type?: 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RATING_SCALE' | 'POLL';

    @IsOptional()
    options?: any; // JSON array of options

    @IsOptional()
    @IsInt()
    timeLimit?: number;
}
