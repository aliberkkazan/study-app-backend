import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountabilityAndAccessGrants1787590000000 implements MigrationInterface {
  name = 'AddAccountabilityAndAccessGrants1787590000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."access_grant_scope_enum" AS ENUM('PARTNER', 'PARENT', 'MENTOR', 'INSTITUTION'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."access_grant_status_enum" AS ENUM('INVITED', 'ACTIVE', 'REVOKED', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."share_token_timeframe_enum" AS ENUM('LAST_7_DAYS', 'LAST_30_DAYS', 'ALL_TIME'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."group_member_role_enum" AS ENUM('ADMIN', 'MEMBER'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."session_verification_status_enum" AS ENUM('UNVERIFIED', 'VERIFIED', 'FLAGGED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    );

    // 2. Access Grant table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "access_grant" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "granter_id" uuid NOT NULL,
        "grantee_id" uuid,
        "scope" "public"."access_grant_scope_enum" NOT NULL DEFAULT 'MENTOR',
        "status" "public"."access_grant_status_enum" NOT NULL DEFAULT 'INVITED',
        "invite_code" character varying NOT NULL,
        "invite_email" character varying,
        "permissions" jsonb NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_access_grant_invite_code" UNIQUE ("invite_code"),
        CONSTRAINT "PK_access_grant" PRIMARY KEY ("id"),
        CONSTRAINT "FK_access_grant_granter" FOREIGN KEY ("granter_id") REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_access_grant_grantee" FOREIGN KEY ("grantee_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);

    // 3. Share Token table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "share_token" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "token" character varying NOT NULL,
        "timeframe" "public"."share_token_timeframe_enum" NOT NULL DEFAULT 'LAST_7_DAYS',
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "is_revoked" boolean NOT NULL DEFAULT false,
        CONSTRAINT "UQ_share_token_token" UNIQUE ("token"),
        CONSTRAINT "PK_share_token" PRIMARY KEY ("id"),
        CONSTRAINT "FK_share_token_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);

    // 4. Accountability Group table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "accountability_group" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "description" text,
        "code" character varying NOT NULL,
        "creator_id" uuid NOT NULL,
        "is_private" boolean NOT NULL DEFAULT false,
        CONSTRAINT "UQ_accountability_group_code" UNIQUE ("code"),
        CONSTRAINT "PK_accountability_group" PRIMARY KEY ("id"),
        CONSTRAINT "FK_accountability_group_creator" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);

    // 5. Group Member table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "group_member" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "group_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" "public"."group_member_role_enum" NOT NULL DEFAULT 'MEMBER',
        "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_group_member_group_user" UNIQUE ("group_id", "user_id"),
        CONSTRAINT "PK_group_member" PRIMARY KEY ("id"),
        CONSTRAINT "FK_group_member_group" FOREIGN KEY ("group_id") REFERENCES "accountability_group"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_group_member_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);

    // 6. Extend study_session table
    await queryRunner.query(`
      ALTER TABLE "study_session"
      ADD COLUMN IF NOT EXISTS "verification_status" "public"."session_verification_status_enum" NOT NULL DEFAULT 'UNVERIFIED',
      ADD COLUMN IF NOT EXISTS "verified_by" uuid,
      ADD COLUMN IF NOT EXISTS "mentor_feedback" text
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "study_session" ADD CONSTRAINT "FK_study_session_verified_by" FOREIGN KEY ("verified_by") REFERENCES "user"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "study_session" DROP CONSTRAINT IF EXISTS "FK_study_session_verified_by"`,
    );
    await queryRunner.query(`ALTER TABLE "study_session" DROP COLUMN IF EXISTS "mentor_feedback"`);
    await queryRunner.query(`ALTER TABLE "study_session" DROP COLUMN IF EXISTS "verified_by"`);
    await queryRunner.query(
      `ALTER TABLE "study_session" DROP COLUMN IF EXISTS "verification_status"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "group_member"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accountability_group"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "share_token"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "access_grant"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."session_verification_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."group_member_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."share_token_timeframe_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."access_grant_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."access_grant_scope_enum"`);
  }
}
