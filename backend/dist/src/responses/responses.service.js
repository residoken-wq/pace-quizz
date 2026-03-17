"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponsesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ResponsesService = class ResponsesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const { participantId, questionId, answer, timeTaken } = data;
        if (!participantId || !questionId || !answer) {
            throw new common_1.BadRequestException('Missing required fields for response');
        }
        return this.prisma.response.upsert({
            where: {
                participantId_questionId: { participantId, questionId }
            },
            update: {
                answer,
                timeTaken: timeTaken || 0,
            },
            create: {
                participantId,
                questionId,
                answer,
                timeTaken: timeTaken || 0,
            },
        });
    }
};
exports.ResponsesService = ResponsesService;
exports.ResponsesService = ResponsesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResponsesService);
//# sourceMappingURL=responses.service.js.map