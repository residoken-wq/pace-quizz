"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const redis_io_adapter_1 = require("./redis-io.adapter");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true }));
    try {
        const redisIoAdapter = new redis_io_adapter_1.RedisIoAdapter(app);
        await redisIoAdapter.connectToRedis();
        app.useWebSocketAdapter(redisIoAdapter);
        console.log('✅ Redis WebSocket adapter connected successfully');
    }
    catch (error) {
        console.warn('⚠️ Redis WebSocket adapter failed to connect. WebSockets will use in-memory adapter.', error.message);
    }
    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    console.log(`🚀 Backend is running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map