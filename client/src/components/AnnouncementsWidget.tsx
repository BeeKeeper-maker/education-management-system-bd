import { useState, useEffect } from 'react';
import { Bell, Pin, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  isPinned: boolean;
  publishedAt: string;
  expiresAt: string | null;
}

export default function AnnouncementsWidget() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchAnnouncements();
    }
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`/api/announcements/user/${user?.id}?limit=5`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <CardTitle>Announcements</CardTitle>
          </div>
          {announcements.length > 0 && (
            <Badge variant="secondary">{announcements.length}</Badge>
          )}
        </div>
        <CardDescription>Latest updates and notices</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No announcements at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-4 rounded-lg border ${
                  announcement.isPinned ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                } hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {announcement.isPinned && <Pin className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                    <h4 className="font-semibold text-sm line-clamp-1">{announcement.title}</h4>
                  </div>
                  <Badge className={`${getPriorityColor(announcement.priority)} text-xs`}>
                    {announcement.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {truncateContent(announcement.content)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(announcement.publishedAt).toLocaleDateString()}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    Read more
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}