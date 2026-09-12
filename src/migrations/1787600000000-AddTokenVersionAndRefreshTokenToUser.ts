import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenVersionAndRefreshTokenToUser1787600000000 implements MigrationInterface {
  name = 'AddTokenVersionAndRefreshTokenToUser1787600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "token_version" integer NOT NULL DEFAULT 0;`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "hashed_refresh_token" text;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "hashed_refresh_token";`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "token_version";`,
    );
  }
}
