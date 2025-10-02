import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, Download, Upload, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Input } from '../components/ui/input';

interface Student {
  id: string;
  studentId: string;
  name: string;
  rollNumber: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks: string;
  markId?: string;
}

interface ExamSubject {
  id: string;
  examDate: string;
  startTime: string;
  endTime: string;
  totalMarks: number;
  passingMarks: number;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  class: {
    id: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
  };
}

export default function MarksEntry() {
  const { examSubjectId } = useParams<{ examSubjectId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [examSubject, setExamSubject] = useState<ExamSubject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: string } | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const autoSaveTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (examSubjectId) {
      fetchData();
    }
  }, [examSubjectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/examinations/subjects/${examSubjectId}/students`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setExamSubject(data.data.examSubject);
        setStudents(data.data.students.map((s: any) => ({
          id: s.id,
          studentId: s.studentId,
          name: s.name,
          rollNumber: s.rollNumber,
          marksObtained: s.marks,
          isAbsent: s.isAbsent || false,
          remarks: s.remarks || '',
          markId: s.markId,
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load marks entry data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const autoSave = useCallback(() => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    
    autoSaveTimeout.current = setTimeout(() => {
      saveMarks(true);
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [students]);

  const saveMarks = async (isAutoSave = false) => {
    if (!isAutoSave) setSaving(true);
    
    try {
      const marksData = students.map(student => ({
        studentId: student.id,
        marksObtained: student.isAbsent ? null : student.marksObtained,
        isAbsent: student.isAbsent,
        remarks: student.remarks,
      }));

      const response = await fetch('/api/examinations/marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          examSubjectId,
          marksData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUnsavedChanges(false);
        if (!isAutoSave) {
          toast({
            title: 'Success',
            description: 'Marks saved successfully',
          });
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save marks',
        variant: 'destructive',
      });
    } finally {
      if (!isAutoSave) setSaving(false);
    }
  };

  const updateStudent = (index: number, field: keyof Student, value: any) => {
    setStudents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setUnsavedChanges(true);
    autoSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colName: string) => {
    const totalRows = students.length;
    const cols = ['marks', 'remarks'];
    const currentColIndex = cols.indexOf(colName);

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (rowIndex > 0) {
          focusCell(rowIndex - 1, colName);
        }
        break;
      case 'ArrowDown':
      case 'Enter':
        e.preventDefault();
        if (rowIndex < totalRows - 1) {
          focusCell(rowIndex + 1, colName);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentColIndex > 0) {
          focusCell(rowIndex, cols[currentColIndex - 1]);
        }
        break;
      case 'ArrowRight':
      case 'Tab':
        if (e.key === 'Tab') e.preventDefault();
        if (currentColIndex < cols.length - 1) {
          focusCell(rowIndex, cols[currentColIndex + 1]);
        } else if (rowIndex < totalRows - 1) {
          focusCell(rowIndex + 1, cols[0]);
        }
        break;
    }
  };

  const focusCell = (rowIndex: number, colName: string) => {
    const key = `${rowIndex}-${colName}`;
    const input = inputRefs.current[key];
    if (input) {
      input.focus();
      input.select();
      setSelectedCell({ row: rowIndex, col: colName });
    }
  };

  const toggleAbsent = (index: number) => {
    const student = students[index];
    updateStudent(index, 'isAbsent', !student.isAbsent);
    if (!student.isAbsent) {
      updateStudent(index, 'marksObtained', null);
    }
  };

  const calculateStatistics = () => {
    const validMarks = students.filter(s => !s.isAbsent && s.marksObtained !== null);
    const total = validMarks.length;
    const sum = validMarks.reduce((acc, s) => acc + (s.marksObtained || 0), 0);
    const average = total > 0 ? (sum / total).toFixed(2) : 0;
    const highest = total > 0 ? Math.max(...validMarks.map(s => s.marksObtained || 0)) : 0;
    const lowest = total > 0 ? Math.min(...validMarks.map(s => s.marksObtained || 0)) : 0;
    const passed = validMarks.filter(s => (s.marksObtained || 0) >= (examSubject?.passingMarks || 0)).length;
    const failed = validMarks.filter(s => (s.marksObtained || 0) < (examSubject?.passingMarks || 0)).length;
    const absent = students.filter(s => s.isAbsent).length;

    return { total, average, highest, lowest, passed, failed, absent };
  };

  const stats = calculateStatistics();

  const exportToCSV = () => {
    const headers = ['Roll No', 'Student ID', 'Name', 'Marks', 'Status', 'Remarks'];
    const rows = students.map(s => [
      s.rollNumber,
      s.studentId,
      s.name,
      s.isAbsent ? 'AB' : s.marksObtained?.toString() || '',
      s.isAbsent ? 'Absent' : (s.marksObtained || 0) >= (examSubject?.passingMarks || 0) ? 'Pass' : 'Fail',
      s.remarks,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks_${examSubject?.subject.code}_${examSubject?.class.name}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading marks entry...</p>
        </div>
      </div>
    );
  }

  if (!examSubject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Exam subject not found</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">{examSubject.subject.name} - Marks Entry</h1>
          <p className="text-muted-foreground">
            {examSubject.class.name} - {examSubject.section.name} | Total Marks: {examSubject.totalMarks} | Passing: {examSubject.passingMarks}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => saveMarks(false)} disabled={saving || !unsavedChanges}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : unsavedChanges ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Average</p>
              <p className="text-2xl font-bold">{stats.average}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-green-600">Highest</p>
              <p className="text-2xl font-bold text-green-600">{stats.highest}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-red-600">Lowest</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowest}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-green-600">Passed</p>
              <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-red-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-yellow-600">Absent</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.absent}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marks Entry Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Marks Entry Grid</CardTitle>
          <CardDescription>
            Use keyboard arrows or Tab to navigate. Changes are auto-saved.
            {unsavedChanges && <Badge variant="outline" className="ml-2">Unsaved changes</Badge>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-2 text-left w-20">Roll No</th>
                  <th className="border p-2 text-left w-32">Student ID</th>
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2 text-center w-32">Marks (/{examSubject.totalMarks})</th>
                  <th className="border p-2 text-center w-24">Absent</th>
                  <th className="border p-2 text-center w-24">Status</th>
                  <th className="border p-2 text-left w-48">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const isPassed = !student.isAbsent && (student.marksObtained || 0) >= examSubject.passingMarks;
                  const isFailed = !student.isAbsent && student.marksObtained !== null && (student.marksObtained || 0) < examSubject.passingMarks;
                  
                  return (
                    <tr key={student.id} className={selectedCell?.row === index ? 'bg-accent' : ''}>
                      <td className="border p-2 text-center font-medium">{student.rollNumber}</td>
                      <td className="border p-2 text-sm text-muted-foreground">{student.studentId}</td>
                      <td className="border p-2 font-medium">{student.name}</td>
                      <td className="border p-2">
                        <Input
                          ref={el => inputRefs.current[`${index}-marks`] = el}
                          type="number"
                          min="0"
                          max={examSubject.totalMarks}
                          value={student.isAbsent ? '' : student.marksObtained?.toString() || ''}
                          onChange={e => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                            if (value !== null && (value < 0 || value > examSubject.totalMarks)) {
                              toast({
                                title: 'Invalid Marks',
                                description: `Marks must be between 0 and ${examSubject.totalMarks}`,
                                variant: 'destructive',
                              });
                              return;
                            }
                            updateStudent(index, 'marksObtained', value);
                          }}
                          onKeyDown={e => handleKeyDown(e, index, 'marks')}
                          onFocus={() => setSelectedCell({ row: index, col: 'marks' })}
                          disabled={student.isAbsent}
                          className="text-center"
                        />
                      </td>
                      <td className="border p-2 text-center">
                        <input
                          type="checkbox"
                          checked={student.isAbsent}
                          onChange={() => toggleAbsent(index)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="border p-2 text-center">
                        {student.isAbsent ? (
                          <Badge variant="secondary">AB</Badge>
                        ) : student.marksObtained === null ? (
                          <Badge variant="outline">-</Badge>
                        ) : isPassed ? (
                          <Badge className="bg-green-600">Pass</Badge>
                        ) : isFailed ? (
                          <Badge variant="destructive">Fail</Badge>
                        ) : null}
                      </td>
                      <td className="border p-2">
                        <Input
                          ref={el => inputRefs.current[`${index}-remarks`] = el}
                          type="text"
                          value={student.remarks}
                          onChange={e => updateStudent(index, 'remarks', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, index, 'remarks')}
                          onFocus={() => setSelectedCell({ row: index, col: 'remarks' })}
                          placeholder="Optional remarks"
                          className="text-sm"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Auto-save enabled</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">↑↓←→</kbd> Navigate |
              <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">Tab</kbd> Next field |
              <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">Enter</kbd> Next row
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}