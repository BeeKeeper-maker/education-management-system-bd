import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useToast } from '../components/ui/use-toast';
import { Plus, Calendar, Edit, Eye, FileText, CheckCircle } from 'lucide-react';
import { useNavigate } from 'wouter';

interface ExamType {
  id: string;
  name: string;
  weightage: number;
}

interface Exam {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  isPublished: boolean;
  resultsPublished: boolean;
  examType: {
    id: string;
    name: string;
    weightage: number;
  };
  createdAt: string;
}

interface AcademicSession {
  id: string;
  name: string;
  isCurrent: boolean;
}

export default function ExamManagement() {
  const { toast } = useToast();
  const [, navigate] = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    examTypeId: '',
    academicSessionId: '',
    startDate: '',
    endDate: '',
    description: '',
    instructions: '',
  });

  useEffect(() => {
    fetchExams();
    fetchExamTypes();
    fetchSessions();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/examinations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setExams(data.data);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamTypes = async () => {
    try {
      const response = await fetch('/api/examinations/types', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setExamTypes(data.data);
      }
    } catch (error) {
      console.error('Error fetching exam types:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/academic/sessions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
        // Set current session as default
        const currentSession = data.data.find((s: AcademicSession) => s.isCurrent);
        if (currentSession) {
          setFormData(prev => ({ ...prev, academicSessionId: currentSession.id }));
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const createExam = async () => {
    try {
      const response = await fetch('/api/examinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Exam created successfully',
        });
        setDialogOpen(false);
        resetForm();
        fetchExams();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create exam',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    const currentSession = sessions.find(s => s.isCurrent);
    setFormData({
      name: '',
      examTypeId: '',
      academicSessionId: currentSession?.id || '',
      startDate: '',
      endDate: '',
      description: '',
      instructions: '',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exam Management</h1>
          <p className="text-muted-foreground">Create and manage examinations</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Exam
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Exams</p>
              <p className="text-3xl font-bold">{exams.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-600">Published</p>
              <p className="text-3xl font-bold text-blue-600">
                {exams.filter(e => e.isPublished).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-green-600">Results Published</p>
              <p className="text-3xl font-bold text-green-600">
                {exams.filter(e => e.resultsPublished).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-yellow-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">
                {exams.filter(e => !e.isPublished).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exams List */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading exams...</p>
            </div>
          </CardContent>
        </Card>
      ) : exams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map(exam => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{exam.name}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant="outline">{exam.examType.name}</Badge>
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {exam.isPublished && (
                      <Badge variant="default" className="bg-blue-600">
                        Published
                      </Badge>
                    )}
                    {exam.resultsPublished && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Results
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
                    </span>
                  </div>
                  {exam.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {exam.description}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/exams/${exam.id}`)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/exams/${exam.id}/schedule`)}
                    >
                      <Calendar className="mr-1 h-4 w-4" />
                      Schedule
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/exams/${exam.id}/marks`)}
                    >
                      <FileText className="mr-1 h-4 w-4" />
                      Marks
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No exams created yet</p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Exam
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Exam Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Exam</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new examination
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Exam Name *</Label>
              <Input
                placeholder="e.g., First Terminal Examination 2024"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Exam Type *</Label>
                <Select
                  value={formData.examTypeId}
                  onValueChange={value => setFormData({ ...formData, examTypeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.weightage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Academic Session *</Label>
                <Select
                  value={formData.academicSessionId}
                  onValueChange={value => setFormData({ ...formData, academicSessionId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map(session => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.name} {session.isCurrent && '(Current)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the exam"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                placeholder="General instructions for students"
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={createExam}
                disabled={
                  !formData.name ||
                  !formData.examTypeId ||
                  !formData.academicSessionId ||
                  !formData.startDate ||
                  !formData.endDate
                }
              >
                Create Exam
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}