import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useToast } from '../components/ui/use-toast';
import { Plus, Edit, Eye, Trash2, DollarSign } from 'lucide-react';

interface FeeCategory {
  id: string;
  name: string;
  description: string;
}

interface FeeStructure {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  academicSession: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Class {
  id: string;
  name: string;
}

interface AcademicSession {
  id: string;
  name: string;
  isCurrent: boolean;
}

export default function FeeStructures() {
  const { toast } = useToast();
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    academicSessionId: '',
    classId: '',
    description: '',
    items: [] as Array<{ feeCategoryId: string; amount: number; dueDate: string; isOptional: boolean }>,
  });

  useEffect(() => {
    fetchStructures();
    fetchCategories();
    fetchClasses();
    fetchSessions();
  }, []);

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fees/structures', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setStructures(data.data);
      }
    } catch (error) {
      console.error('Error fetching fee structures:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/fees/categories', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

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

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/academic/sessions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
        const currentSession = data.data.find((s: AcademicSession) => s.isCurrent);
        if (currentSession) {
          setFormData(prev => ({ ...prev, academicSessionId: currentSession.id }));
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const addFeeItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { feeCategoryId: '', amount: 0, dueDate: '', isOptional: false }],
    }));
  };

  const updateFeeItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const removeFeeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const createStructure = async () => {
    try {
      const response = await fetch('/api/fees/structures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Fee structure created successfully',
        });
        setDialogOpen(false);
        resetForm();
        fetchStructures();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create fee structure',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    const currentSession = sessions.find(s => s.isCurrent);
    setFormData({
      name: '',
      academicSessionId: currentSession?.id || '',
      classId: '',
      description: '',
      items: [],
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fee Structures</h1>
          <p className="text-muted-foreground">Manage fee structures and templates</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Fee Structure
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Structures</p>
              <p className="text-3xl font-bold">{structures.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-green-600">Active</p>
              <p className="text-3xl font-bold text-green-600">
                {structures.filter(s => s.isActive).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Fee Categories</p>
              <p className="text-3xl font-bold">{categories.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Structures List */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading fee structures...</p>
            </div>
          </CardContent>
        </Card>
      ) : structures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {structures.map(structure => (
            <Card key={structure.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{structure.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {structure.academicSession.name}
                      {structure.class && ` • ${structure.class.name}`}
                    </CardDescription>
                  </div>
                  {structure.isActive && (
                    <Badge className="bg-green-600">Active</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {structure.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {structure.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No fee structures created yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Fee Structure
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Fee Structure</DialogTitle>
            <DialogDescription>Define a new fee structure template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Structure Name *</Label>
              <Input
                placeholder="e.g., Class 1 Annual Fees 2024-25"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Session *</Label>
                <Select
                  value={formData.academicSessionId}
                  onValueChange={value => setFormData({ ...formData, academicSessionId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map(session => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.name} {session.isCurrent && '(Current)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Class (Optional)</Label>
                <Select
                  value={formData.classId}
                  onValueChange={value => setFormData({ ...formData, classId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of this fee structure"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base">Fee Items</Label>
                <Button size="sm" variant="outline" onClick={addFeeItem}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Select
                        value={item.feeCategoryId}
                        onValueChange={value => updateFeeItem(index, 'feeCategoryId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        placeholder="Amount"
                        value={item.amount || ''}
                        onChange={e => updateFeeItem(index, 'amount', parseFloat(e.target.value) || 0)}
                      />

                      <Input
                        type="date"
                        placeholder="Due Date"
                        value={item.dueDate}
                        onChange={e => updateFeeItem(index, 'dueDate', e.target.value)}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFeeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}

                {formData.items.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No fee items added yet</p>
                    <Button size="sm" variant="outline" onClick={addFeeItem} className="mt-2">
                      <Plus className="mr-1 h-4 w-4" />
                      Add First Item
                    </Button>
                  </div>
                )}
              </div>

              {formData.items.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={createStructure}
                disabled={!formData.name || !formData.academicSessionId || formData.items.length === 0}
              >
                Create Structure
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}