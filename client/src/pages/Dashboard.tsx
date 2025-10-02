import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { t } from '@/i18n';
import AnnouncementsWidget from '@/components/AnnouncementsWidget';
import { Users, GraduationCap, BookOpen, CheckCircle, XCircle, TrendingUp, DollarSign, Calendar, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const quickActions = [
    {
      label: 'Take Attendance',
      icon: CheckCircle,
      href: '/attendance/take',
      color: 'text-green-500',
      roles: ['teacher', 'admin', 'superadmin']
    },
    {
      label: 'Create Announcement',
      icon: Bell,
      href: '/communication/announcements',
      color: 'text-blue-500',
      roles: ['teacher', 'admin', 'superadmin']
    },
    {
      label: 'View Timetable',
      icon: Calendar,
      href: '/timetable/view',
      color: 'text-purple-500',
      roles: ['teacher', 'student', 'admin', 'superadmin']
    },
    {
      label: 'Fee Collection',
      icon: DollarSign,
      href: '/fees/collection',
      color: 'text-yellow-500',
      roles: ['accountant', 'admin', 'superadmin']
    }
  ];

  const filteredQuickActions = quickActions.filter(action => 
    !action.roles || action.roles.includes(user?.role || '')
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard')}</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +20% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Classes
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Subjects
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              Across all classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Attendance Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.5%</div>
            <p className="text-xs text-muted-foreground">
              +1.2% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>Overview of today's attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Present</span>
                </div>
                <span className="text-2xl font-bold">1,156</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium">Absent</span>
                </div>
                <span className="text-2xl font-bold">78</span>
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
              {filteredQuickActions.map((action, index) => {
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
}
