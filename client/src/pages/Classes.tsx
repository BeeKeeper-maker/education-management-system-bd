import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Users, GraduationCap } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  level: string;
  description?: string;
}

interface Section {
  id: string;
  name: string;
  classId: string;
  className?: string;
  capacity?: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export default function Classes() {
  const { toast } = useToast();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [classesRes, sectionsRes, subjectsRes] = await Promise.all([
        fetch('/api/academic/classes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/academic/sections', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/academic/subjects', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (!classesRes.ok) throw new Error('Failed to load classes');

      const classesData = await classesRes.json();
      const sectionsData = sectionsRes.ok ? await sectionsRes.json() : { sections: [] };
      const subjectsData = subjectsRes.ok ? await subjectsRes.json() : { subjects: [] };

      setClasses(classesData.classes || []);
      setSections(sectionsData.sections || []);
      setSubjects(subjectsData.subjects || []);
    } catch (error) {
      console.error('Load data error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load academic data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading academic data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="classes-page">
      <div>
        <h1 className="text-3xl font-bold" data-testid="page-title">Classes & Sections</h1>
        <p className="text-muted-foreground">View academic structure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-classes">{classes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-sections">{sections.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-subjects">{subjects.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Classes</CardTitle>
            <CardDescription>All classes in the institution</CardDescription>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No classes found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                    data-testid={`class-${cls.id}`}
                  >
                    <div>
                      <p className="font-semibold">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">{cls.level}</p>
                    </div>
                    <Badge variant="outline">
                      {sections.filter(s => s.classId === cls.id).length} sections
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>All subjects offered</CardDescription>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No subjects found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                    data-testid={`subject-${subject.id}`}
                  >
                    <div>
                      <p className="font-semibold">{subject.name}</p>
                      {subject.description && (
                        <p className="text-sm text-muted-foreground">{subject.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary">{subject.code}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
          <CardDescription>All sections across classes</CardDescription>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No sections found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Section Name</th>
                    <th className="text-left p-2">Class</th>
                    <th className="text-center p-2">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section) => {
                    const sectionClass = classes.find(c => c.id === section.classId);
                    return (
                      <tr key={section.id} className="border-b hover:bg-muted/50" data-testid={`section-${section.id}`}>
                        <td className="p-2 font-medium">{section.name}</td>
                        <td className="p-2">{sectionClass?.name || 'Unknown'}</td>
                        <td className="text-center p-2">{section.capacity || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
