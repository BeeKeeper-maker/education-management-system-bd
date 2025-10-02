// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImageUrl?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 
  | 'superadmin' 
  | 'admin' 
  | 'teacher' 
  | 'student' 
  | 'guardian' 
  | 'accountant' 
  | 'hostel_manager';

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Academic types
export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  name: string;
  numericGrade?: number;
  academicSessionId: string;
  shiftId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  name: string;
  classId: string;
  capacity?: number;
  roomNumber?: string;
  classTeacherId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  type?: 'theory' | 'practical' | 'both';
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
}

// Student types
export interface Student {
  id: string;
  userId: string;
  studentId: string;
  admissionNumber?: string;
  admissionDate: string;
  rollNumber?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelation?: string;
  emergencyContact?: string;
  previousSchool?: string;
  medicalInfo?: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  createdAt: string;
  updatedAt: string;
  user?: User;
  currentEnrollment?: Enrollment;
  enrollments?: Enrollment[];
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  sectionId: string;
  academicSessionId: string;
  enrollmentDate: string;
  status: 'active' | 'completed' | 'transferred';
  createdAt: string;
  updatedAt: string;
  class?: Class;
  section?: Section;
  academicSession?: AcademicSession;
}

export interface StudentFormData {
  // User information
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  
  // Student specific information
  admissionNumber?: string;
  admissionDate?: string;
  rollNumber?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianRelation?: string;
  emergencyContact?: string;
  previousSchool?: string;
  medicalInfo?: string;
  
  // Enrollment information
  classId: string;
  sectionId: string;
  academicSessionId?: string;
}

// Attendance types
export interface Attendance {
  id: string;
  userId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave';
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
  markedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category?: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRole?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  publishDate: string;
  expiryDate?: string;
  attachmentUrl?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Dashboard types
export interface DashboardStats {
  totalStudents?: number;
  totalTeachers?: number;
  totalStaff?: number;
  totalClasses?: number;
  presentToday?: number;
  absentToday?: number;
  attendancePercentage?: number;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}