import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSupa1767790704584 implements MigrationInterface {
    name = 'InitSupa1767790704584'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."connection_request_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "connection_request" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."connection_request_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "student_id" uuid, "mentor_id" uuid, CONSTRAINT "PK_f21b63db16068277910c08bb1ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('student', 'mentor', 'admin')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "mentor_code" character varying, "last_mentor_code_update" TIMESTAMP, "role" "public"."user_role_enum" NOT NULL DEFAULT 'student', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_6b53d407aa11249d43525fa2340" UNIQUE ("mentor_code"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."submission_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "submission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "image_url" character varying NOT NULL, "status" "public"."submission_status_enum" NOT NULL DEFAULT 'pending', "feedback" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "student_id" uuid, CONSTRAINT "PK_7faa571d0e4a7076e85890c9bd0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "program" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "due_date" TIMESTAMP, "scheduled_date" TIMESTAMP, "completed" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "student_id" uuid, "mentor_id" uuid, CONSTRAINT "PK_3bade5945afbafefdd26a3a29fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_students" ("mentor_id" uuid NOT NULL, "student_id" uuid NOT NULL, CONSTRAINT "PK_ab88d702396e162943414be4208" PRIMARY KEY ("mentor_id", "student_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dc8ff9b8edf2c0d5b9521fcc9c" ON "user_students" ("mentor_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2829d8d9b006d8b32e94b7b1cf" ON "user_students" ("student_id") `);
        await queryRunner.query(`ALTER TABLE "connection_request" ADD CONSTRAINT "FK_11161a99b4ad39882ba2d430ef7" FOREIGN KEY ("student_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "connection_request" ADD CONSTRAINT "FK_a376efed02760e9c7d4463d2efa" FOREIGN KEY ("mentor_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submission" ADD CONSTRAINT "FK_af8e0428fc24c6662c6c2b28179" FOREIGN KEY ("student_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "program" ADD CONSTRAINT "FK_6df3ee04b76d1df250a498cfa4d" FOREIGN KEY ("student_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "program" ADD CONSTRAINT "FK_e874afb5dd039f53c743fccfe32" FOREIGN KEY ("mentor_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_students" ADD CONSTRAINT "FK_dc8ff9b8edf2c0d5b9521fcc9c9" FOREIGN KEY ("mentor_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_students" ADD CONSTRAINT "FK_2829d8d9b006d8b32e94b7b1cf6" FOREIGN KEY ("student_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_students" DROP CONSTRAINT "FK_2829d8d9b006d8b32e94b7b1cf6"`);
        await queryRunner.query(`ALTER TABLE "user_students" DROP CONSTRAINT "FK_dc8ff9b8edf2c0d5b9521fcc9c9"`);
        await queryRunner.query(`ALTER TABLE "program" DROP CONSTRAINT "FK_e874afb5dd039f53c743fccfe32"`);
        await queryRunner.query(`ALTER TABLE "program" DROP CONSTRAINT "FK_6df3ee04b76d1df250a498cfa4d"`);
        await queryRunner.query(`ALTER TABLE "submission" DROP CONSTRAINT "FK_af8e0428fc24c6662c6c2b28179"`);
        await queryRunner.query(`ALTER TABLE "connection_request" DROP CONSTRAINT "FK_a376efed02760e9c7d4463d2efa"`);
        await queryRunner.query(`ALTER TABLE "connection_request" DROP CONSTRAINT "FK_11161a99b4ad39882ba2d430ef7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2829d8d9b006d8b32e94b7b1cf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dc8ff9b8edf2c0d5b9521fcc9c"`);
        await queryRunner.query(`DROP TABLE "user_students"`);
        await queryRunner.query(`DROP TABLE "program"`);
        await queryRunner.query(`DROP TABLE "submission"`);
        await queryRunner.query(`DROP TYPE "public"."submission_status_enum"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "connection_request"`);
        await queryRunner.query(`DROP TYPE "public"."connection_request_status_enum"`);
    }

}
