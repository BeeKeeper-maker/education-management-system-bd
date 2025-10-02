import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { t } from '@/i18n';
   import AnnouncementsWidget from '@/components/AnnouncementsWidget';
import { Users, GraduationCap, BookOpen, CheckCircle, XCircle, TrendingUp, DollarSign, Calendar, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Role-specific stats
  const getStatsForRole = () => {
    const role = user?.role;

    if (role === 'superadmin' || role === 'admin') {
      return [
        {
          title: 'Total Students',
          value: '1,234',
          change: '+12%',
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        },
        {
          title: 'Total Teachers',
          value: '89',
          change: '+3%',
          icon: GraduationCap,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        },
        {
          title: 'Total Classes',
          value: '45',
          change: '0%',
          icon: BookOpen,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        },
        {
          title: 'Present Today',
          value: '1,156',
          change: '+2%',
          icon: CheckCircle,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
        },
        {
          title: 'Absent Today',
          value: '78',
          change: '-5%',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
        },
        {
          title: 'Attendance Rate',
          value: '93.7%',
          change: '+1.2%',
          icon: TrendingUp,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100',
        },
      ];
    }

    if (role === 'teacher') {
      return [
        {
          title: 'My Classes',
          value: '5',
          change: '',
          icon: BookOpen,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        },
        {
          title: 'Total Students',
          value: '156',
          change: '',
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        },
        {
          title: 'Present Today',
          value: '148',
          change: '',
          icon: CheckCircle,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
        },
        {
          title: 'Pending Assignments',
          value: '12',
          change: '',
          icon: Calendar,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
        },
      ];
    }

    if (role === 'student') {
      return [
        {
          title: 'My Attendance',
          value: '95%',
          change: '',
          icon: CheckCircle,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
        },
        {
          title: 'Pending Assignments',
          value: '3',
          change: '',
          icon: Calendar,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
        },
        {
          title: 'Upcoming Exams',
          value: '2',
          change: '',
          icon: BookOpen,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        },
        {
          title: 'Fee Status',
          value: 'Paid',
          change: '',
          icon: DollarSign,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        },
      ];
    }

    return [];
  };

  const stats = getStatsForRole();

  // Role-specific quick actions
  const getQuickActionsForRole = () => {
    const role = user?.role;

    if (role === 'superadmin' || role === 'admin') {
      return [
        { label: 'Add User', icon: Users, href: '/users', color: 'text-blue-600' },
        { label: 'Add Student', icon: Users, href: '/students', color: 'text-green-600' },
        { label: 'Mark Attendance', icon: CheckCircle, href: '/attendance', color: 'text-emerald-600' },
        { label: 'View Reports', icon: TrendingUp, href: '/reports', color: 'text-purple-600' },
      ];
    }

    if (role === 'teacher') {
      return [
        { label: 'Mark Attendance', icon: CheckCircle, href: '/attendance', color: 'text-emerald-600' },
        { label: 'My Classes', icon: BookOpen, href: '/classes', color: 'text-purple-600' },
        { label: 'Assignments', icon: Calendar, href: '/assignments', color: 'text-orange-600' },
        { label: 'View Timetable', icon: Calendar, href: '/timetable', color: 'text-indigo-600' },
      ];
    }

    if (role === 'student') {
      return [
        { label: 'My Timetable', icon: Calendar, href: '/timetable', color: 'text-indigo-600' },
        { label: 'Assignments', icon: Calendar, href: '/assignments', color: 'text-orange-600' },
        { label: 'My Results', icon: TrendingUp, href: '/results', color: 'text-purple-600' },
        { label: 'Fee Payment', icon: DollarSign, href: '/fees', color: 'text-green-600' },
      ];
    }

    return [];
  };

  const quickActions = getQuickActionsForRole();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.firstName}!</h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your {user?.role === 'student' ? 'studies' : 'institution'} today.
          </p>
        </div>
        <Badge variant="outline" className="text-sm capitalize">
          {user?.role}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-full`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                      {stat.change}
                    </span> from last month
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New student enrolled</p>
                  <p className="text-xs text-muted-foreground">John Doe joined Class 5A</p>
                  <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Attendance marked</p>
                  <p className="text-xs text-muted-foreground">Class 3B attendance completed</p>
                  <p className="text-xs text-muted-foreground mt-1">3 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New announcement</p>
                  <p className="text-xs text-muted-foreground">School event scheduled for next week</p>
                  <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start hover:bg-accent"
                    onClick={() => setLocation(action.href)}
                  >
                    <Icon className={`h-6 w-6 mb-2 ${action.color}`} />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

         {/* Announcements */}
         <AnnouncementsWidget />
       </div>
     );
  );
}