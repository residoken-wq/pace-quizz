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
    origin: '*',
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

    // Notify host that a participant joined
    if (data.role === 'participant') {
      this.server.to(roomName).emit('participant_joined', {
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
    // Broadcast vote to the host in real-time
    const roomName = `session_${data.sessionId}`;
    this.server.to(roomName).emit('new_vote', {
      clientId: client.id,
      questionId: data.questionId,
      answer: data.answer,
    });

    // In a real app, you would also save to the database here or via an API endpoint.
    return { status: 'vote_recorded' };
  }
}
