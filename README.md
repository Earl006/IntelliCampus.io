# IntelliCampus.io

![IntelliCampus.io Logo](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyCJyGh6DY7lv6M6UO9o55GoS2foCoyqEqbg&s)

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview

IntelliCampus.io is a comprehensive Learning Management System (LMS) designed to facilitate online education. It supports three main user roles: Admin, Instructor, and Learner, each with specific functionalities to enhance the learning experience.

## Features

### Admin Features
- Manage all users (Instructors and Learners)
- Review and approve/reject instructor applications
- Review course content for compliance
- Authorize instructor payouts
- Generate system-wide reports

### Instructor Features
- Create and manage courses (free or paid)
- Upload course materials (videos and notes)
- Manage student cohorts
- Send cohort-specific communications
- Control material download permissions
- View dashboard with learner metrics, course stats, and earnings
- Create and manage real-time chat rooms for cohorts
- Administer exams/tests and grade submissions
- Issue certificates upon course completion
- Respond to comments and questions on course materials

### Learner Features
- Browse and enroll in courses
- Filter courses by category or instructor
- Access course materials (based on enrollment and permissions)
- Participate in cohort chat rooms
- Track course progress and view scores
- Request course material download access
- Generate personal progress reports
- Leave course reviews
- Comment on course materials

### General Features
- Real-time chat using Socket.io
- Secure authentication with social login options
- Payment processing for paid courses
- Email notifications for various events
- Media asset management for course materials

## Tech Stack

- **Backend**: Node.js with TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Frontend**: Angular
- **Real-time Communication**: Socket.io
- **Caching**: Redis
- **Media Storage**: Cloudinary
- **Payment Processing**: Stripe
- **Authentication**: SuperTokens
- **Email Service**: Nodemailer with EJS templates

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- PostgreSQL
- Redis

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/Earl006/IntelliCampus.io
   ```

2. Set up the backend:
   ```
   cd backend
   npm install
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration details.

3. Run database migrations:
   ```
   npx prisma migrate dev
   ```

4. Start the backend development server:
   ```
   npm run dev
   ```

5. In a new terminal, set up the frontend:
   ```
   cd -
   cd frontend
   npm install
   ```

6. Start the frontend development server:
   ```
   ng serve
   ```

The backend will be running at `http://localhost:3000` (or your configured port), and the frontend will be available at `http://localhost:4200`.

## Project Structure

```
IntelliCampus.io/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   └── environments/
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## API Documentation

API documentation is available at `/api-docs` when running the backend server locally. For production, please refer to our hosted documentation (link to be added).

## Contributing

We welcome contributions to the IntelliCampus.io project! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.