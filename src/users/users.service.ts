import { Injectable, ConflictException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import { ConnectionRequest, RequestStatus } from './entities/connection-request.entity';
import { Program } from '../programs/entities/program.entity';
import { Submission } from '../submissions/entities/submission.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ConnectionRequest)
    private requestRepository: Repository<ConnectionRequest>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
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
      // Ensure uniqueness loop could be added here but for 6 chars collision is rare enough for MVP
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
      // We want to find users who have this mentor in their 'mentors' list
      // Since it's ManyToMany 'students' on mentor side corresponds to 'mentors' on student side
      // Actually, if we want to find students OF a mentor:
      // We look at the 'students' relation of the mentor.
      // Or we look at users where 'mentors' contains this mentorId.
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

    // Check if role valid (optional but good practice)
    if (mentor.role !== 'mentor' && mentor.role !== 'admin') {
      // Flexible with admin
    }

    // Check if already assigned
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
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Manual cascade: delete all connection requests where user is involved
    await this.requestRepository.delete({ student: { id } });
    await this.requestRepository.delete({ mentor: { id } });

    // Manual cascade: delete related submissions
    await this.submissionRepository.delete({ student: { id } });

    // Manual cascade: delete related programs (as student or mentor)
    await this.programRepository.delete({ student: { id } });
    await this.programRepository.delete({ mentor: { id } });
    await this.usersRepository.delete(id);
  }

  private generateMentorCode(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  }

  async createRequest(studentId: string, mentorCode: string) {
    const student = await this.usersRepository.findOneBy({ id: studentId });
    if (!student) throw new NotFoundException('Student not found');
    if (student.role !== UserRole.STUDENT) throw new BadRequestException('Only students can send requests');

    const mentor = await this.usersRepository.findOneBy({ mentorCode });
    if (!mentor) throw new NotFoundException('Mentor code invalid');

    // Check if already requested or connected
    const existing = await this.requestRepository.findOne({
      where: { student: { id: studentId }, mentor: { id: mentor.id }, status: RequestStatus.PENDING },
    });
    if (existing) throw new ConflictException('Request already pending');

    // Check if already assigned
    // (Ideally we check user.mentors list, but for now assuming request flow controls it)

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

    // Rate Limit Check (e.g., 12 hours)
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

    // Remove from students list
    mentor.students = mentor.students.filter(s => s.id !== studentId);
    await this.usersRepository.save(mentor);

    // Update connection request status to rejected/disconnected
    // We search for APPROVED requests to mark them as terminated or REJECTED
    // Ideally we might want a DISCONNECTED status but REJECTED works for "not connected"
    const requests = await this.requestRepository.find({
      where: { mentor: { id: mentorId }, student: { id: studentId }, status: RequestStatus.APPROVED },
    });

    for (const req of requests) {
      req.status = RequestStatus.REJECTED; // Or delete it: this.requestRepository.remove(req);
      await this.requestRepository.save(req);
    }
  }
}
