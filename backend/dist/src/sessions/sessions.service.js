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
            if (q.type === 'WORD_CLOUD') {
                const wordCounts = {};
                q.responses.forEach(r => {
                    const answer = r.answer;
                    if (answer && typeof answer.text === 'string') {
                        const wordText = answer.text.trim();
                        if (wordText) {
                            const lowerText = wordText.toLowerCase();
                            wordCounts[lowerText] = (wordCounts[lowerText] || 0) + 1;
                        }
                    }
                });
                const wordCloudData = Object.entries(wordCounts)
                    .map(([text, value]) => ({ text, value }))
                    .sort((a, b) => b.value - a.value);
                return {
                    id: q.id,
                    title: q.title,
                    type: q.type,
                    order: q.order,
                    totalResponses: q.responses.length,
                    wordCloudData,
                };
            }
            if (q.type === 'RATING_SCALE') {
                const cfg = q.options || { min: 1, max: 5, step: 1 };
                const voteCounts = {};
                for (let v = cfg.min; v <= cfg.max; v += cfg.step) {
                    voteCounts[String(v)] = 0;
                }
                q.responses.forEach(r => {
                    const answer = r.answer;
                    if (answer?.text) {
                        const key = String(answer.text).trim();
                        if (voteCounts[key] !== undefined) {
                            voteCounts[key]++;
                        }
                    }
                });
                return {
                    id: q.id,
                    title: q.title,
                    type: q.type,
                    order: q.order,
                    options: q.options,
                    totalResponses: q.responses.length,
                    voteCounts,
                };
            }
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
    async joinSession(pin, nickname, mascot) {
        const session = await this.findByPin(pin);
        if (!session)
            throw new common_1.NotFoundException(`Session with PIN ${pin} not found`);
        const existing = await this.prisma.participant.findFirst({
            where: { sessionId: session.id, nickname }
        });
        if (existing) {
            if (existing.mascot !== mascot) {
                return this.prisma.participant.update({
                    where: { id: existing.id },
                    data: { mascot }
                });
            }
            return existing;
        }
        return this.prisma.participant.create({
            data: {
                sessionId: session.id,
                nickname,
                mascot
            }
        });
    }
    async getLeaderboard(sessionId) {
        const participants = await this.prisma.participant.findMany({
            where: { sessionId },
            include: {
                responses: {
                    include: { question: true }
                }
            }
        });
        const leaderboard = participants.map(p => {
            let correctAnswers = 0;
            let totalTimeTaken = 0;
            p.responses.forEach(r => {
                const qOptions = r.question.options || [];
                const answer = r.answer;
                const chosenOption = qOptions.find(opt => opt.id === answer?.optionId);
                if (chosenOption && chosenOption.isCorrect) {
                    correctAnswers++;
                }
                if (r.timeTaken) {
                    totalTimeTaken += r.timeTaken;
                }
            });
            return {
                id: p.id,
                nickname: p.nickname,
                mascot: p.mascot,
                correctAnswers,
                totalTimeTaken
            };
        });
        return leaderboard
            .sort((a, b) => {
            if (b.correctAnswers !== a.correctAnswers) {
                return b.correctAnswers - a.correctAnswers;
            }
            return a.totalTimeTaken - b.totalTimeTaken;
        })
            .slice(0, 5);
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map