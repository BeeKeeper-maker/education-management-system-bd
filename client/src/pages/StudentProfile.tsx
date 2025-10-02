import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Heart, 
  Users, 
  BookOpen, 
  CheckCircle,
  DollarSign,
  Edit,
  ArrowLeft,
  GraduationCap,
} from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import { formatDate, getInitials } from '@/lib/utils';

export default function StudentProfile() {
  const [, params] = useRoute('/students/:id');
  const [, setLocation] = useLocation();
  const studentId = params?.id;

  // Fetch student details
  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const response = await apiClient.get(`/students/${studentId}`);
      return response.data;
    },
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Student Not Found</h2>
          <p className="text-muted-foreground mb-4">The student you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation('/students')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </div>
      </div>
    );
  }

  const student = studentData;
  const user = student.user;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setLocation('/students')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Students
        </Button>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-4xl font-bold text-primary">
                  {getInitials(user.firstName, user.lastName)}
                </span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Student ID: {student.studentId}
                  </p>
                </div>
                <Badge 
                  variant={student.status === 'active' ? 'success' : 'outline'}
                  className="capitalize"
                >
                  {student.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {user.dateOfBirth ? formatDate(user.dateOfBirth) : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{user.gender || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal Details</TabsTrigger>
          <TabsTrigger value="academic">Academic Info</TabsTrigger>
          <TabsTrigger value="guardian">Guardian Info</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fee Status</TabsTrigger>
        </TabsList>

        {/* Personal Details Tab */}
        <TabsContent value="personal" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Blood Group</span>
                  <span className="font-medium">{user.bloodGroup || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Admission Number</span>
                  <span className="font-medium">{student.admissionNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Admission Date</span>
                  <span className="font-medium">
                    {formatDate(student.admissionDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Roll Number</span>
                  <span className="font-medium">{student.rollNumber || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Address</p>
                  <p className="font-medium">{user.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Emergency Contact</p>
                  <p className="font-medium">{student.emergencyContact || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {student.medicalInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-500" />
                  Medical Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{student.medicalInfo}</p>
              </CardContent>
            </Card>
          )}

          {student.previousSchool && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Previous School
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{student.previousSchool}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Academic Info Tab */}
        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Enrollment</CardTitle>
              <CardDescription>Current academic information</CardDescription>
            </CardHeader>
            <CardContent>
              {student.currentEnrollment ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Class</p>
                      <p className="font-medium text-lg">
                        {student.currentEnrollment.class?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Section</p>
                      <p className="font-medium text-lg">
                        {student.currentEnrollment.section?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Academic Session</p>
                      <p className="font-medium text-lg">
                        {student.currentEnrollment.academicSession?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Enrollment Date</p>
                      <p className="font-medium text-lg">
                        {formatDate(student.currentEnrollment.enrollmentDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No current enrollment</p>
              )}
            </CardContent>
          </Card>

          {student.enrollments && student.enrollments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Enrollment History</CardTitle>
                <CardDescription>Past enrollments and transfers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {student.enrollments.map((enrollment: any) => (
                    <div 
                      key={enrollment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {enrollment.class?.name} - Section {enrollment.section?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.academicSession?.name}
                        </p>
                      </div>
                      <Badge variant={enrollment.status === 'active' ? 'success' : 'outline'}>
                        {enrollment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Guardian Info Tab */}
        <TabsContent value="guardian" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Guardian Name</p>
                  <p className="font-medium text-lg">{student.guardianName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Relation</p>
                  <p className="font-medium text-lg capitalize">
                    {student.guardianRelation || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-lg">{student.guardianPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-lg">{student.guardianEmail || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">95.5%</div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Present Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">19</div>
                <p className="text-xs text-muted-foreground mt-1">Out of 20 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">1</div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>Monthly attendance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed attendance records will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$5,000</div>
                <p className="text-xs text-muted-foreground mt-1">Annual fees</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">$5,000</div>
                <p className="text-xs text-muted-foreground mt-1">100% paid</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Due</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">$0</div>
                <p className="text-xs text-muted-foreground mt-1">No pending dues</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All fee payments and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Payment history will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}