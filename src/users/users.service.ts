import { Injectable, ConflictException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import { ConnectionRequest, RequestStatus } from './entities/connection-request.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ConnectionRequest)
    private requestRepository: Repository<ConnectionRequest>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOneBy({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    let mentorCode: string | undefined = undefined;
    if (createUserDto.role === UserRole.MENTOR) {
      mentorCode = this.generateMentorCode();
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      mentorCode,
    });

    return this.usersRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id }, relations: ['mentors'] });
  }

  async findAll(role?: string, mentorId?: string) {
    const query = this.usersRepository.createQueryBuilder('user');

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (mentorId) {
      query.innerJoin('user.mentors', 'mentor', 'mentor.id = :mentorId', { mentorId });
    }

    return query.getMany();
  }

  async assignStudent(mentorId: string, studentId: string): Promise<User> {
    const mentor = await this.usersRepository.findOne({ where: { id: mentorId }, relations: ['students'] });
    const student = await this.usersRepository.findOneBy({ id: studentId });

    if (!mentor) {
      throw new NotFoundException(`Mentor with ID ${mentorId} not found`);
    }
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const isAssigned = mentor.students.some(s => s.id === studentId);
    if (!isAssigned) {
      mentor.students.push(student);
      await this.usersRepository.save(mentor);
    }

    return mentor;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['students', 'mentors'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Manual cascade: clear ManyToMany relations
    user.students = [];
    user.mentors = [];
    await this.usersRepository.save(user);

    // Manual cascade: delete all connection requests where user is involved
    await this.requestRepository.delete({ student: { id } });
    await this.requestRepository.delete({ mentor: { id } });

    await this.usersRepository.delete(id);
  }

  private generateMentorCode(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  async createRequest(studentId: string, mentorCode: string) {
    const student = await this.usersRepository.findOneBy({ id: studentId });
    if (!student) throw new NotFoundException('Student not found');
    if (student.role !== UserRole.STUDENT) throw new BadRequestException('Only students can send requests');

    const mentor = await this.usersRepository.findOneBy({ mentorCode });
    if (!mentor) throw new NotFoundException('Mentor code invalid');

    const existing = await this.requestRepository.findOne({
      where: { student: { id: studentId }, mentor: { id: mentor.id }, status: RequestStatus.PENDING },
    });
    if (existing) throw new ConflictException('Request already pending');

    const request = this.requestRepository.create({
      student,
      mentor,
      status: RequestStatus.PENDING,
    });
    return this.requestRepository.save(request);
  }

  async getMyPendingRequests(mentorId: string) {
    return this.requestRepository.find({
      where: { mentor: { id: mentorId }, status: RequestStatus.PENDING },
      relations: ['student'],
    });
  }

  async respondToRequest(mentorId: string, requestId: string, status: 'approved' | 'rejected') {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['student', 'mentor'],
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.mentor.id !== mentorId) throw new UnauthorizedException('Not your request');
    if (request.status !== RequestStatus.PENDING) throw new BadRequestException('Request already responded');

    request.status = status === 'approved' ? RequestStatus.APPROVED : RequestStatus.REJECTED;
    await this.requestRepository.save(request);

    if (status === 'approved') {
      await this.assignStudent(mentorId, request.student.id);
    }

    return request;
  }

  async ensureMentorCode(user: User): Promise<User> {
    if (user.role === UserRole.MENTOR && !user.mentorCode) {
      user.mentorCode = this.generateMentorCode();
      return this.usersRepository.save(user);
    }
    return user;
  }

  async refreshMentorCode(userId: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.MENTOR) throw new BadRequestException('Only mentors can have a code');

    if (user.lastMentorCodeUpdate) {
      const now = new Date();
      const lastUpdate = new Date(user.lastMentorCodeUpdate);
      const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 12) {
        throw new BadRequestException(`You can only refresh your code once every 12 hours. Try again in ${Math.ceil(12 - hoursDiff)} hours.`);
      }
    }

    user.mentorCode = this.generateMentorCode();
    user.lastMentorCodeUpdate = new Date();

    return this.usersRepository.save(user);
  }

  async removeStudent(mentorId: string, studentId: string): Promise<void> {
    const mentor = await this.usersRepository.findOne({
      where: { id: mentorId },
      relations: ['students'],
    });

    if (!mentor) throw new NotFoundException('Mentor not found');

    mentor.students = mentor.students.filter(s => s.id !== studentId);
    await this.usersRepository.save(mentor);

    const requests = await this.requestRepository.find({
      where: { mentor: { id: mentorId }, student: { id: studentId }, status: RequestStatus.APPROVED },
    });

    for (const req of requests) {
      req.status = RequestStatus.REJECTED;
      await this.requestRepository.save(req);
    }
  }
}
