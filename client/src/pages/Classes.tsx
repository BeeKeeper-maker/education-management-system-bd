import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
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

  const { data: classesData, isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['academic', 'classes'],
    queryFn: async () => {
      const response = await apiClient.get('/academic/classes');
      return response.data;
    },
  });

  const { data: sectionsData, isLoading: sectionsLoading, error: sectionsError } = useQuery({
    queryKey: ['academic', 'sections'],
    queryFn: async () => {
      const response = await apiClient.get('/academic/sections');
      return response.data;
    },
  });

  const { data: subjectsData, isLoading: subjectsLoading, error: subjectsError } = useQuery({
    queryKey: ['academic', 'subjects'],
    queryFn: async () => {
      const response = await apiClient.get('/academic/subjects');
      return response.data;
    },
  });

  useEffect(() => {
    if (classesError || sectionsError || subjectsError) {
      toast({
        title: 'Error',
        description: 'Failed to load academic data',
        variant: 'destructive',
      });
    }
  }, [classesError, sectionsError, subjectsError, toast]);

  const classes: Class[] = classesData?.classes || [];
  const sections: Section[] = sectionsData?.sections || [];
  const subjects: Subject[] = subjectsData?.subjects || [];

  const isLoading = classesLoading || sectionsLoading || subjectsLoading;

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
              <div className="text-center py-8 text-muted-foreground" data-testid="empty-classes">
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
                      <p className="font-semibold" data-testid={`class-name-${cls.id}`}>{cls.name}</p>
                      <p className="text-sm text-muted-foreground" data-testid={`class-level-${cls.id}`}>{cls.level}</p>
                    </div>
                    <Badge variant="outline" data-testid={`class-sections-count-${cls.id}`}>
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
              <div className="text-center py-8 text-muted-foreground" data-testid="empty-subjects">
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
                      <p className="font-semibold" data-testid={`subject-name-${subject.id}`}>{subject.name}</p>
                      {subject.description && (
                        <p className="text-sm text-muted-foreground" data-testid={`subject-description-${subject.id}`}>{subject.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary" data-testid={`subject-code-${subject.id}`}>{subject.code}</Badge>
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
            <div className="text-center py-8 text-muted-foreground" data-testid="empty-sections">
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
                      <tr key={section.id} className="border-b hover:bg-muted/50" data-testid={`section-row-${section.id}`}>
                        <td className="p-2 font-medium" data-testid={`section-name-${section.id}`}>{section.name}</td>
                        <td className="p-2" data-testid={`section-class-${section.id}`}>{sectionClass?.name || 'Unknown'}</td>
                        <td className="text-center p-2" data-testid={`section-capacity-${section.id}`}>{section.capacity || '-'}</td>
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
