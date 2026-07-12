<div align="center">

# Study App Backend

### REST API for the Study App mentor–student platform

A modular NestJS backend providing authentication, mentor–student connections, study program management, submission reviews, file uploads, and API documentation.

[![Mobile App](https://img.shields.io/badge/Mobile_Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/aliberkkazan/study-app)
[![App Store](https://img.shields.io/badge/App_Store-Download-000000?style=for-the-badge&logo=apple&logoColor=white)](https://apps.apple.com/us/app/study-app-mentor-student/id6758196655)

</div>

---

## About the Project

**Study App Backend** is the REST API powering the Study App mobile application.

The platform creates a structured workflow between students and mentors. Students can connect with mentors, receive assigned study programs, upload test or homework results, and view feedback. Mentors can manage connected students, assign study tasks, review submissions, and track progress.

The backend uses a modular NestJS architecture with PostgreSQL persistence, JWT authentication, Supabase file storage, request validation, database migrations, and Swagger API documentation.

---

## Features

- User registration and login
- JWT-based authentication
- Student, mentor, and admin user roles
- Secure password hashing with bcrypt
- Unique mentor connection codes
- Student–mentor connection requests
- Connection approval and rejection flows
- Connected student management
- Study program creation and management
- Student submission management
- Test and homework image uploads
- Mentor feedback and submission updates
- PostgreSQL persistence with TypeORM
- Supabase Storage integration
- Database migrations
- Global request validation
- Swagger API documentation
- Docker-based PostgreSQL development environment

---

## Tech Stack

<p>
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeORM-FE0803?style=flat-square&logo=typeorm&logoColor=white" alt="TypeORM" />
  <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black" alt="Swagger" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
</p>

- **NestJS** for modular server-side application development
- **TypeScript** for type-safe backend development
- **PostgreSQL** as the relational database
- **TypeORM** for entities, repositories, relations, and migrations
- **Passport JWT** for protected API routes
- **bcrypt** for password hashing
- **Supabase Storage** for submission image uploads
- **Swagger** for interactive API documentation
- **Docker Compose** for local PostgreSQL setup
- **class-validator** and **class-transformer** for request validation

---

## Project Structure

```text
src/
├── auth/          # Registration, login and JWT authentication
│   ├── dto/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt-auth.guard.ts
│   └── jwt.strategy.ts
├── common/        # Shared DTOs and base entities
├── db/            # TypeORM data source configuration
├── files/         # Supabase Storage integration
├── migrations/    # Database migrations
├── programs/      # Study program management
│   ├── dto/
│   └── entities/
├── submissions/   # Student submissions and mentor reviews
│   ├── dto/
│   └── entities/
├── users/         # Users and mentor–student connections
│   ├── dto/
│   └── entities/
├── app.module.ts
└── main.ts
```

---

## API Modules

### Authentication

The authentication module handles account registration, login, password validation, and JWT generation.

```text
POST /auth/register
POST /auth/login
```

Registration and login routes are publicly available. Other API routes are protected by the global JWT authentication guard.

### Users

The users module manages profiles, roles, mentor codes, connection requests, and student–mentor relationships.

```text
POST   /users
GET    /users
GET    /users/profile
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id

POST   /users/request
GET    /users/requests
PATCH  /users/request/:id

POST   /users/mentor-code/refresh
DELETE /users/students/:studentId
```

Users can be filtered using role and mentor parameters:

```text
GET /users?role=student
GET /users?mentorId=<mentor-id>
```

### Programs

The programs module provides CRUD operations for mentor-assigned study programs.

```text
POST   /programs
GET    /programs
GET    /programs/:id
PATCH  /programs/:id
DELETE /programs/:id
```

A study program can contain:

- Title
- Description
- Scheduled date
- Due date
- Completion status
- Student
- Mentor

### Submissions

The submissions module manages test and homework submissions uploaded by students.

```text
POST   /submissions
GET    /submissions
GET    /submissions/:id
PATCH  /submissions/:id
DELETE /submissions/:id
```

Submission images can be provided as an existing image URL or as base64 image data. Base64 images are uploaded to Supabase Storage before the submission is saved.

### Files

The files module provides multipart file uploads through Supabase Storage.

```text
POST /files/upload
```

The request must use `multipart/form-data` with a field named:

```text
file
```

---

## Authentication

Protected endpoints require a JWT access token.

Include the access token in the request header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

A successful login returns an access token and basic user information:

```json
{
  "access_token": "jwt-token",
  "user": {
    "email": "user@example.com",
    "sub": "user-id",
    "role": "student",
    "name": "John Doe",
    "mentorCode": null
  }
}
```

Supported roles:

```text
student
mentor
admin
```

---

## Getting Started

### Requirements

Before running the project, make sure the following tools are installed:

- Node.js
- npm
- Docker and Docker Compose
- A Supabase project
- Supabase Storage buckets for file uploads

### Installation

Clone the repository:

```bash
git clone https://github.com/aliberkkazan/study-app-backend.git
cd study-app-backend
```

Install dependencies:

```bash
npm install
```

---

## Environment Configuration

Create a local environment file from the example:

```bash
cp .env.example .env
```

Configure the environment variables:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=study-app

JWT_SECRET=replace_with_a_secure_random_secret

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Never commit the `.env` file or real credentials to source control.

---

## Database Setup

Start the PostgreSQL container:

```bash
docker compose up -d
```

The included Docker Compose configuration creates a local PostgreSQL database using:

```text
Host: localhost
Port: 5432
Database: study-app
Username: postgres
Password: postgres
```

Run pending migrations:

```bash
npm run migration:run
```

Revert the latest migration:

```bash
npm run migration:revert
```

Generate a new migration:

```bash
npm run migration:generate -- src/migrations/MigrationName
```

---

## Running the API

Run in development mode:

```bash
npm run start:dev
```

Run normally:

```bash
npm run start
```

Create a production build:

```bash
npm run build
```

Run the production build:

```bash
npm run start:prod
```

The API runs by default at:

```text
http://localhost:3000
```

---

## Swagger Documentation

Interactive Swagger documentation is available at:

```text
http://localhost:3000/api
```

To test protected endpoints:

1. Register or log in.
2. Copy the returned access token.
3. Open Swagger.
4. Select **Authorize**.
5. Enter the JWT access token.

---

## Available Scripts

```bash
npm run start
npm run start:dev
npm run start:debug
npm run start:prod

npm run build
npm run lint
npm run format

npm run test
npm run test:watch
npm run test:e2e
npm run test:cov

npm run migration:generate
npm run migration:run
npm run migration:revert
```

---

## Testing

Run unit tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run end-to-end tests:

```bash
npm run test:e2e
```

Generate test coverage:

```bash
npm run test:cov
```

---

## Related Projects

### Study App Mobile

The React Native mobile application is maintained in a separate repository:

[github.com/aliberkkazan/study-app](https://github.com/aliberkkazan/study-app)

### App Store

The production mobile application is available on the Apple App Store:

[Study App - Mentor & Student](https://apps.apple.com/us/app/study-app-mentor-student/id6758196655)

---

## Author

Developed by **Ali Berk Kazan**

- [GitHub Profile](https://github.com/aliberkkazan)
- [Mobile Repository](https://github.com/aliberkkazan/study-app)

---

<div align="center">

Built with NestJS, TypeScript, PostgreSQL, and Supabase.

</div>
