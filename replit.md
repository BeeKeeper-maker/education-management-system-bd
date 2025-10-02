# EduPro - Education Management System

## Overview

EduPro is a comprehensive education management system built for educational institutions. It provides end-to-end functionality for managing students, staff, academics, attendance, examinations, finances, hostel operations, library services, and communications. The platform serves multiple user roles including superadmin, admin, teachers, students, guardians, accountants, and hostel managers.

The system features a modern React-based frontend with TypeScript and a Node.js/Express backend using PostgreSQL for data persistence. It implements JWT-based authentication with role-based access control (RBAC) to ensure proper authorization across different modules.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tools:**
- React 18 with TypeScript for type safety
- Vite as the build tool for fast development and optimized production builds
- Wouter for lightweight client-side routing

**UI & Styling:**
- Tailwind CSS for utility-first styling
- Shadcn UI component library (Radix UI primitives) for accessible, composable components
- Custom theme system with CSS variables for consistent design

**State Management:**
- TanStack Query (React Query) for server state management, caching, and synchronization
- Zustand for global client state (lightweight alternative to Redux)
- React Context API for authentication state

**Form Handling:**
- React Hook Form for performant form management
- Zod for schema validation and type inference

**Key Design Patterns:**
- Protected routes with role-based access control
- Layout component pattern (MainLayout with Sidebar and TopBar)
- Custom hooks for API calls and business logic
- Component composition with shadcn UI primitives

### Backend Architecture

**Server Framework:**
- Node.js with Express for HTTP server
- TypeScript for type safety across the codebase
- Express Session with connect-pg-simple for session management

**Database Layer:**
- PostgreSQL 14+ as the primary database
- Drizzle ORM for type-safe database queries and migrations
- Schema-first design with separate schema files per domain (users, academic, attendance, etc.)

**Authentication & Authorization:**
- JWT (jsonwebtoken) for stateless authentication
- Bcrypt for password hashing
- Role-based access control (RBAC) with middleware guards
- Session-based authentication as fallback

**API Design:**
- RESTful API endpoints organized by domain
- Consistent response format: `{ success: boolean, data?: any, error?: string }`
- Role-based route protection using middleware
- Centralized error handling

**Key Modules:**
1. **Academic Management:** Classes, sections, subjects, syllabi
2. **Attendance System:** Daily attendance, class attendance, leave applications
3. **Timetable/Schedule:** Period definitions, timetable entries, exam schedules
4. **Examination System:** Exam types, exams, marks entry, results, grading
5. **Financial Management:** Fee structures, payments, expenses, discounts
6. **Hostel Management:** Hostels, rooms, allocations
7. **Library Management:** Books, members, transactions, fines
8. **Communication Module:** Announcements, notifications, SMS integration

**File Upload:**
- Multer middleware for handling multipart/form-data
- Uploads stored in `/uploads` directory
- Profile images, documents, and attachments supported

### Database Design

**Schema Organization:**
- Modular schema files organized by domain (45+ tables total)
- UUID primary keys for all tables
- Proper foreign key relationships with cascading rules
- Timestamp fields (createdAt, updatedAt) on all entities

**Core Tables:**
- `users` - All system users with role field
- `students` - Student-specific data with user reference
- `classes`, `sections`, `subjects` - Academic structure
- `attendance`, `class_attendance` - Attendance tracking
- `exams`, `marks`, `results` - Examination system
- `fee_structures`, `fee_payments` - Financial management
- `hostels`, `rooms`, `room_allocations` - Hostel operations
- `books`, `library_transactions` - Library system
- `announcements`, `notifications`, `sms_logs` - Communication

**Migration Strategy:**
- Drizzle Kit for generating SQL migrations from schema changes
- Migration files stored in `server/src/db/migrations`
- Seed data scripts for initial setup and testing

### External Dependencies

**Core Dependencies:**
- **express** - Web framework
- **pg** - PostgreSQL client
- **drizzle-orm** - Type-safe ORM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **express-session** - Session management
- **connect-pg-simple** - PostgreSQL session store
- **cors** - Cross-origin resource sharing
- **multer** - File upload handling

**Frontend Libraries:**
- **react** & **react-dom** - UI library
- **@tanstack/react-query** - Server state management
- **@tanstack/react-table** - Table components
- **react-hook-form** - Form handling
- **zod** - Schema validation
- **axios** - HTTP client
- **date-fns** - Date utilities
- **recharts** - Charting library
- **lucide-react** - Icon library

**UI Components (Radix UI):**
- Avatar, Checkbox, Dialog, Dropdown Menu, Label, Popover, Select, Separator, Slot, Switch, Tabs, Toast

**Development Tools:**
- **vite** - Build tool and dev server
- **typescript** - Type checking
- **tailwindcss** - CSS framework
- **concurrently** - Run multiple npm scripts
- **tsx** - TypeScript execution for Node.js
- **drizzle-kit** - Database migration tool

**External Services (Mock/Ready for Integration):**
- SMS service (currently mock implementation, ready for Twilio/Nexmo)
- Email service (infrastructure ready)
- Cloud storage (local file system, ready for S3/CloudFlare)

**Database:**
- PostgreSQL 15 running on localhost:5432
- Database name: `edupro`
- User: `edupro` with password authentication

**Development Environment:**
- Backend server: http://localhost:3000
- Frontend dev server: http://localhost:5173
- API proxy configured in Vite to route `/api` requests to backend
- Hot module replacement (HMR) for both frontend and backend