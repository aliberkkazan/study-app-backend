import { MigrationInterface, QueryRunner } from "typeorm";

export class BaseEntity1767793198978 implements MigrationInterface {
    name = 'BaseEntity1767793198978'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "connection_request" ADD "active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "connection_request" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user" ADD "active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "submission" ADD "active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "program" ADD "active" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "program" DROP COLUMN "active"`);
        await queryRunner.query(`ALTER TABLE "submission" DROP COLUMN "active"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "active"`);
        await queryRunner.query(`ALTER TABLE "connection_request" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "connection_request" DROP COLUMN "active"`);
    }

}
