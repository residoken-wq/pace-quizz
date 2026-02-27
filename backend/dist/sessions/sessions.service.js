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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SessionsService = class SessionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createSessionDto) {
        const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
        return this.prisma.session.create({
            data: {
                name: createSessionDto.name,
                hostId: createSessionDto.hostId,
                type: createSessionDto.type || 'LIVE',
                pin: generatedPin,
            },
        });
    }
    findAll() {
        return this.prisma.session.findMany({
            include: { host: true, questions: true },
        });
    }
    findByHost(hostId) {
        return this.prisma.session.findMany({
            where: { hostId },
            include: { questions: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const session = await this.prisma.session.findUnique({
            where: { id },
            include: { host: true, questions: { orderBy: { order: 'asc' } }, participants: true },
        });
        if (!session)
            throw new common_1.NotFoundException(`Session with ID ${id} not found`);
        return session;
    }
    async findByPin(pin) {
        const session = await this.prisma.session.findUnique({
            where: { pin },
            include: { questions: { orderBy: { order: 'asc' } } },
        });
        if (!session)
            throw new common_1.NotFoundException(`Session with PIN ${pin} not found`);
        return session;
    }
    update(id, updateSessionDto) {
        return this.prisma.session.update({ where: { id }, data: updateSessionDto });
    }
    remove(id) {
        return this.prisma.session.delete({ where: { id } });
    }
    async startSession(id) {
        const session = await this.prisma.session.update({
            where: { id },
            data: { status: 'ACTIVE' },
        });
        await this.prisma.activityLog.create({
            data: { sessionId: id, action: 'SESSION_STARTED' },
        });
        return session;
    }
    async endSession(id) {
        const session = await this.prisma.session.update({
            where: { id },
            data: { status: 'FINISHED' },
        });
        await this.prisma.activityLog.create({
            data: { sessionId: id, action: 'SESSION_ENDED' },
        });
        return session;
    }
    async resetResults(id) {
        const questions = await this.prisma.question.findMany({
            where: { sessionId: id },
            select: { id: true },
        });
        const questionIds = questions.map(q => q.id);
        await this.prisma.response.deleteMany({
            where: { questionId: { in: questionIds } },
        });
        await this.prisma.participant.deleteMany({
            where: { sessionId: id },
        });
        await this.prisma.session.update({
            where: { id },
            data: { status: 'CREATED' },
        });
        await this.prisma.activityLog.create({
            data: {
                sessionId: id,
                action: 'RESULTS_RESET',
                details: { questionsReset: questionIds.length },
            },
        });
        return { message: 'Results reset successfully', questionsReset: questionIds.length };
    }
    getActivityLogs(id) {
        return this.prisma.activityLog.findMany({
            where: { sessionId: id },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async getResults(id) {
        const questions = await this.prisma.question.findMany({
            where: { sessionId: id },
            orderBy: { order: 'asc' },
            include: {
                responses: true,
            },
        });
        return questions.map(q => {
            const options = q.options || [];
            const voteCounts = {};
            options.forEach((opt) => { voteCounts[opt.id] = 0; });
            q.responses.forEach(r => {
                const answer = r.answer;
                if (answer?.optionId && voteCounts[answer.optionId] !== undefined) {
                    voteCounts[answer.optionId]++;
                }
            });
            return {
                id: q.id,
                title: q.title,
                type: q.type,
                order: q.order,
                options,
                totalResponses: q.responses.length,
                voteCounts,
            };
        });
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map