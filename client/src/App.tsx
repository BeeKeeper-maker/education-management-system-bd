import { Route, Switch, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import StudentAdmission from './pages/StudentAdmission';
import StudentsList from './pages/StudentsList';
import StudentProfile from './pages/StudentProfile';
import TakeAttendance from './pages/TakeAttendance';
import AttendanceReports from './pages/AttendanceReports';
import TimetableBuilder from './pages/TimetableBuilder';
import MyTimetable from './pages/MyTimetable';
import ExamManagement from './pages/ExamManagement';
import ExamSchedule from './pages/ExamSchedule';
import MarksEntry from './pages/MarksEntry';
import FeeCollection from './pages/FeeCollection';
import StudentFeeView from './pages/StudentFeeView';
import ExpenseManagement from './pages/ExpenseManagement';
import FinancialDashboard from './pages/FinancialDashboard';
import HostelManagement from './pages/HostelManagement';
import RoomAllocation from './pages/RoomAllocation';
import BookManagement from './pages/BookManagement';
import IssueReturn from './pages/IssueReturn';
import NoticeBoard from './pages/NoticeBoard';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
function ProtectedRoute({ 
  component: Component,
  allowedRoles,
}: { 
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">403</h1>
            <p className="text-muted-foreground">You don't have permission to access this page</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
}

// Public Route Component
function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login">
        <PublicRoute component={Login} />
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>

      <Route path="/users">
        <ProtectedRoute 
          component={Users} 
          allowedRoles={['superadmin', 'admin']}
        />
      </Route>

      <Route path="/students">
        <ProtectedRoute 
          component={StudentsList}
          allowedRoles={['superadmin', 'admin', 'teacher']}
        />
      </Route>

      <Route path="/students/admission">
        <ProtectedRoute 
          component={StudentAdmission}
          allowedRoles={['superadmin', 'admin']}
        />
      </Route>

      <Route path="/students/:id">
        <ProtectedRoute 
          component={StudentProfile}
          allowedRoles={['superadmin', 'admin', 'teacher']}
        />
      </Route>

      <Route path="/attendance/take">
        <ProtectedRoute 
          component={TakeAttendance}
          allowedRoles={['superadmin', 'admin', 'teacher']}
        />
      </Route>

      <Route path="/attendance/reports">
        <ProtectedRoute 
          component={AttendanceReports}
          allowedRoles={['superadmin', 'admin']}
        />
      </Route>

      <Route path="/timetable/builder">
        <ProtectedRoute 
          component={TimetableBuilder}
          allowedRoles={['superadmin', 'admin']}
        />
      </Route>

      <Route path="/timetable/my">
        <ProtectedRoute 
          component={MyTimetable}
          allowedRoles={['teacher', 'student']}
        />
      </Route>

      <Route path="/exams">
        <ProtectedRoute 
          component={ExamManagement}
          allowedRoles={['superadmin', 'admin']}
        />
      </Route>

      <Route path="/exams/:examId/schedule">
        <ProtectedRoute 
          component={ExamSchedule}
          allowedRoles={['superadmin', 'admin']}
        />
      </Route>

      <Route path="/exams/marks/:examSubjectId">
        <ProtectedRoute 
          component={MarksEntry}
          allowedRoles={['superadmin', 'admin', 'teacher']}
        />
      </Route>

   
         <Route path="/fees/collection">
           <ProtectedRoute 
             component={FeeCollection}
             allowedRoles={["superadmin", "admin", "accountant"]}
           />
         </Route>
   
         <Route path="/fees/my-fees">
           <ProtectedRoute 
             component={StudentFeeView}
             allowedRoles={["student", "guardian"]}
           />
         </Route>
   
         <Route path="/expenses">
           <ProtectedRoute 
             component={ExpenseManagement}
             allowedRoles={["superadmin", "admin", "accountant"]}
           />
         </Route>
   
         <Route path="/financial/dashboard">
           <ProtectedRoute 
             component={FinancialDashboard}
             allowedRoles={["superadmin", "admin", "accountant"]}
           />
         </Route>
   
         <Route path="/hostel/management">
           <ProtectedRoute 
             component={HostelManagement}
             allowedRoles={["superadmin", "admin", "hostel_manager"]}
           />
         </Route>
   
         <Route path="/hostel/allocation">
           <ProtectedRoute 
             component={RoomAllocation}
             allowedRoles={["superadmin", "admin", "hostel_manager"]}
           />
         </Route>
   
         <Route path="/library/books">
           <ProtectedRoute 
             component={BookManagement}
             allowedRoles={["superadmin", "admin"]}
           />
         </Route>
   
         <Route path="/library/issue-return">
           <ProtectedRoute 
             component={IssueReturn}
             allowedRoles={["superadmin", "admin"]}
           />
            </Route>
         <Route path="/notice-board">
              <ProtectedRoute 
                component={NoticeBoard}
                allowedRoles={["superadmin", "admin"]}
              />
            </Route>
         <Route path="/teachers">
        <ProtectedRoute component={() => <div>Teachers Page (Coming Soon)</div>} />
      </Route>

      <Route path="/classes">
        <ProtectedRoute component={() => <div>Classes Page (Coming Soon)</div>} />
      </Route>

      <Route path="/notifications">
        <ProtectedRoute component={() => <div>Notifications Page (Coming Soon)</div>} />
      </Route>

      <Route path="/settings">
        <ProtectedRoute component={() => <div>Settings Page (Coming Soon)</div>} />
      </Route>

      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>

      <Route>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-muted-foreground">Page not found</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;