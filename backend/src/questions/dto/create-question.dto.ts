import { IsString, IsInt, IsOptional, IsEnum, Allow } from 'class-validator';

export class CreateQuestionDto {
    @IsString()
    sessionId: string;

    @IsString()
    title: string;

    @IsInt()
    order: number;

    @IsOptional()
    @IsEnum(['MULTIPLE_CHOICE', 'WORD_CLOUD', 'RATING_SCALE', 'POLL', 'SLIDE'])
    type?: 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RATING_SCALE' | 'POLL' | 'SLIDE';

    @IsOptional()
    @Allow()
    options?: any; // JSON — array of options OR slide canvas data

    @IsOptional()
    @IsInt()
    timeLimit?: number;
}
