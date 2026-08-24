import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameProgramToTask1767799999999 implements MigrationInterface {
    name = 'RenameProgramToTask1767799999999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename table
        await queryRunner.query(`ALTER TABLE "program" RENAME TO "task"`);

        // Rename columns
        await queryRunner.query(`ALTER TABLE "task" RENAME COLUMN "student_id" TO "owner_id"`);
        await queryRunner.query(`ALTER TABLE "task" RENAME COLUMN "mentor_id" TO "assigned_by"`);

        // Add new columns
        await queryRunner.query(`ALTER TABLE "task" ADD "subject" character varying`);
        await queryRunner.query(`ALTER TABLE "task" ADD "topic" character varying`);
        await queryRunner.query(`ALTER TABLE "task" ADD "source" character varying`);
        await queryRunner.query(`ALTER TABLE "task" ADD "target_outcome" character varying`);
        await queryRunner.query(`ALTER TABLE "task" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop new columns
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "target_outcome"`);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "source"`);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "topic"`);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "subject"`);

        // Revert column names
        await queryRunner.query(`ALTER TABLE "task" RENAME COLUMN "assigned_by" TO "mentor_id"`);
        await queryRunner.query(`ALTER TABLE "task" RENAME COLUMN "owner_id" TO "student_id"`);

        // Revert table name
        await queryRunner.query(`ALTER TABLE "task" RENAME TO "program"`);
    }
}
