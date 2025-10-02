# EduPro - Education Management System

A comprehensive, production-ready education management system designed for educational institutions.

## 🚀 Features

### Phase 1 (Current)
- ✅ Authentication & Authorization (JWT + RBAC)
- ✅ User Management (All roles)
- ✅ Organization Structure
- ✅ Academic Structure (Classes, Sections, Subjects)
- ✅ Student Management
- ✅ Attendance System
- ✅ Timetable/Routine Management
- ✅ Multi-Dashboard System (SuperAdmin, Admin, Teacher, Student, Guardian)
- ✅ Notification System
- ✅ Multi-language Support (English, Bengali, Arabic)

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (Build tool)
- Tailwind CSS + Shadcn UI
- Wouter (Routing)
- TanStack Query (Server state)
- Zustand (Global state)
- React Hook Form + Zod (Forms & Validation)

### Backend
- Node.js + Express + TypeScript
- PostgreSQL (Database)
- Drizzle ORM
- JWT Authentication
- Express Session

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd edupro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Create PostgreSQL database
createdb edupro

# Run migrations
npm run db:generate
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

5. Start development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 🐳 Docker Deployment

### Using Docker Compose (Recommended for VPS)

1. Create `.env` file with production values

2. Build and start containers:
```bash
docker-compose up -d
```

3. Run migrations:
```bash
docker-compose exec app npm run db:migrate
```

4. Access the application:
- Application: http://your-domain.com
- Database: localhost:5432

## 📚 Documentation

- [API Documentation](./docs/api/README.md)
- [User Guides](./docs/user-guides/README.md)
- [Deployment Guide](./docs/deployment/README.md)

## 🔐 Default Credentials

After seeding the database:

**SuperAdmin:**
- Email: superadmin@edupro.com
- Password: SuperAdmin@123

**Admin:**
- Email: admin@edupro.com
- Password: Admin@123

**Teacher:**
- Email: teacher@edupro.com
- Password: Teacher@123

**Student:**
- Email: student@edupro.com
- Password: Student@123

⚠️ **Change these credentials immediately in production!**

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e
```

## 📝 Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## 🌍 Multi-language Support

Supported languages:
- English (en)
- Bengali (বাংলা) (bn)
- Arabic (عربي) (ar) with RTL support

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Support

For support, email support@edupro.com or join our Slack channel.

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for the complete development plan.

---

Built with ❤️ by the EduPro Team