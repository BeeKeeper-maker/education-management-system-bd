import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Download, Award, TrendingUp } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface SubjectResult {
  subject: {
    name: string;
    code: string;
  };
  totalMarks: number;
  marksObtained: number;
  grade: string;
  gradePoint: number;
  isPassed: boolean;
}

interface ReportCardProps {
  result: {
    id: string;
    totalMarks: number;
    marksObtained: number;
    percentage: number;
    grade: string;
    gradePoint: number;
    meritPosition?: number;
    exam: {
      name: string;
      examType: string;
    };
    class: {
      name: string;
    };
    section: {
      name: string;
    };
    subjectResults: SubjectResult[];
  };
  student: {
    name: string;
    studentId: string;
    rollNumber: string;
  };
}

export default function ReportCard({ result, student }: ReportCardProps) {
  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getGradeColor = (grade: string) => {
    if (grade === 'A+' || grade === 'A') return 'bg-green-600';
    if (grade === 'A-' || grade === 'B') return 'bg-blue-600';
    if (grade === 'C') return 'bg-yellow-600';
    if (grade === 'D') return 'bg-orange-600';
    return 'bg-red-600';
  };

  const pieData = result.subjectResults.map(sr => ({
    name: sr.subject.code,
    value: parseFloat(sr.marksObtained.toString()),
  }));

  const barData = result.subjectResults.map(sr => ({
    subject: sr.subject.code,
    obtained: parseFloat(sr.marksObtained.toString()),
    total: sr.totalMarks,
    percentage: ((parseFloat(sr.marksObtained.toString()) / sr.totalMarks) * 100).toFixed(1),
  }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <Card className="print:shadow-none">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground print:bg-none print:text-foreground">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Academic Report Card</CardTitle>
              <p className="text-sm opacity-90">{result.exam.name} - {result.exam.examType}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handlePrint} className="print:hidden">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Student Name</p>
              <p className="font-semibold">{student.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Student ID</p>
              <p className="font-semibold">{student.studentId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Class</p>
              <p className="font-semibold">{result.class.name} - {result.section.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roll Number</p>
              <p className="font-semibold">{student.rollNumber}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Total Marks</p>
              <p className="text-3xl font-bold">{result.marksObtained}/{result.totalMarks}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Percentage</p>
              <p className="text-3xl font-bold text-primary">{result.percentage.toFixed(2)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Grade</p>
              <Badge className={`text-2xl px-4 py-2 ${getGradeColor(result.grade)}`}>
                {result.grade}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">GPA</p>
              <p className="text-3xl font-bold text-green-600">{result.gradePoint.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {result.meritPosition && (
        <Card className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3">
              <Award className="h-8 w-8 text-yellow-600" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Merit Position</p>
                <p className="text-3xl font-bold text-yellow-600">#{result.meritPosition}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subject-wise Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Subject</th>
                  <th className="text-center p-3">Total Marks</th>
                  <th className="text-center p-3">Marks Obtained</th>
                  <th className="text-center p-3">Percentage</th>
                  <th className="text-center p-3">Grade</th>
                  <th className="text-center p-3">GPA</th>
                  <th className="text-center p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.subjectResults.map((sr, index) => {
                  const percentage = ((parseFloat(sr.marksObtained.toString()) / sr.totalMarks) * 100).toFixed(2);
                  return (
                    <tr key={index} className="border-b hover:bg-accent/50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{sr.subject.name}</p>
                          <p className="text-sm text-muted-foreground">{sr.subject.code}</p>
                        </div>
                      </td>
                      <td className="text-center p-3">{sr.totalMarks}</td>
                      <td className="text-center p-3 font-semibold">{sr.marksObtained}</td>
                      <td className="text-center p-3">{percentage}%</td>
                      <td className="text-center p-3">
                        <Badge className={getGradeColor(sr.grade)}>{sr.grade}</Badge>
                      </td>
                      <td className="text-center p-3 font-semibold">{sr.gradePoint.toFixed(2)}</td>
                      <td className="text-center p-3">
                        {sr.isPassed ? (
                          <Badge className="bg-green-600">Pass</Badge>
                        ) : (
                          <Badge variant="destructive">Fail</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Marks Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="obtained" fill="#22c55e" name="Marks Obtained" />
                <Bar dataKey="total" fill="#e5e7eb" name="Total Marks" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Subjects Passed</p>
                <p className="text-2xl font-bold text-green-600">
                  {result.subjectResults.filter(sr => sr.isPassed).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subjects Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {result.subjectResults.filter(sr => !sr.isPassed).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Highest Score</p>
                <p className="text-2xl font-bold">
                  {Math.max(...result.subjectResults.map(sr => parseFloat(sr.marksObtained.toString())))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lowest Score</p>
                <p className="text-2xl font-bold">
                  {Math.min(...result.subjectResults.map(sr => parseFloat(sr.marksObtained.toString())))}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Overall Remarks</p>
              <p className="text-base">
                {result.percentage >= 90
                  ? '🌟 Outstanding performance! Keep up the excellent work.'
                  : result.percentage >= 80
                  ? '👏 Excellent performance! Continue your hard work.'
                  : result.percentage >= 70
                  ? '👍 Very good performance! Keep improving.'
                  : result.percentage >= 60
                  ? '✓ Good performance. Focus on weaker areas.'
                  : result.percentage >= 50
                  ? '⚠️ Satisfactory performance. More effort needed.'
                  : result.percentage >= 40
                  ? '⚠️ Needs improvement. Please work harder.'
                  : '❌ Unsatisfactory performance. Immediate attention required.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card className="print:shadow-none">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Generated on: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p>EduPro Education Management System</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}