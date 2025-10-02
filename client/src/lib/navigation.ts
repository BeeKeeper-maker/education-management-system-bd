import { UserRole } from '@/types';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CheckSquare,
  Bell,
  Settings,
  Building2,
  DollarSign,
  Hotel,
  BookMarked,
  UserCog,
  ClipboardList,
  Receipt,
  TrendingUp,
  Wallet,
     Megaphone,
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles: UserRole[];
  badge?: string;
}

export const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['superadmin', 'admin', 'teacher', 'student', 'guardian', 'accountant', 'hostel_manager'],
  },
  {
    name: 'User Management',
    href: '/users',
    icon: UserCog,
    roles: ['superadmin', 'admin'],
  },
  {
    name: 'Students',
    href: '/students',
    icon: Users,
    roles: ['superadmin', 'admin', 'teacher'],
  },
  {
    name: 'Student Admission',
    href: '/students/admission',
    icon: UserCog,
    roles: ['superadmin', 'admin'],
  },
  {
    name: 'Teachers',
    href: '/teachers',
    icon: GraduationCap,
    roles: ['superadmin', 'admin'],
  },
  {
    name: 'Classes',
    href: '/classes',
    icon: BookOpen,
    roles: ['superadmin', 'admin', 'teacher'],
  },
  {
    name: 'Take Attendance',
    href: '/attendance/take',
    icon: CheckSquare,
    roles: ['superadmin', 'admin', 'teacher'],
  },
  {
    name: 'Attendance Reports',
    href: '/attendance/reports',
    icon: ClipboardList,
    roles: ['superadmin', 'admin'],
  },
  {
    name: 'Timetable Builder',
    href: '/timetable/builder',
    icon: Calendar,
    roles: ['superadmin', 'admin'],
  },
  {
    name: 'My Timetable',
    href: '/timetable/my',
    icon: Calendar,
    roles: ['teacher', 'student'],
  },
  {
    name: 'Assignments',
    href: '/assignments',
    icon: ClipboardList,
    roles: ['superadmin', 'admin', 'teacher', 'student'],
  },
  {
    name: 'Exams & Results',
    href: '/exams',
    icon: BookMarked,
     },
     {
       name: 'Notice Board',
       href: '/notice-board',
       icon: Megaphone,
       roles: ['superadmin', 'admin'],
     },
     {
       name: 'Financial Dashboard',
       href: '/notice-board',
       icon: Bell,
       roles: ['superadmin', 'admin'],
     },
     {
       name: 'Financial Dashboard',
    name: 'Financial Dashboard',
     },
     {
       name: 'Fee Collection',
       href: '/fees/collection',
       icon: Receipt,
       roles: ['superadmin', 'admin', 'accountant'],
     },
     {
       name: 'My Fees',
       href: '/fees/my-fees',
       icon: Wallet,
     Megaphone,
       roles: ['student', 'guardian'],
     },
     {
       name: 'Expense Management',
       href: '/expenses',
       icon: DollarSign,
       roles: ['superadmin', 'admin', 'accountant'],
    href: '/financial/dashboard',
    icon: TrendingUp,
    roles: ['superadmin', 'admin', 'accountant'],
  },
  {
    name: 'Hostel Management',
    href: '/hostel/management',
    icon: Hotel,
    roles: ['superadmin', 'admin', 'hostel_manager'],
  },
     },
     {
       name: 'Room Allocation',
       href: '/hostel/allocation',
       icon: Hotel,
       roles: ['superadmin', 'admin', 'hostel_manager'],
     },
     {
       name: 'Book Management',
       href: '/library/books',
       icon: BookMarked,
       roles: ['superadmin', 'admin'],
     },
     {
       name: 'Issue/Return Books',
       href: '/library/issue-return',
       icon: BookMarked,
       roles: ['superadmin', 'admin'],
  {
    name: 'Institution Settings',
    href: '/institution',
    icon: Building2,
    roles: ['superadmin', 'admin'],
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['superadmin', 'admin', 'teacher', 'student', 'guardian', 'accountant', 'hostel_manager'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['superadmin', 'admin', 'teacher', 'student', 'guardian', 'accountant', 'hostel_manager'],
  },
];

export function getNavigationForRole(role: UserRole): NavigationItem[] {
  return navigationItems.filter((item) => item.roles.includes(role));
}