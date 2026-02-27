import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinSession(data: {
        sessionId: string;
        role: 'host' | 'participant';
    }, client: Socket): Promise<{
        status: string;
        room: string;
    }>;
    handleStateUpdate(data: {
        sessionId: string;
        questionId: string;
        status: string;
    }, client: Socket): {
        status: string;
    };
    handleSubmitVote(data: {
        sessionId: string;
        questionId: string;
        answer: any;
    }, client: Socket): Promise<{
        status: string;
    }>;
}
