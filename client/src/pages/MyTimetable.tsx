import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

interface Period {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  orderIndex: number;
  isBreak: boolean;
}

interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  roomNumber?: string;
  period: Period;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  teacher?: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
}

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function MyTimetable() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<Record<number, TimetableEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 1);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      let url = '';
      
      if (user?.role === 'teacher') {
        url = `/api/timetable/teacher/${user.id}`;
      } else if (user?.role === 'student') {
        // For students, we need to get their enrollment first
        const enrollmentResponse = await fetch('/api/students/my-enrollment', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const enrollmentData = await enrollmentResponse.json();
        
        if (enrollmentData.success && enrollmentData.data) {
          url = `/api/timetable/class?classId=${enrollmentData.data.classId}&sectionId=${enrollmentData.data.sectionId}`;
        }
      }

      if (url) {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        
        if (data.success) {
          setTimetable(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayEntries = (dayOfWeek: number): TimetableEntry[] => {
    return (timetable[dayOfWeek] || []).sort((a, b) => 
      a.period.orderIndex - b.period.orderIndex
    );
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay() || 7; // Convert Sunday (0) to 7
    
    const todayEntries = getDayEntries(currentDay);
    return todayEntries.find(entry => {
      return currentTime >= entry.period.startTime && currentTime <= entry.period.endTime;
    });
  };

  const currentPeriod = getCurrentPeriod();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Timetable</h1>
          <p className="text-muted-foreground">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Timetable</h1>
        <p className="text-muted-foreground">Your weekly class schedule</p>
      </div>

      {/* Current Period Card */}
      {currentPeriod && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{currentPeriod.subject?.name || 'Break'}</p>
                  <p className="text-muted-foreground">
                    {currentPeriod.period.startTime} - {currentPeriod.period.endTime}
                  </p>
                </div>
                <Badge className="text-lg px-4 py-2">Now</Badge>
              </div>
              {currentPeriod.subject && (
                <div className="flex flex-wrap gap-4 mt-4">
                  {user?.role === 'student' && currentPeriod.teacher && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{currentPeriod.teacher.name}</span>
                    </div>
                  )}
                  {user?.role === 'teacher' && currentPeriod.class && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{currentPeriod.class.name} - {currentPeriod.section?.name}</span>
                    </div>
                  )}
                  {currentPeriod.roomNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Room {currentPeriod.roomNumber}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            </CardContent>
          </Card>
        )}

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {DAYS.map(day => (
          <button
            key={day.value}
            onClick={() => setSelectedDay(day.value)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedDay === day.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Timetable for Selected Day */}
      <div className="space-y-3">
        {getDayEntries(selectedDay).length > 0 ? (
          getDayEntries(selectedDay).map(entry => (
            <Card key={entry.id} className={entry.period.isBreak ? 'bg-muted/50' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 text-primary">
                        <div className="text-center">
                          <div className="text-xs font-medium">
                            {entry.period.startTime.split(':')[0]}
                          </div>
                          <div className="text-xs">
                            {entry.period.startTime.split(':')[1]}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {entry.period.isBreak ? entry.period.name : entry.subject?.name || 'Free Period'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {entry.period.startTime} - {entry.period.endTime}
                        </p>
                      </div>
                    </div>
                    
                    {!entry.period.isBreak && entry.subject && (
                      <div className="flex flex-wrap gap-4 ml-[76px]">
                        {user?.role === 'student' && entry.teacher && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{entry.teacher.name}</span>
                          </div>
                        )}
                        {user?.role === 'teacher' && entry.class && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{entry.class.name} - {entry.section?.name}</span>
                          </div>
                        )}
                        {entry.roomNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>Room {entry.roomNumber}</span>
                          </div>
                        )}
                        {entry.subject.code && (
                          <Badge variant="outline">{entry.subject.code}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {entry.period.isBreak && (
                    <Badge variant="secondary">Break</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No classes scheduled for this day</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}