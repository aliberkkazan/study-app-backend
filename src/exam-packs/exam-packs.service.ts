import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './entities/country.entity';
import { EducationSystem } from './entities/education-system.entity';
import { Exam } from './entities/exam.entity';
import { ExamVersion } from './entities/exam-version.entity';
import { ExamSection } from './entities/exam-section.entity';
import { Subject } from './entities/subject.entity';
import { Topic } from './entities/topic.entity';
import { YKS_EXAM_PACK_DATA } from './seeds/yks-exam-pack.seed';

@Injectable()
export class ExamPacksService implements OnModuleInit {
  private readonly logger = new Logger(ExamPacksService.name);

  constructor(
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(EducationSystem)
    private readonly eduSystemRepo: Repository<EducationSystem>,
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
    @InjectRepository(ExamVersion)
    private readonly examVersionRepo: Repository<ExamVersion>,
    @InjectRepository(ExamSection)
    private readonly examSectionRepo: Repository<ExamSection>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(Topic)
    private readonly topicRepo: Repository<Topic>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedYksPackIfMissing();
  }

  async seedYksPackIfMissing(): Promise<void> {
    const existingExam = await this.examRepo.findOne({
      where: { code: 'YKS' },
    });

    if (existingExam) {
      this.logger.log('Exam pack for YKS already initialized.');
      return;
    }

    this.logger.log('Seeding official YKS exam pack data...');

    let country = await this.countryRepo.findOne({
      where: { code: YKS_EXAM_PACK_DATA.code },
    });
    if (!country) {
      country = this.countryRepo.create({
        code: YKS_EXAM_PACK_DATA.code,
        name: YKS_EXAM_PACK_DATA.name,
        nativeName: YKS_EXAM_PACK_DATA.nativeName,
        defaultTimezone: YKS_EXAM_PACK_DATA.defaultTimezone,
      });
      country = await this.countryRepo.save(country);
    }

    for (const eduSysData of YKS_EXAM_PACK_DATA.educationSystems) {
      let eduSystem = await this.eduSystemRepo.findOne({
        where: { code: eduSysData.code },
      });
      if (!eduSystem) {
        eduSystem = this.eduSystemRepo.create({
          code: eduSysData.code,
          name: eduSysData.name,
          nativeName: eduSysData.nativeName,
          countryId: country.id,
        });
        eduSystem = await this.eduSystemRepo.save(eduSystem);
      }

      for (const examData of eduSysData.exams) {
        let exam = await this.examRepo.findOne({
          where: { code: examData.code },
        });
        if (!exam) {
          exam = this.examRepo.create({
            code: examData.code,
            name: examData.name,
            nativeName: examData.nativeName,
            description: examData.description,
            educationSystemId: eduSystem.id,
          });
          exam = await this.examRepo.save(exam);
        }

        for (const versionData of examData.versions) {
          let version = await this.examVersionRepo.findOne({
            where: { examId: exam.id, version: versionData.version },
          });
          if (!version) {
            version = this.examVersionRepo.create({
              examId: exam.id,
              version: versionData.version,
              displayName: versionData.displayName,
              validFrom: new Date(versionData.validFrom),
              validTo: new Date(versionData.validTo),
              officialSourceUrl: versionData.officialSourceUrl,
              verifiedAt: new Date(versionData.verifiedAt),
              verifiedBy: versionData.verifiedBy,
              isCurrent: versionData.isCurrent,
            });
            version = await this.examVersionRepo.save(version);
          }

          for (const secData of versionData.sections) {
            let section = await this.examSectionRepo.findOne({
              where: { examVersionId: version.id, code: secData.code },
            });
            if (!section) {
              section = this.examSectionRepo.create({
                examVersionId: version.id,
                code: secData.code,
                name: secData.name,
                orderIndex: secData.orderIndex,
                description: secData.description,
              });
              section = await this.examSectionRepo.save(section);
            }

            for (const subData of secData.subjects) {
              let subject = await this.subjectRepo.findOne({
                where: { examSectionId: section.id, code: subData.code },
              });
              if (!subject) {
                subject = this.subjectRepo.create({
                  examSectionId: section.id,
                  code: subData.code,
                  name: subData.name,
                  category: subData.category,
                  orderIndex: subData.orderIndex,
                  colorCode: subData.colorCode,
                  iconName: subData.iconName,
                });
                subject = await this.subjectRepo.save(subject);
              }

              for (const topData of subData.topics) {
                let topic = await this.topicRepo.findOne({
                  where: { subjectId: subject.id, code: topData.code },
                });
                if (!topic) {
                  topic = this.topicRepo.create({
                    subjectId: subject.id,
                    code: topData.code,
                    name: topData.name,
                    orderIndex: topData.orderIndex,
                    estimatedHours: topData.estimatedHours,
                    importanceWeight: topData.importanceWeight,
                    difficulty: topData.difficulty,
                  });
                  await this.topicRepo.save(topic);
                }
              }
            }
          }
        }
      }
    }

    this.logger.log('YKS exam pack seed completed successfully.');
  }

  async getAllExamPacks(): Promise<Exam[]> {
    return this.examRepo.find({
      relations: {
        educationSystem: {
          country: true,
        },
        versions: true,
      },
      order: {
        code: 'ASC',
      },
    });
  }

  async getExamById(id: string): Promise<Exam> {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: {
        educationSystem: {
          country: true,
        },
        versions: {
          sections: {
            subjects: {
              topics: true,
            },
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID "${id}" not found.`);
    }

    return exam;
  }

  async getVersionHierarchy(versionId: string): Promise<ExamVersion> {
    const version = await this.examVersionRepo.findOne({
      where: { id: versionId },
      relations: {
        exam: {
          educationSystem: {
            country: true,
          },
        },
        sections: {
          subjects: {
            topics: true,
          },
        },
      },
      order: {
        sections: {
          orderIndex: 'ASC',
          subjects: {
            orderIndex: 'ASC',
            topics: {
              orderIndex: 'ASC',
            },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(`Exam version with ID "${versionId}" not found.`);
    }

    return version;
  }

  async getCurrentYksVersion(): Promise<ExamVersion> {
    const exam = await this.examRepo.findOne({
      where: { code: 'YKS' },
    });

    if (!exam) {
      throw new NotFoundException('YKS Exam definition not found.');
    }

    const currentVersion = await this.examVersionRepo.findOne({
      where: { examId: exam.id, isCurrent: true },
      relations: {
        sections: {
          subjects: {
            topics: true,
          },
        },
      },
      order: {
        sections: {
          orderIndex: 'ASC',
          subjects: {
            orderIndex: 'ASC',
            topics: {
              orderIndex: 'ASC',
            },
          },
        },
      },
    });

    if (!currentVersion) {
      throw new NotFoundException('Current YKS Exam version not found.');
    }

    return currentVersion;
  }
}
