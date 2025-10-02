import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, GraduationCap, Users } from 'lucide-react';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  isActive: boolean;
}

export default function Teachers() {
  const { toast } = useToast();
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [teacherForm, setTeacherForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: 'male',
    bloodGroup: '',
  });

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users?role=teacher', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to load teachers');

      const data = await response.json();
      setTeachers(data.users || []);
    } catch (error) {
      console.error('Load teachers error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teachers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTeacher = async () => {
    if (!teacherForm.firstName || !teacherForm.lastName || !teacherForm.email || (!editingTeacher && !teacherForm.password)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingTeacher ? `/api/users/${editingTeacher.id}` : '/api/users';
      const method = editingTeacher ? 'PUT' : 'POST';

      const payload: any = {
        ...teacherForm,
        role: 'teacher',
      };

      if (editingTeacher) {
        delete payload.password;
        delete payload.email;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save teacher');
      }

      toast({
        title: 'Success',
        description: `Teacher ${editingTeacher ? 'updated' : 'added'} successfully`,
      });

      setIsDialogOpen(false);
      resetForm();
      loadTeachers();
    } catch (error: any) {
      console.error('Save teacher error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save teacher',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    try {
      const response = await fetch(`/api/users/${teacherId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete teacher');
      }

      toast({
        title: 'Success',
        description: 'Teacher deleted successfully',
      });

      loadTeachers();
    } catch (error: any) {
      console.error('Delete teacher error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete teacher',
        variant: 'destructive',
      });
    }
  };

  const openEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setTeacherForm({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      password: '',
      phone: teacher.phone || '',
      address: teacher.address || '',
      dateOfBirth: teacher.dateOfBirth || '',
      gender: teacher.gender || 'male',
      bloodGroup: teacher.bloodGroup || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setTeacherForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      gender: 'male',
      bloodGroup: '',
    });
    setEditingTeacher(null);
  };

  const filteredTeachers = teachers.filter((teacher) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      teacher.firstName.toLowerCase().includes(query) ||
      teacher.lastName.toLowerCase().includes(query) ||
      teacher.email.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading teachers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="teachers-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Teachers Management</h1>
          <p className="text-muted-foreground">Manage teaching staff</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} data-testid="button-add-teacher">
              <Plus className="h-4 w-4 mr-2" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTeacher ? 'Edit' : 'Add'} Teacher</DialogTitle>
              <DialogDescription>Enter teacher details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    data-testid="input-firstName"
                    value={teacherForm.firstName}
                    onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    data-testid="input-lastName"
                    value={teacherForm.lastName}
                    onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="input-email"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    disabled={!!editingTeacher}
                  />
                </div>
                {!editingTeacher && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      data-testid="input-password"
                      value={teacherForm.password}
                      onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    data-testid="input-phone"
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveTeacher} disabled={isSubmitting} className="flex-1" data-testid="button-submit">
                  {isSubmitting ? 'Saving...' : editingTeacher ? 'Update' : 'Add'} Teacher
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total">{teachers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-active">
              {teachers.filter(t => t.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="stat-inactive">
              {teachers.filter(t => !t.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Teachers</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              data-testid="input-search"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No teachers found</p>
              <p className="text-sm">Try adjusting your search or add a new teacher</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Phone</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="border-b hover:bg-muted/50" data-testid={`teacher-row-${teacher.id}`}>
                      <td className="p-2 font-medium">
                        {teacher.firstName} {teacher.lastName}
                      </td>
                      <td className="p-2">{teacher.email}</td>
                      <td className="p-2">{teacher.phone || '-'}</td>
                      <td className="text-center p-2">
                        <Badge variant={teacher.isActive ? 'default' : 'destructive'}>
                          {teacher.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditTeacher(teacher)} data-testid={`button-edit-${teacher.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTeacher(teacher.id)}
                            data-testid={`button-delete-${teacher.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
