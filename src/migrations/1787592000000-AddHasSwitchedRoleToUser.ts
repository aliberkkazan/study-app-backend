import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHasSwitchedRoleToUser1787592000000 implements MigrationInterface {
  name = 'AddHasSwitchedRoleToUser1787592000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "has_switched_role" boolean NOT NULL DEFAULT false;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "has_switched_role";`,
    );
  }
}
