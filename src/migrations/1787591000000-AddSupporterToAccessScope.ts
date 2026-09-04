import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupporterToAccessScope1787591000000 implements MigrationInterface {
  name = 'AddSupporterToAccessScope1787591000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."access_grant_scope_enum" ADD VALUE IF NOT EXISTS 'SUPPORTER';`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Postgres does not easily support removing enum values without recreating the type
  }
}
