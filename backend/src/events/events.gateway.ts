import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    @MessageBody() data: { sessionId: string; role: 'host' | 'participant' },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `session_${data.sessionId}`;
    await client.join(roomName);

    // Host joins a dedicated room for receiving vote data (avoids broadcasting to all participants)
    if (data.role === 'host') {
      const hostRoom = `host_${data.sessionId}`;
      await client.join(hostRoom);
    }

    // Notify host that a participant joined
    if (data.role === 'participant') {
      const hostRoom = `host_${data.sessionId}`;
      this.server.to(hostRoom).emit('participant_joined', {
        clientId: client.id,
      });
    }

    return { status: 'joined', room: roomName };
  }

  @SubscribeMessage('host_state_update')
  handleStateUpdate(
    @MessageBody() data: { sessionId: string; questionId: string; status: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Presenter updates the current state (e.g. moves to next slide)
    const roomName = `session_${data.sessionId}`;
    this.server.to(roomName).emit('state_sync', data);
    return { status: 'synced' };
  }

  @SubscribeMessage('submit_vote')
  async handleSubmitVote(
    @MessageBody() data: { sessionId: string; questionId: string; answer: any },
    @ConnectedSocket() client: Socket,
  ) {
    // Only send vote data to the host — NOT to all 500 participants
    const hostRoom = `host_${data.sessionId}`;
    this.server.to(hostRoom).emit('new_vote', {
      clientId: client.id,
      questionId: data.questionId,
      answer: data.answer,
    });

    return { status: 'vote_recorded' };
  }
}
