export declare class CreateQuestionDto {
    sessionId: string;
    title: string;
    order: number;
    type?: 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RATING_SCALE' | 'POLL';
    options?: any;
    timeLimit?: number;
}
