import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

const institutionSchema = z.object({
  name: z.string().min(1, 'Institution name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type InstitutionFormData = z.infer<typeof institutionSchema>;

export default function Institution() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InstitutionFormData>({
    resolver: zodResolver(institutionSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
    },
  });

  const { data: sessionData, isLoading, error } = useQuery({
    queryKey: ['academic', 'sessions', 'current'],
    queryFn: async () => {
      const response = await apiClient.get('/academic/sessions/current');
      return response.data;
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load institution settings',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (sessionData?.session) {
      form.reset({
        name: sessionData.session.name || 'EduPro Institute',
        email: sessionData.session.email || '',
        phone: sessionData.session.phone || '',
        address: sessionData.session.address || '',
        website: sessionData.session.website || '',
      });
    }
  }, [sessionData, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: InstitutionFormData) => {
      return await apiClient.put('/academic/institution', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic', 'sessions', 'current'] });
      toast({
        title: 'Success',
        description: 'Institution settings updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save institution settings',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InstitutionFormData) => {
    updateMutation.mutate(data);
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

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6" data-testid="institution-page">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Institution Settings</h1>
          <p className="text-muted-foreground">Manage institution information</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground" data-testid="error-state">
              <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Failed to load institution settings</p>
              <p className="text-sm">Please try refreshing the page</p>
            </div>
          </CardContent>
        </Card>
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
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Institution Name *</Label>
                <Input
                  id="name"
                  data-testid="input-name"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="input-email"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  data-testid="input-phone"
                  {...form.register('phone')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  data-testid="input-website"
                  {...form.register('website')}
                />
                {form.formState.errors.website && (
                  <p className="text-sm text-red-600">{form.formState.errors.website.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                data-testid="input-address"
                {...form.register('address')}
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-save"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
