import { Controller, Post, Body } from '@nestjs/common';
import { ResponsesService } from './responses.service';

@Controller('responses')
export class ResponsesController {
    constructor(private readonly responsesService: ResponsesService) { }

    @Post()
    create(@Body() createResponseDto: any) {
        return this.responsesService.create(createResponseDto);
    }
}
