import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createSessionDto: CreateSessionDto) {
    // Generate a random 6-digit numeric PIN
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();

    return this.prisma.session.create({
      data: {
        name: createSessionDto.name,
        hostId: createSessionDto.hostId as string,
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

  findByHost(hostId: string) {
    return this.prisma.session.findMany({
      where: { hostId },
      include: { questions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { host: true, questions: true, participants: true },
    });
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    return session;
  }

  async findByPin(pin: string) {
    const session = await this.prisma.session.findUnique({
      where: { pin },
      include: { questions: true },
    });
    if (!session) {
      throw new NotFoundException(`Session with PIN ${pin} not found`);
    }
    return session;
  }

  update(id: string, updateSessionDto: UpdateSessionDto) {
    return this.prisma.session.update({
      where: { id },
      data: updateSessionDto,
    });
  }

  remove(id: string) {
    return this.prisma.session.delete({
      where: { id },
    });
  }
}
