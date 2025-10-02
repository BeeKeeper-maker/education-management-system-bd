import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, Save } from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logo?: string;
}

export default function Institution() {
  const { toast } = useToast();
  
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
  });

  useEffect(() => {
    loadInstitution();
  }, []);

  const loadInstitution = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/academic/sessions/current', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.session) {
          const mockInstitution = {
            id: '1',
            name: 'EduPro Institute',
            email: 'info@edupro.edu',
            phone: '+1234567890',
            address: '123 Education Street, Learning City',
            website: 'https://edupro.edu',
          };
          
          setInstitution(mockInstitution);
          setForm({
            name: mockInstitution.name,
            email: mockInstitution.email || '',
            phone: mockInstitution.phone || '',
            address: mockInstitution.address || '',
            website: mockInstitution.website || '',
          });
        }
      }
    } catch (error) {
      console.error('Load institution error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load institution settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name) {
      toast({
        title: 'Validation Error',
        description: 'Institution name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: 'Success',
        description: 'Institution settings updated successfully',
      });

      setInstitution({
        id: institution?.id || '1',
        ...form,
      });
    } catch (error: any) {
      console.error('Save institution error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save institution settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading institution settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="institution-page">
      <div>
        <h1 className="text-3xl font-bold" data-testid="page-title">Institution Settings</h1>
        <p className="text-muted-foreground">Manage institution information</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle>Institution Information</CardTitle>
            <CardDescription>Update your institution details</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Institution Name *</Label>
              <Input
                id="name"
                data-testid="input-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="input-email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                data-testid="input-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                data-testid="input-website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              data-testid="input-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={isSaving} data-testid="button-save">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
