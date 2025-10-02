import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CheckCircle2, XCircle, Clock, Save, Users } from 'lucide-react';

interface Student {
  id: string;
  studentId: string;
  name: string;
  rollNumber: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

interface Class {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
}

export default function TakeAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch sections when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchSections(selectedClass);
    } else {
      setSections([]);
      setSelectedSection('');
    }
  }, [selectedClass]);

  // Fetch students when class, section, or date changes
  useEffect(() => {
    if (selectedClass && selectedSection && selectedDate) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection, selectedDate]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/academic/classes', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      const response = await fetch(`/api/academic/classes/${classId}/sections`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSections(data.data);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // First, try to fetch existing attendance
      const attendanceResponse = await fetch(
        `/api/attendance/date?classId=${selectedClass}&sectionId=${selectedSection}&date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const attendanceData = await attendanceResponse.json();

      // Fetch enrolled students
      const studentsResponse = await fetch(
        `/api/students?classId=${selectedClass}&sectionId=${selectedSection}&status=active`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const studentsData = await studentsResponse.json();

      if (studentsData.success) {
        // Map students with existing attendance if available
        const studentsList = studentsData.data.students.map((student: any) => {
          const existingAttendance = attendanceData.success
            ? attendanceData.data.find((a: any) => a.studentId === student.id)
            : null;

          return {
            id: student.id,
            studentId: student.studentId,
            name: student.name,
            rollNumber: student.enrollments?.[0]?.rollNumber || 'N/A',
            status: existingAttendance?.status || 'present',
            remarks: existingAttendance?.remarks || '',
          };
        });

        setStudents(studentsList);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStudentStatus = (studentId: string, status: Student['status']) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, status } : student
      )
    );
  };

  const updateStudentRemarks = (studentId: string, remarks: string) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, remarks } : student
      )
    );
  };

  const markAllPresent = () => {
    setStudents(prev =>
      prev.map(student => ({ ...student, status: 'present' as const }))
    );
    toast({
      title: 'Success',
      description: 'All students marked as present',
    });
  };

  const saveAttendance = async () => {
    if (!selectedClass || !selectedSection || !selectedDate) {
      toast({
        title: 'Error',
        description: 'Please select class, section, and date',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          classId: selectedClass,
          sectionId: selectedSection,
          date: selectedDate,
          attendanceRecords: students.map(student => ({
            studentId: student.id,
            status: student.status,
            remarks: student.remarks || null,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Attendance saved successfully',
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save attendance',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: Student['status']) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'excused':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusIcon = (status: Student['status']) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'absent':
        return <XCircle className="h-4 w-4" />;
      case 'late':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const stats = {
    total: students.length,
    present: students.filter(s => s.status === 'present').length,
    absent: students.filter(s => s.status === 'absent').length,
    late: students.filter(s => s.status === 'late').length,
    excused: students.filter(s => s.status === 'excused').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Take Attendance</h1>
        <p className="text-muted-foreground">Mark student attendance for the day</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class & Date</CardTitle>
          <CardDescription>Choose the class, section, and date to mark attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Section</Label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={markAllPresent} variant="outline" className="w-full">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark All Present
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Present</p>
                  <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Late</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Excused</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Students List */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading students...</p>
            </div>
          </CardContent>
        </Card>
      ) : students.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Attendance</CardTitle>
                <CardDescription>Mark attendance for each student</CardDescription>
              </div>
              <Button onClick={saveAttendance} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map(student => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                        {student.rollNumber}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {student.studentId}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={student.status === 'present' ? 'default' : 'outline'}
                      className={student.status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                      onClick={() => updateStudentStatus(student.id, 'present')}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant={student.status === 'absent' ? 'default' : 'outline'}
                      className={student.status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                      onClick={() => updateStudentStatus(student.id, 'absent')}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Absent
                    </Button>
                    <Button
                      size="sm"
                      variant={student.status === 'late' ? 'default' : 'outline'}
                      className={student.status === 'late' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                      onClick={() => updateStudentStatus(student.id, 'late')}
                    >
                      <Clock className="mr-1 h-4 w-4" />
                      Late
                    </Button>
                    <Button
                      size="sm"
                      variant={student.status === 'excused' ? 'default' : 'outline'}
                      className={student.status === 'excused' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      onClick={() => updateStudentStatus(student.id, 'excused')}
                    >
                      Excused
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : selectedClass && selectedSection ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No students found for this class and section</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Please select a class and section to begin</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}