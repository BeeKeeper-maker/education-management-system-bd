import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, Check, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const studentAdmissionSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  
  // Guardian Information
  guardianName: z.string().min(1, 'Guardian name is required'),
  guardianPhone: z.string().min(1, 'Guardian phone is required'),
  guardianEmail: z.string().email().optional().or(z.literal('')),
  guardianRelation: z.string().optional(),
  emergencyContact: z.string().optional(),
  
  // Academic Information
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  admissionNumber: z.string().optional(),
  admissionDate: z.string().optional(),
  rollNumber: z.string().optional(),
  previousSchool: z.string().optional(),
  
  // Medical Information
  medicalInfo: z.string().optional(),
});

type StudentAdmissionFormData = z.infer<typeof studentAdmissionSchema>;

const steps = [
  { id: 1, name: 'Personal Information', description: 'Basic student details' },
  { id: 2, name: 'Guardian Information', description: 'Parent/Guardian details' },
  { id: 3, name: 'Academic Information', description: 'Class and enrollment details' },
  { id: 4, name: 'Additional Information', description: 'Medical and other details' },
];

export default function StudentAdmission() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<StudentAdmissionFormData>({
    resolver: zodResolver(studentAdmissionSchema),
    defaultValues: {
      admissionDate: new Date().toISOString().split('T')[0],
    },
  });

  const selectedGender = watch('gender');
  const selectedClassId = watch('classId');
  const selectedSectionId = watch('sectionId');

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await apiClient.get('/academic/classes');
      return response.data;
    },
  });

  // Fetch sections based on selected class
  const { data: sectionsData } = useQuery({
    queryKey: ['sections', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const response = await apiClient.get(`/academic/classes/${selectedClassId}/sections`);
      return response.data;
    },
    enabled: !!selectedClassId,
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (data: StudentAdmissionFormData) => {
      return await apiClient.post('/students', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: 'Success',
        description: 'Student admitted successfully',
      });
      setLocation('/students');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to admit student',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: StudentAdmissionFormData) => {
    createStudentMutation.mutate(data);
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['firstName', 'lastName', 'email', 'password', 'dateOfBirth', 'gender'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['guardianName', 'guardianPhone'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['classId', 'sectionId'];
    }

    const isValid = await trigger(fieldsToValidate as any);
    
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const classes = classesData || [];
  const sections = sectionsData || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Student Admission</h1>
        <p className="text-muted-foreground mt-2">
          Enroll a new student into the institution
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {steps.map((step, stepIdx) => (
                <li key={step.id} className={cn(
                  'relative',
                  stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''
                )}>
                  {currentStep > step.id ? (
                    <>
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="h-0.5 w-full bg-primary" />
                      </div>
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                        <Check className="h-5 w-5 text-primary-foreground" />
                      </div>
                    </>
                  ) : currentStep === step.id ? (
                    <>
                      {stepIdx !== 0 && (
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="h-0.5 w-full bg-muted" />
                        </div>
                      )}
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background">
                        <span className="text-primary font-semibold">{step.id}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {stepIdx !== 0 && (
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="h-0.5 w-full bg-muted" />
                        </div>
                      )}
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background">
                        <span className="text-muted-foreground">{step.id}</span>
                      </div>
                    </>
                  )}
                  <div className="mt-2 hidden sm:block">
                    <p className="text-sm font-medium">{step.name}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].name}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" {...register('firstName')} placeholder="John" />
                    {errors.firstName && (
                      <p className="text-xs text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" {...register('lastName')} placeholder="Doe" />
                    {errors.lastName && (
                      <p className="text-xs text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" {...register('email')} placeholder="john.doe@example.com" />
                  {errors.email && (
                    <p className="text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" type="password" {...register('password')} placeholder="••••••••" />
                  {errors.password && (
                    <p className="text-xs text-red-600">{errors.password.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    This will be the student's login password
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
                    {errors.dateOfBirth && (
                      <p className="text-xs text-red-600">{errors.dateOfBirth.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={selectedGender} onValueChange={(value) => setValue('gender', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-xs text-red-600">{errors.gender.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Input id="bloodGroup" {...register('bloodGroup')} placeholder="A+" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...register('phone')} placeholder="+1234567890" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" {...register('address')} placeholder="123 Main St, City, Country" />
                </div>
              </div>
            )}

            {/* Step 2: Guardian Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian Name *</Label>
                    <Input id="guardianName" {...register('guardianName')} placeholder="Robert Smith" />
                    {errors.guardianName && (
                      <p className="text-xs text-red-600">{errors.guardianName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianRelation">Relation</Label>
                    <Input id="guardianRelation" {...register('guardianRelation')} placeholder="Father" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianPhone">Guardian Phone *</Label>
                    <Input id="guardianPhone" {...register('guardianPhone')} placeholder="+1234567890" />
                    {errors.guardianPhone && (
                      <p className="text-xs text-red-600">{errors.guardianPhone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianEmail">Guardian Email</Label>
                    <Input id="guardianEmail" type="email" {...register('guardianEmail')} placeholder="guardian@example.com" />
                    {errors.guardianEmail && (
                      <p className="text-xs text-red-600">{errors.guardianEmail.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input id="emergencyContact" {...register('emergencyContact')} placeholder="+1234567890" />
                  <p className="text-xs text-muted-foreground">
                    Alternative contact number in case of emergency
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Academic Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classId">Class *</Label>
                    <Select value={selectedClassId} onValueChange={(value) => {
                      setValue('classId', value);
                      setValue('sectionId', ''); // Reset section when class changes
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls: any) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.classId && (
                      <p className="text-xs text-red-600">{errors.classId.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sectionId">Section *</Label>
                    <Select 
                      value={selectedSectionId} 
                      onValueChange={(value) => setValue('sectionId', value)}
                      disabled={!selectedClassId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section: any) => (
                          <SelectItem key={section.id} value={section.id}>
                            Section {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.sectionId && (
                      <p className="text-xs text-red-600">{errors.sectionId.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admissionNumber">Admission Number</Label>
                    <Input id="admissionNumber" {...register('admissionNumber')} placeholder="ADM2024001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admissionDate">Admission Date</Label>
                    <Input id="admissionDate" type="date" {...register('admissionDate')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number</Label>
                    <Input id="rollNumber" {...register('rollNumber')} placeholder="001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="previousSchool">Previous School</Label>
                    <Input id="previousSchool" {...register('previousSchool')} placeholder="ABC School" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Additional Information */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="medicalInfo">Medical Information</Label>
                  <textarea
                    id="medicalInfo"
                    {...register('medicalInfo')}
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Any allergies, medical conditions, or special requirements..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Include any important medical information, allergies, or special needs
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Review Information</h4>
                  <p className="text-sm text-muted-foreground">
                    Please review all the information before submitting. You can go back to previous steps to make changes.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={createStudentMutation.isPending}>
              {createStudentMutation.isPending ? (
                'Admitting...'
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Admit Student
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}