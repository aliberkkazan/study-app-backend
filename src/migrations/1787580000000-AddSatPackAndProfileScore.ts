import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSatPackAndProfileScore1787580000000 implements MigrationInterface {
  name = 'AddSatPackAndProfileScore1787580000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."study_profile_track_enum" ADD VALUE IF NOT EXISTS 'SAT_ALL'`);
    await queryRunner.query(`ALTER TYPE "public"."study_profile_track_enum" ADD VALUE IF NOT EXISTS 'SAT_MATH_FOCUS'`);
    await queryRunner.query(`ALTER TYPE "public"."study_profile_track_enum" ADD VALUE IF NOT EXISTS 'SAT_RW_FOCUS'`);
    await queryRunner.query(`ALTER TYPE "public"."study_profile_track_enum" ADD VALUE IF NOT EXISTS 'GENERAL'`);
    await queryRunner.query(`ALTER TABLE "study_profile" ADD COLUMN IF NOT EXISTS "current_score" double precision`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "study_profile" DROP COLUMN IF EXISTS "current_score"`);
  }
}
