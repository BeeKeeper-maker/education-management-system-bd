import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useToast } from '../components/ui/use-toast';
import { Calendar, Plus, Edit, Trash2, ArrowLeft, Clock, MapPin, FileText } from 'lucide-react';

interface Exam {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  examType: {
    name: string;
  };
}

interface ExamSubject {
  id: string;
  examDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  roomNumber?: string;
  instructions?: string;
  class: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

interface Class {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

export default function ExamSchedule() {
  const { examId } = useParams<{ examId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<ExamSubject | null>(null);
  const [formData, setFormData] = useState({
    classId: '',
    sectionId: '',
    subjectId: '',
    examDate: '',
    startTime: '',
    endTime: '',
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    roomNumber: '',
    instructions: '',
  });

  useEffect(() => {
    if (examId) {
      fetchExam();
      fetchExamSubjects();
      fetchClasses();
      fetchSubjects();
    }
  }, [examId]);

  useEffect(() => {
    if (formData.classId) {
      fetchSections(formData.classId);
    }
  }, [formData.classId]);

  const fetchExam = async () => {
    try {
      const response = await fetch(`/api/examinations/${examId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setExam(data.data);
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
    }
  };

  const fetchExamSubjects = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/examinations/${examId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setExamSubjects(data.data.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching exam subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/academic/classes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) setClasses(data.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      const response = await fetch(`/api/academic/classes/${classId}/sections`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) setSections(data.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/academic/subjects', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) setSubjects(data.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const openDialog = (subject?: ExamSubject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        classId: subject.class.id,
        sectionId: subject.section?.id || '',
        subjectId: subject.subject.id,
        examDate: subject.examDate,
        startTime: subject.startTime,
        endTime: subject.endTime,
        duration: subject.duration,
        totalMarks: subject.totalMarks,
        passingMarks: subject.passingMarks,
        roomNumber: subject.roomNumber || '',
        instructions: subject.instructions || '',
      });
    } else {
      setEditingSubject(null);
      setFormData({
        classId: '',
        sectionId: '',
        subjectId: '',
        examDate: '',
        startTime: '',
        endTime: '',
        duration: 60,
        totalMarks: 100,
        passingMarks: 40,
        roomNumber: '',
        instructions: '',
      });
    }
    setDialogOpen(true);
  };

  const saveExamSubject = async () => {
    try {
      const response = await fetch('/api/examinations/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          examId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Exam subject scheduled successfully',
        });
        setDialogOpen(false);
        fetchExamSubjects();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule exam subject',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const groupByDate = () => {
    const grouped: { [key: string]: ExamSubject[] } = {};
    examSubjects.forEach(subject => {
      if (!grouped[subject.examDate]) {
        grouped[subject.examDate] = [];
      }
      grouped[subject.examDate].push(subject);
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  const groupedSubjects = groupByDate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/exams')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{exam?.name}</h1>
          <p className="text-muted-foreground">
            {exam?.examType.name} | {exam && formatDate(exam.startDate)} - {exam && formatDate(exam.endDate)}
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Subject
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Subjects</p>
              <p className="text-3xl font-bold">{examSubjects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Exam Days</p>
              <p className="text-3xl font-bold">{groupedSubjects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Marks</p>
              <p className="text-3xl font-bold">
                {examSubjects.reduce((sum, s) => sum + s.totalMarks, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Classes</p>
              <p className="text-3xl font-bold">
                {new Set(examSubjects.map(s => s.class.id)).size}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam Schedule */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading schedule...</p>
            </div>
          </CardContent>
        </Card>
      ) : groupedSubjects.length > 0 ? (
        <div className="space-y-6">
          {groupedSubjects.map(([date, subjects]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {formatDate(date)}
                </CardTitle>
                <CardDescription>{subjects.length} subject(s) scheduled</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subjects.map(subject => (
                    <div
                      key={subject.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{subject.subject.name}</h3>
                          <Badge variant="outline">{subject.subject.code}</Badge>
                          <Badge>{subject.class.name} - {subject.section?.name}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{subject.startTime} - {subject.endTime} ({subject.duration} min)</span>
                          </div>
                          {subject.roomNumber && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>Room {subject.roomNumber}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>Total: {subject.totalMarks} | Passing: {subject.passingMarks}</span>
                          </div>
                        </div>
                        {subject.instructions && (
                          <p className="mt-2 text-sm text-muted-foreground">{subject.instructions}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/exams/marks/${subject.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Enter Marks
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDialog(subject)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No subjects scheduled yet</p>
              <Button onClick={() => openDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule First Subject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Edit' : 'Schedule'} Exam Subject</DialogTitle>
            <DialogDescription>Fill in the details to schedule an exam subject</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={formData.classId} onValueChange={value => setFormData({ ...formData, classId: value })}>
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
                  value={formData.sectionId}
                  onValueChange={value => setFormData({ ...formData, sectionId: value })}
                  disabled={!formData.classId}
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
            </div>

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={formData.subjectId} onValueChange={value => setFormData({ ...formData, subjectId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Exam Date *</Label>
                <Input
                  type="date"
                  value={formData.examDate}
                  onChange={e => setFormData({ ...formData, examDate: e.target.value })}
                  min={exam?.startDate}
                  max={exam?.endDate}
                />
              </div>

              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes) *</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  min="15"
                  step="15"
                />
              </div>

              <div className="space-y-2">
                <Label>Total Marks *</Label>
                <Input
                  type="number"
                  value={formData.totalMarks}
                  onChange={e => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label>Passing Marks *</Label>
                <Input
                  type="number"
                  value={formData.passingMarks}
                  onChange={e => setFormData({ ...formData, passingMarks: parseInt(e.target.value) })}
                  min="1"
                  max={formData.totalMarks}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Room Number</Label>
              <Input
                placeholder="e.g., 101, Lab 1"
                value={formData.roomNumber}
                onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                placeholder="Special instructions for this exam"
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={saveExamSubject}
                disabled={
                  !formData.classId ||
                  !formData.subjectId ||
                  !formData.examDate ||
                  !formData.startTime ||
                  !formData.endTime
                }
              >
                {editingSubject ? 'Update' : 'Schedule'} Subject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}