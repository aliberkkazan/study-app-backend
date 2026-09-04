import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { User, UserRole } from '../src/users/entities/user.entity';
import { StudyProfile, StudyTrack, UserSkillLevel } from '../src/study-profile/entities/study-profile.entity';
import { DiagnosticResult } from '../src/study-profile/entities/diagnostic-result.entity';
import { Roadmap, RoadmapStatus } from '../src/roadmap/entities/roadmap.entity';
import { RoadmapVersion, RoadmapGenerationReason } from '../src/roadmap/entities/roadmap-version.entity';
import { RoadmapItem, RoadmapItemType, RoadmapItemStatus } from '../src/roadmap/entities/roadmap-item.entity';
import { Task } from '../src/tasks/entities/task.entity';
import { StudySession, StudySessionStatus, SessionVerificationStatus } from '../src/study-sessions/entities/study-session.entity';
import { StudyResult } from '../src/study-sessions/entities/study-result.entity';
import { AccountabilityGroup } from '../src/accountability/entities/accountability-group.entity';
import { GroupMember, GroupRole } from '../src/accountability/entities/group-member.entity';
import { AccessGrant, AccessScope, AccessGrantStatus } from '../src/accountability/entities/access-grant.entity';
import { ExamVersion } from '../src/exam-packs/entities/exam-version.entity';
import { Subject } from '../src/exam-packs/entities/subject.entity';
import { Topic } from '../src/exam-packs/entities/topic.entity';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'study-app',
  synchronize: false,
  logging: false,
  entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
});

async function runSeed() {
  console.log('Starting sample data seeding process...');
  await dataSource.initialize();
  console.log('Database connection initialized successfully.');

  const userRepo = dataSource.getRepository(User);
  const examVersionRepo = dataSource.getRepository(ExamVersion);
  const subjectRepo = dataSource.getRepository(Subject);
  const topicRepo = dataSource.getRepository(Topic);
  const studyProfileRepo = dataSource.getRepository(StudyProfile);
  const diagnosticResultRepo = dataSource.getRepository(DiagnosticResult);
  const roadmapRepo = dataSource.getRepository(Roadmap);
  const roadmapVersionRepo = dataSource.getRepository(RoadmapVersion);
  const roadmapItemRepo = dataSource.getRepository(RoadmapItem);
  const taskRepo = dataSource.getRepository(Task);
  const studySessionRepo = dataSource.getRepository(StudySession);
  const studyResultRepo = dataSource.getRepository(StudyResult);
  const groupRepo = dataSource.getRepository(AccountabilityGroup);
  const groupMemberRepo = dataSource.getRepository(GroupMember);
  const accessGrantRepo = dataSource.getRepository(AccessGrant);

  // 1. Ensure Student User
  let student = await userRepo.findOneBy({ email: 'abk@abk.com' });
  if (!student) {
    const passwordHash = await bcrypt.hash('password123', 10);
    student = userRepo.create({
      email: 'abk@abk.com',
      name: 'Ali Berk (Student)',
      password: passwordHash,
      role: UserRole.STUDENT,
    });
    student = await userRepo.save(student);
    console.log('Created student user: abk@abk.com');
  } else {
    console.log('Found student user: abk@abk.com');
  }

  // 2. Ensure Partner/Supporter User
  let supporter = await userRepo.findOneBy({ email: 'destekci@de.com' });
  if (!supporter) {
    const passwordHash = await bcrypt.hash('password123', 10);
    supporter = userRepo.create({
      email: 'destekci@de.com',
      name: 'Destekçi Öğrenci',
      password: passwordHash,
      role: UserRole.STUDENT,
    });
    supporter = await userRepo.save(supporter);
    console.log('Created supporter user: destekci@de.com');
  } else {
    console.log('Found supporter user: destekci@de.com');
  }

  // 3. Ensure Mentor User
  let mentor = await userRepo.findOneBy({ email: 'mentor@studyapp.com' });
  if (!mentor) {
    const passwordHash = await bcrypt.hash('password123', 10);
    mentor = userRepo.create({
      email: 'mentor@studyapp.com',
      name: 'Ahmet Hoca (Mentor)',
      password: passwordHash,
      role: UserRole.MENTOR,
      mentorCode: 'MNT101',
    });
    mentor = await userRepo.save(mentor);
    console.log('Created mentor user: mentor@studyapp.com');
  } else {
    console.log('Found mentor user: mentor@studyapp.com');
  }

  // Assign student to mentor if not already
  const mentorWithStudents = await userRepo.findOne({
    where: { id: mentor.id },
    relations: ['students'],
  });
  if (mentorWithStudents && !mentorWithStudents.students.some((s) => s.id === student.id)) {
    mentorWithStudents.students.push(student);
    await userRepo.save(mentorWithStudents);
    console.log('Assigned student to mentor.');
  }

  // 4. Fetch ExamVersion (YKS)
  const yksExamVersion = await examVersionRepo.findOne({
    where: { isCurrent: true, version: '2026-2027' },
  });
  if (!yksExamVersion) {
    throw new Error('YKS ExamVersion (2026-2027) not found in database.');
  }
  console.log('Found active YKS exam version:', yksExamVersion.displayName);

  // 5. Seed StudyProfile
  let profile = await studyProfileRepo.findOneBy({ userId: student.id });
  if (!profile) {
    profile = studyProfileRepo.create({
      userId: student.id,
      targetExamVersionId: yksExamVersion.id,
      track: StudyTrack.SAYISAL,
      targetExamDate: new Date('2027-06-20T09:00:00Z'),
      targetScore: 480,
      currentScore: 350,
      targetRank: 15000,
      weeklyAvailabilityMinutes: 1500,
      dailyAvailability: {
        monday: 180,
        tuesday: 180,
        wednesday: 180,
        thursday: 180,
        friday: 180,
        saturday: 300,
        sunday: 300,
      },
      currentLevel: UserSkillLevel.INTERMEDIATE,
      timezone: 'Europe/Istanbul',
    });
    profile = await studyProfileRepo.save(profile);
    console.log('Created study profile for student.');
  } else {
    console.log('Study profile already exists for student.');
  }

  // 6. Seed DiagnosticResult
  const existingDiag = await diagnosticResultRepo.findOneBy({ userId: student.id });
  if (!existingDiag) {
    const diag = diagnosticResultRepo.create({
      userId: student.id,
      examVersionId: yksExamVersion.id,
      title: 'TYT Seviye Belirleme Denemesi #1',
      dateTaken: new Date(Date.now() - 7 * 24 * 3600 * 1000),
      totalNetScore: 78.5,
      sectionScores: {
        TYT_TURKCE: { correct: 30, wrong: 6, net: 28.5 },
        TYT_MATEMATIK: { correct: 25, wrong: 5, net: 23.75 },
        TYT_FEN: { correct: 15, wrong: 4, net: 14.0 },
        TYT_SOSYAL: { correct: 13, wrong: 3, net: 12.25 },
      },
      notes: 'Matematik problemleri ve paragraf üzerinde yoğunlaşılmalı.',
    });
    await diagnosticResultRepo.save(diag);
    console.log('Created diagnostic result for student.');
  } else {
    console.log('Diagnostic result already exists for student.');
  }

  // 7. Seed Tasks
  let task1 = await taskRepo.findOne({
    where: {
      owner: { id: student.id },
      title: 'TYT Matematik - Temel Kavramlar 50 Soru Çözümü',
    },
  });
  if (!task1) {
    task1 = taskRepo.create({
      title: 'TYT Matematik - Temel Kavramlar 50 Soru Çözümü',
      description: 'Konu testleri 1 ve 2 bitirilecek, takıldığın sorular not edilecek.',
      completed: true,
      scheduledDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      dueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      owner: student,
      assignedBy: mentor,
      subject: 'TYT Matematik',
      topic: 'Temel Kavramlar',
      source: 'Soru Bankası',
      targetOutcome: '50 soru çözümü',
      active: true,
    });
    task1 = await taskRepo.save(task1);
    console.log('Created task 1 for student.');
  }

  let task2 = await taskRepo.findOne({
    where: {
      owner: { id: student.id },
      title: 'TYT Türkçe - 30 Paragraf Sorusu',
    },
  });
  if (!task2) {
    task2 = taskRepo.create({
      title: 'TYT Türkçe - 30 Paragraf Sorusu',
      description: 'Süre tutularak çözülecek (maksimum 35 dakika).',
      completed: false,
      scheduledDate: new Date(),
      dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      owner: student,
      assignedBy: mentor,
      subject: 'TYT Türkçe',
      topic: 'Paragrafta Anlam',
      source: 'Deneme Seti',
      targetOutcome: '30 soru hız testi',
      active: true,
    });
    task2 = await taskRepo.save(task2);
    console.log('Created task 2 for student.');
  }

  // 8. Seed Roadmap, RoadmapVersion and RoadmapItem
  let roadmap = await roadmapRepo.findOneBy({ userId: student.id });
  if (!roadmap) {
    roadmap = roadmapRepo.create({
      userId: student.id,
      studyProfileId: profile.id,
      status: RoadmapStatus.ACTIVE,
      startDate: new Date('2026-09-01T00:00:00Z'),
      targetExamDate: new Date('2027-06-20T09:00:00Z'),
    });
    roadmap = await roadmapRepo.save(roadmap);
    console.log('Created roadmap for student.');

    const roadmapVersion = roadmapVersionRepo.create({
      roadmapId: roadmap.id,
      versionNumber: 1,
      isCurrent: true,
      generatedReason: RoadmapGenerationReason.INITIAL,
      totalWeeks: 36,
    });
    const savedVersion = await roadmapVersionRepo.save(roadmapVersion);
    console.log('Created roadmap version 1.');

    // Fetch subjects and topics
    const mathSubject = await subjectRepo.findOneBy({ code: 'TYT_MATEMATIK' });
    const mathTopic = await topicRepo.findOneBy({ code: 'TYT_MAT_TEMEL_KAVRAMLAR' });

    const trSubject = await subjectRepo.findOneBy({ code: 'TYT_TURKCE' });
    const trTopic = await topicRepo.findOneBy({ code: 'TYT_TR_PARAGRAF' });

    const fizSubject = await subjectRepo.findOneBy({ code: 'TYT_FIZIK' });
    const fizTopic = await topicRepo.findOneBy({ code: 'TYT_FIZ_BILIM_GIRIS' });

    const geoSubject = await subjectRepo.findOneBy({ code: 'TYT_GEOMETRI' });
    const geoTopic = await topicRepo.findOneBy({ code: 'GEO_DOGRUDACIDA' });

    const items = [
      roadmapItemRepo.create({
        roadmapVersionId: savedVersion.id,
        subjectId: mathSubject?.id,
        topicId: mathTopic?.id,
        type: RoadmapItemType.LEARN,
        targetWeekNumber: 1,
        targetDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        estimatedMinutes: 120,
        targetOutcome: 'Temel Kavramlar konu anlatımı ve 40 soru',
        status: RoadmapItemStatus.COMPLETED,
        linkedTaskId: task1.id,
      }),
      roadmapItemRepo.create({
        roadmapVersionId: savedVersion.id,
        subjectId: trSubject?.id,
        topicId: trTopic?.id,
        type: RoadmapItemType.PRACTICE,
        targetWeekNumber: 1,
        targetDate: new Date(),
        estimatedMinutes: 90,
        targetOutcome: 'Paragrafta Hız ve Anlam - 30 soru',
        status: RoadmapItemStatus.IN_PROGRESS,
        linkedTaskId: task2.id,
      }),
      roadmapItemRepo.create({
        roadmapVersionId: savedVersion.id,
        subjectId: fizSubject?.id,
        topicId: fizTopic?.id,
        type: RoadmapItemType.LEARN,
        targetWeekNumber: 2,
        targetDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
        estimatedMinutes: 90,
        targetOutcome: 'Fizik Bilimine Giriş ve Madde Özellikleri konu özeti',
        status: RoadmapItemStatus.PENDING,
      }),
      roadmapItemRepo.create({
        roadmapVersionId: savedVersion.id,
        subjectId: geoSubject?.id,
        topicId: geoTopic?.id,
        type: RoadmapItemType.LEARN,
        targetWeekNumber: 2,
        targetDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        estimatedMinutes: 120,
        targetOutcome: 'Doğruda ve Üçgende Açılar formülleri ve 25 soru',
        status: RoadmapItemStatus.PENDING,
      }),
    ];
    await roadmapItemRepo.save(items);
    console.log('Created 4 roadmap items.');
  } else {
    console.log('Roadmap already exists for student.');
  }

  // 9. Seed StudySessions and StudyResults
  const existingSessions = await studySessionRepo.find({ where: { user: { id: student.id } } });
  if (existingSessions.length === 0) {
    const session1 = studySessionRepo.create({
      user: student,
      task: task1,
      startTime: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 14 * 3600 * 1000),
      endTime: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 15 * 3600 * 1000 + 25 * 60 * 1000),
      targetDuration: 90,
      actualDuration: 85,
      status: StudySessionStatus.FINISHED,
      verificationStatus: SessionVerificationStatus.VERIFIED,
      verifiedBy: mentor,
      mentorFeedback: 'Soru çözüm hızın ve doğru oranın gayet iyi.',
    });
    const savedSession1 = await studySessionRepo.save(session1);

    const result1 = studyResultRepo.create({
      session: savedSession1,
      correctCount: 42,
      wrongCount: 8,
      notes: 'Temel kavramlar kavrandı, son testteki yeni nesil sorular biraz zordu.',
      focusQuality: 4,
    });
    await studyResultRepo.save(result1);

    const session2 = studySessionRepo.create({
      user: student,
      task: task2,
      startTime: new Date(Date.now() - 24 * 3600 * 1000 + 16 * 3600 * 1000),
      endTime: new Date(Date.now() - 24 * 3600 * 1000 + 16 * 3600 * 1000 + 55 * 60 * 1000),
      targetDuration: 60,
      actualDuration: 55,
      status: StudySessionStatus.FINISHED,
      verificationStatus: SessionVerificationStatus.UNVERIFIED,
    });
    const savedSession2 = await studySessionRepo.save(session2);

    const result2 = studyResultRepo.create({
      session: savedSession2,
      correctCount: 26,
      wrongCount: 4,
      notes: 'Paragraf hız denemesi tamamlandı.',
      focusQuality: 5,
    });
    await studyResultRepo.save(result2);

    console.log('Created 2 study sessions with results.');
  } else {
    console.log('Study sessions already exist for student.');
  }

  // 10. Seed AccountabilityGroup & GroupMember
  let group = await groupRepo.findOneBy({ code: 'GRP-YKS27' });
  if (!group) {
    group = groupRepo.create({
      name: 'YKS 2027 Sayısal Hedef 15K',
      description: 'Haftalık hedef takibi ve soru çözüm disiplini çalışma grubu',
      code: 'GRP-YKS27',
      creator: student,
      isPrivate: false,
    });
    group = await groupRepo.save(group);

    const member1 = groupMemberRepo.create({
      groupId: group.id,
      userId: student.id,
      role: GroupRole.ADMIN,
      joinedAt: new Date(),
    });
    const member2 = groupMemberRepo.create({
      groupId: group.id,
      userId: supporter.id,
      role: GroupRole.MEMBER,
      joinedAt: new Date(),
    });
    await groupMemberRepo.save([member1, member2]);
    console.log('Created accountability group and members.');
  } else {
    console.log('Accountability group already exists.');
  }

  // 11. Seed AccessGrant
  let grant = await accessGrantRepo.findOneBy({ inviteCode: 'AG-YKS2027' });
  if (!grant) {
    grant = accessGrantRepo.create({
      granter: student,
      grantee: mentor,
      scope: AccessScope.MENTOR,
      status: AccessGrantStatus.ACTIVE,
      inviteCode: 'AG-YKS2027',
      inviteEmail: mentor.email,
      permissions: {
        canAssignTasks: true,
        canViewResults: true,
        canVerifySessions: true,
        canGiveFeedback: true,
      },
      expiresAt: new Date('2027-12-31T23:59:59Z'),
    });
    await accessGrantRepo.save(grant);
    console.log('Created access grant for mentor.');
  } else {
    console.log('Access grant already exists.');
  }

  console.log('Sample data seeding finished successfully!');
  await dataSource.destroy();
}

runSeed().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
