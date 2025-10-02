import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Badge } from '../components/ui/badge';

interface Period {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  orderIndex: number;
  isBreak: boolean;
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

interface Teacher {
  id: string;
  name: string;
}

interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  roomNumber?: string;
  period: Period;
  subject?: Subject;
  teacher?: Teacher;
}

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function TimetableBuilder() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [timetable, setTimetable] = useState<Record<number, TimetableEntry[]>>({});
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{
    dayOfWeek: number;
    periodId: string;
    entry?: TimetableEntry;
  } | null>(null);
  const [formData, setFormData] = useState({
    subjectId: '',
    teacherId: '',
    roomNumber: '',
  });

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchTeachers();
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSections(selectedClass);
    } else {
      setSections([]);
      setSelectedSection('');
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchTimetable();
    }
  }, [selectedClass, selectedSection]);

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

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/users?role=teacher', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setTeachers(data.data.users.map((u: any) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
        })));
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchPeriods = async () => {
    try {
      const response = await fetch('/api/timetable/periods', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) setPeriods(data.data);
    } catch (error) {
      console.error('Error fetching periods:', error);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/timetable/class?classId=${selectedClass}&sectionId=${selectedSection}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setTimetable(data.data);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch timetable',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openEntryDialog = (dayOfWeek: number, periodId: string, entry?: TimetableEntry) => {
    setEditingEntry({ dayOfWeek, periodId, entry });
    if (entry) {
      setFormData({
        subjectId: entry.subject?.id || '',
        teacherId: entry.teacher?.id || '',
        roomNumber: entry.roomNumber || '',
      });
    } else {
      setFormData({ subjectId: '', teacherId: '', roomNumber: '' });
    }
    setDialogOpen(true);
  };

  const saveEntry = async () => {
    if (!editingEntry) return;

    try {
      const response = await fetch('/api/timetable/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          classId: selectedClass,
          sectionId: selectedSection,
          subjectId: formData.subjectId || null,
          teacherId: formData.teacherId || null,
          periodId: editingEntry.periodId,
          dayOfWeek: editingEntry.dayOfWeek,
          roomNumber: formData.roomNumber || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Timetable entry saved successfully',
        });
        setDialogOpen(false);
        fetchTimetable();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save entry',
        variant: 'destructive',
      });
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/timetable/entries/${entryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Entry deleted successfully',
        });
        fetchTimetable();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete entry',
        variant: 'destructive',
      });
    }
  };

  const getEntryForCell = (dayOfWeek: number, periodId: string): TimetableEntry | undefined => {
    const dayEntries = timetable[dayOfWeek] || [];
    return dayEntries.find(entry => entry.period.id === periodId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Timetable Builder</h1>
        <p className="text-muted-foreground">Create and manage class timetables</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class & Section</CardTitle>
          <CardDescription>Choose the class and section to manage timetable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading timetable...</p>
            </div>
          </CardContent>
        </Card>
      ) : selectedClass && selectedSection ? (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Timetable</CardTitle>
            <CardDescription>Click on any cell to add or edit an entry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-muted font-semibold text-left min-w-[120px]">
                      Period / Day
                    </th>
                    {DAYS.map(day => (
                      <th key={day.value} className="border p-2 bg-muted font-semibold text-center min-w-[150px]">
                        {day.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(period => (
                    <tr key={period.id}>
                      <td className="border p-2 bg-muted/50">
                        <div className="font-medium">{period.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {period.startTime} - {period.endTime}
                        </div>
                        {period.isBreak && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Break
                          </Badge>
                        )}
                      </td>
                      {DAYS.map(day => {
                        const entry = getEntryForCell(day.value, period.id);
                        return (
                          <td
                            key={`${day.value}-${period.id}`}
                            className={`border p-2 cursor-pointer hover:bg-accent/50 transition-colors ${
                              period.isBreak ? 'bg-gray-50' : ''
                            }`}
                            onClick={() => !period.isBreak && openEntryDialog(day.value, period.id, entry)}
                          >
                            {!period.isBreak && entry ? (
                              <div className="space-y-1">
                                <div className="font-medium text-sm">{entry.subject?.name || 'No Subject'}</div>
                                <div className="text-xs text-muted-foreground">
                                  {entry.teacher?.name || 'No Teacher'}
                                </div>
                                {entry.roomNumber && (
                                  <Badge variant="outline" className="text-xs">
                                    Room {entry.roomNumber}
                                  </Badge>
                                )}
                                <div className="flex gap-1 mt-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEntryDialog(day.value, period.id, entry);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-red-600 hover:text-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('Delete this entry?')) {
                                        deleteEntry(entry.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : !period.isBreak ? (
                              <div className="text-center text-muted-foreground text-sm">
                                <Plus className="h-4 w-4 mx-auto mb-1" />
                                <span className="text-xs">Add Entry</span>
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground text-sm">
                                {period.name}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEntry?.entry ? 'Edit' : 'Add'} Timetable Entry
            </DialogTitle>
            <DialogDescription>
              {editingEntry && (
                <>
                  {DAYS.find(d => d.value === editingEntry.dayOfWeek)?.label} -{' '}
                  {periods.find(p => p.id === editingEntry.periodId)?.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={formData.subjectId}
                onValueChange={value => setFormData({ ...formData, subjectId: value })}
              >
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

            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select
                value={formData.teacherId}
                onValueChange={value => setFormData({ ...formData, teacherId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Room Number (Optional)</Label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g., 101, Lab 1"
                value={formData.roomNumber}
                onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEntry}>Save Entry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}